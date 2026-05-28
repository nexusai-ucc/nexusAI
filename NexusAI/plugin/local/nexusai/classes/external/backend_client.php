<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Cliente HTTP autenticado contra el backend Python NexusAI (FastAPI).
 *
 * Implementa el lado PHP del esquema de autenticación HMAC documentado en
 * ADR-005 y en `services/api/app/auth/hmac.py`. Cada request lleva 4 headers:
 *
 *   Authorization: Bearer <NEXUSAI_API_KEY>
 *   X-Timestamp:   <unix epoch>
 *   X-Nonce:       <UUID v4>
 *   X-Signature:   <hex_hmac_sha256(NEXUSAI_SHARED_SECRET, timestamp || nonce || body)>
 *
 * El orden de concatenación de la firma DEBE ser exactamente el mismo del lado
 * del backend Python — cualquier desincronización rompe TODAS las requests.
 *
 * Usa `\curl` de Moodle (lib/filelib.php), que respeta automáticamente:
 *   - $CFG->proxyhost / $CFG->proxyport (proxies universitarios)
 *   - $CFG->curlsecurityblockedhosts (blacklist)
 *   - $CFG->curlsecurityallowedport (whitelist puertos)
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

class backend_client {

    /** @var string Endpoint base del backend (ej: http://localhost:8001) */
    private string $endpoint;

    /** @var string Bearer API key del backend */
    private string $apikey;

    /** @var string Shared secret para HMAC (32 bytes hex) */
    private string $secret;

    /**
     * Constructor que lee la config del plugin desde `local_nexusai/*`.
     *
     * @throws \moodle_exception Si falta cualquiera de los 3 valores de config.
     */
    public function __construct() {
        $endpoint = get_config('local_nexusai', 'api_endpoint');
        $apikey   = get_config('local_nexusai', 'api_key');
        $secret   = get_config('local_nexusai', 'shared_secret');

        // Validaciones de defensa: si el admin no completó la config, fallamos
        // con un error claro en lugar de mandar requests rotas al backend.
        if (empty($endpoint)) {
            throw new \moodle_exception(
                'errorconfigmissing', 'local_nexusai', '', 'API endpoint'
            );
        }
        if (empty($apikey)) {
            throw new \moodle_exception(
                'errorconfigmissing', 'local_nexusai', '', 'API key'
            );
        }
        if (empty($secret)) {
            throw new \moodle_exception(
                'errorconfigmissing', 'local_nexusai', '', 'Shared secret'
            );
        }

        // Normalizar endpoint: sin trailing slash para evitar `//api/v1/...`.
        $this->endpoint = rtrim($endpoint, '/');
        $this->apikey   = $apikey;
        $this->secret   = $secret;
    }

    /**
     * Envía un mensaje del alumno al endpoint /api/v1/chat/messages del backend.
     *
     * @param int         $courseid   ID del curso (validado contra contexto antes de llegar acá).
     * @param int         $userid     ID del usuario logueado (= $USER->id, no del cliente).
     * @param string      $question   Pregunta del alumno (1..2000 chars, validado por external_api).
     * @param string|null $sessionid  UUID de sesión existente, o null para crear una nueva.
     * @return array{session_id: string, answer: string, messages: array}
     *
     * @throws \moodle_exception Si el backend devuelve no-200 o si la red falla.
     */
    public function send_message(int $courseid, int $userid, string $question, ?string $sessionid = null): array {
        // Body como JSON con formato estable. Las claves usan snake_case porque
        // así las define el contrato Pydantic del backend (ChatRequest).
        $payload = [
            'question'  => $question,
            'course_id' => $courseid,
            'user_id'   => $userid,
        ];
        if (!empty($sessionid)) {
            $payload['session_id'] = $sessionid;
        }

        // CRÍTICO: el body firmado tiene que ser EXACTAMENTE el string que se
        // envía como POST. Cualquier reformateo de JSON entre firmar y enviar
        // rompe la firma. Por eso construimos el string acá y lo reusamos.
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/chat/messages', $body);
    }

