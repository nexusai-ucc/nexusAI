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
     * POST autenticado al backend con HMAC + Bearer.
     *
     * @param string $path  Path relativo (ej: '/api/v1/chat/messages').
     * @param string $body  Body raw como string JSON.
     * @return array Decodificado del response (claves del backend Python).
     *
     * @throws \moodle_exception Si el HTTP status no es 200, o si el JSON viene roto.
     */
    private function post(string $path, string $body): array {
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
            // 120 segundos: las respuestas de LLM pueden tardar bastante,
            // especialmente con el modelo embebido haciendo retrieval RAG.
            'CURLOPT_TIMEOUT'        => 120,
            'CURLOPT_CONNECTTIMEOUT' => 10,
            'CURLOPT_RETURNTRANSFER' => true,
        ]);

        $url = $this->endpoint . $path;
        $response = $curl->post($url, $body);
        $info     = $curl->get_info();
        $errno    = $curl->get_errno();

        // Errores de red (DNS, conexión, timeout): el backend ni siquiera contestó.
        if ($errno || empty($info['http_code'])) {
            throw new \moodle_exception(
                'errorbackendunreachable', 'local_nexusai', '',
                $curl->error ?? 'curl error #' . $errno
            );
        }

        $httpcode = (int) $info['http_code'];
        if ($httpcode !== 200) {
            // Devolvemos el body del error si vino, para debugging.
            $detail = $response ?: ('HTTP ' . $httpcode);
            // Truncar para que no inunde los logs si el backend devuelve HTML.
            if (strlen($detail) > 500) {
                $detail = substr($detail, 0, 500) . '...';
            }
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'HTTP ' . $httpcode . ': ' . $detail
            );
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