    /**
     * Envía un mensaje del alumno con contexto de múltiples cursos (Feature B).
     *
     * El backend buscará material en TODOS los cursos de la lista, no solo en
     * el "curso primario". Los nombres de materia permiten que el LLM cite
     * de qué curso vino cada fragmento.
     *
     * @param int[]       $courseids   IDs de cursos a consultar (>= 1).
     * @param array       $coursenames Mapa {string(courseid) => nombre}.
     * @param int         $userid      $USER->id real del alumno.
     * @param string      $question    Pregunta del alumno.
     * @param string|null $sessionid   UUID de sesión existente, o null para crear.
     * @return array{session_id:string, answer:string, messages:array}
     *
     * @throws \moodle_exception Si el backend devuelve no-2xx o falla la red.
     */
    public function send_message_multicourse(
        array $courseids,
        array $coursenames,
        int $userid,
        string $question,
        ?string $sessionid = null
    ): array {
        // course_id principal: el primero de la lista (el schema lo exige > 0
        // por compat con clientes single-curso).
        $primarycourseid = !empty($courseids) ? (int) $courseids[0] : 0;

        $payload = [
            'question'     => $question,
            'course_id'    => $primarycourseid,
            'user_id'      => $userid,
            'course_ids'   => array_map('intval', $courseids),
            'course_names' => $coursenames,
        ];
        if (!empty($sessionid)) {
            $payload['session_id'] = $sessionid;
        }

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/chat/messages', $body);
    }

    /**
     * Lista las sesiones previas del usuario (historial — Feature E).
     *
     * @param int      $userid   $USER->id real.
     * @param int|null $courseid Filtrar por curso, o null para todas las del user.
     * @param int      $limit    Máximo (1..100).
     * @return array{sessions: array}
     */
    public function list_sessions(int $userid, ?int $courseid = null, int $limit = 20): array {
        $payload = [
            'user_id' => $userid,
            'limit'   => $limit,
        ];
        if ($courseid !== null && $courseid > 0) {
            $payload['course_id'] = $courseid;
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/sessions/list', $body);
    }

    /**
     * Devuelve los mensajes completos de una sesión.
     *
     * @param int    $userid    $USER->id real (el backend valida ownership).
     * @param string $sessionid UUID de la sesión.
     * @return array{session_id:string, messages: array}
     */
    public function get_session_messages(int $userid, string $sessionid): array {
        $payload = [
            'user_id'    => $userid,
            'session_id' => $sessionid,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/chat/sessions/messages', $body);
    }

    /**
     * Genera un quiz de práctica desde el material indexado del curso (Feature F).
     *
     * @param int         $courseid     ID del curso.
     * @param int         $userid       $USER->id real.
     * @param string|null $topic        Tema opcional. Si vacío, variedad aleatoria.
     * @param int         $numquestions Cantidad de preguntas (1..10).
     * @return array{course_id:int, topic:?string, questions:array}
     */
    public function generate_quiz(int $courseid, int $userid, ?string $topic, int $numquestions): array {
        $payload = [
            'course_id'     => $courseid,
            'user_id'       => $userid,
            'num_questions' => $numquestions,
        ];
        if ($topic !== null && trim($topic) !== '') {
            $payload['topic'] = trim($topic);
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/quiz/generate', $body);
    }

    /**
     * Búsqueda semántica en el material del curso (Feature A — sin LLM).
     *
     * @param int    $courseid ID del curso de Moodle.
     * @param int    $userid   $USER->id real del usuario.
     * @param string $query    Consulta (1..500 chars).
     * @param int    $topk     Resultados máximos (1..10).
     * @return array{query:string, results:array, total:int}
     *
     * @throws \moodle_exception Si el backend devuelve no-2xx o falla la red.
     */
    public function search(int $courseid, int $userid, string $query, int $topk = 5): array {
        $payload = [
            'query'     => $query,
            'course_id' => $courseid,
            'user_id'   => $userid,
            'top_k'     => $topk,
        ];
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }
        return $this->post('/api/v1/search', $body);
    }

    /**
     * Upload de un documento al backend para indexación RAG.
     *
     * El archivo viaja como base64 dentro de un JSON (no multipart) para que el
     * HMAC sea predictible. Ver decisión arquitectónica en
     * services/api/app/documents/router.py.
     *
     * @param int    $courseid     ID del curso (validado por la external function).
     * @param int    $uploaderid   $USER->id real del docente (no del cliente).
     * @param string $filename     Nombre del archivo.
     * @param string $mimetype     MIME type (solo 'application/pdf' aceptado en MVP).
     * @param string $filebytes    Contenido binario del archivo (raw, NO base64).
     * @return array{id:string, course_id:int, uploader_id:int, filename:string, mime_type:string, status:string, error_message:?string}
     *
     * @throws \moodle_exception Si el backend rechaza o la red falla.
     */
    public function upload_document(int $courseid, int $uploaderid, string $filename, string $mimetype, string $filebytes): array {
        $payload = [
            'course_id'   => $courseid,
            'uploader_id' => $uploaderid,
            'filename'    => $filename,
            'mime_type'   => $mimetype,
            'content_b64' => base64_encode($filebytes),
        ];

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'JSON encode failed');
        }

        return $this->post('/api/v1/documents', $body);
    }

    /**
     * Lista los documentos indexados de un curso.
     *
     * @param int $courseid ID del curso de Moodle.
     * @return array Lista de documentos con su estado actual.
     */
    public function list_documents(int $courseid): array {
        return $this->get('/api/v1/documents?course_id=' . $courseid);
    }

    /**
     * Estado de un documento individual (polling durante indexación).
     *
     * @param string $documentid UUID del documento.
     * @return array Estado actual del documento.
     */
    public function get_document(string $documentid): array {
        return $this->get('/api/v1/documents/' . $documentid);
    }

    /**
     * Borra un documento. El backend hace CASCADE sobre los chunks asociados.
     *
     * @param string $documentid UUID del documento.
     */
    public function delete_document(string $documentid): void {
        $this->delete('/api/v1/documents/' . $documentid);
    }

    /**
     * GET autenticado con HMAC. Body firmado = string vacío.
     *
     * @param string $path Path relativo (ej: '/api/v1/documents?course_id=1').
     * @return array Decodificado del response.
     */
    private function get(string $path): array {
        return $this->request('GET', $path, '');
    }

    /**
     * DELETE autenticado con HMAC. Body firmado = string vacío.
     *
     * @param string $path Path relativo.
     */
    private function delete(string $path): void {
        $this->request('DELETE', $path, '', expectjson: false);
    }

    /**
     * POST autenticado al backend con HMAC + Bearer.
     *
     * @param string $path  Path relativo (ej: '/api/v1/chat/messages').
     * @param string $body  Body raw como string JSON.
     * @return array Decodificado del response (claves del backend Python).
     *
     * @throws \moodle_exception Si el HTTP status no es 200, o si el JSON viene roto.
     */
    private function post(string $path, string $body): array {
        return $this->request('POST', $path, $body);
    }

    /**
     * Request HTTP autenticada con HMAC + Bearer. Soporta GET/POST/DELETE.
     *
     * Acepta cualquier código 2xx como éxito (no solo 200): 202 Accepted
     * para uploads async, 204 No Content para deletes.
     *
     * @param string $method     'GET' | 'POST' | 'DELETE'
     * @param string $path       Path relativo (ej: '/api/v1/chat/messages')
     * @param string $body       Body firmado (vacío para GET/DELETE)
     * @param bool   $expectjson Si la respuesta debe ser JSON parseable.
     *                           false para 204 No Content.
     * @return array Decodificado del response (vacío si expectjson=false).
     *
     * @throws \moodle_exception Si HTTP status no es 2xx o si el JSON viene roto.
     */
    private function request(string $method, string $path, string $body, bool $expectjson = true): array {
        $timestamp = (string) time();
        $nonce     = self::generate_nonce();
        $signature = self::compute_signature($this->secret, $timestamp, $nonce, $body);

        // Usamos la clase \curl de Moodle (no `curl_*` de PHP), que aplica
        // automáticamente la config de proxy / blocked hosts del sitio.
        require_once($GLOBALS['CFG']->libdir . '/filelib.php');
        $curl = new \curl();
        $curl->setHeader([
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apikey,
            'X-Timestamp: ' . $timestamp,
            'X-Nonce: '     . $nonce,
            'X-Signature: ' . $signature,
        ]);
        $curl->setopt([
            // 120 segundos para chat (LLM puede tardar). Para upload del PDF,
            // el backend devuelve 202 inmediato y el indexing va en background,
            // así que con 120s sobra para uploads de hasta ~20MB en redes lentas.
            'CURLOPT_TIMEOUT'        => 120,
            'CURLOPT_CONNECTTIMEOUT' => 10,
            'CURLOPT_RETURNTRANSFER' => true,
        ]);

        $url = $this->endpoint . $path;

        switch (strtoupper($method)) {
            case 'POST':
                $response = $curl->post($url, $body);
                break;
            case 'GET':
                $response = $curl->get($url);
                break;
            case 'DELETE':
                $response = $curl->delete($url);
                break;
            default:
                throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Unsupported HTTP method: ' . $method);
        }

        $info  = $curl->get_info();
        $errno = $curl->get_errno();

        if ($errno || empty($info['http_code'])) {
            throw new \moodle_exception(
                'errorbackendunreachable', 'local_nexusai', '',
                $curl->error ?? 'curl error #' . $errno
            );
        }

        $httpcode = (int) $info['http_code'];
        // Aceptar cualquier 2xx — útil para 202 Accepted (upload async) y 204
        // No Content (delete).
        if ($httpcode < 200 || $httpcode >= 300) {
            $detail = $response ?: ('HTTP ' . $httpcode);
            if (strlen($detail) > 500) {
                $detail = substr($detail, 0, 500) . '...';
            }
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'HTTP ' . $httpcode . ': ' . $detail
            );
        }

        if (!$expectjson) {
            return [];  // 204 No Content y similares.
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '', 'Invalid JSON in response'
            );
        }

        return $decoded;
    }

    /**
     * Genera un nonce UUIDv4-compatible (32 chars hex sin guiones).
     *
     * No usamos `\core\uuid::generate()` porque solo existe a partir de
     * Moodle 3.10 con namespace y queremos máxima compat con el rango 4.1-4.5.
     * `random_bytes()` está disponible desde PHP 7.0 — más que suficiente.
     *
     * @return string 32 chars hex
     */
    private static function generate_nonce(): string {
        return bin2hex(random_bytes(16));
    }

    /**
     * Calcula la firma HMAC SHA-256.
     *
     * IMPORTANTE: el orden de concatenación tiene que ser EXACTO al de
     * `services/api/app/auth/hmac.py` (linea: `signed_string = (x_timestamp + x_nonce).encode("utf-8") + body`).
     *
     * @param string $secret     32-byte hex
     * @param string $timestamp  Unix epoch como string
     * @param string $nonce      UUID v4 como string
     * @param string $body       Body JSON raw
     * @return string Firma hex (64 chars)
     */
    private static function compute_signature(string $secret, string $timestamp, string $nonce, string $body): string {
        $signedstring = $timestamp . $nonce . $body;
        return hash_hmac('sha256', $signedstring, $secret);
    }
}
