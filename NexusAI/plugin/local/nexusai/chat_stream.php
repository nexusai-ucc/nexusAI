<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Proxy streaming Server-Sent Events entre el browser y el backend FastAPI.
 *
 * Por qué NO es una External Function:
 *   `core/ajax` y el sistema de External Functions de Moodle no soportan
 *   streaming — son request/response JSON-RPC. Para forwardear SSE chunk
 *   por chunk al browser necesitamos un endpoint PHP normal con
 *   `CURLOPT_WRITEFUNCTION` que va escribiendo al output buffer del cliente.
 *
 * Auth:
 *   - sesskey (CSRF protection de Moodle, validada con confirm_sesskey).
 *   - require_login() para garantizar sesión válida.
 *   - require_capability local/nexusai:use en el contexto del curso.
 *   - HMAC server-to-server intacto: se firma con el shared_secret y
 *     nunca se expone al browser. Mantenemos el patrón Hybrid PHP Proxy
 *     (ADR-001).
 *
 * Input: form-urlencoded o JSON con los mismos campos que chat_send:
 *   - question (string, requerido)
 *   - courseid (int, requerido)
 *   - sessionid (string|empty) — UUID de sesión existente
 *   - multicourse (bool|0/1) — Feature B
 *
 * Output: stream Server-Sent Events. Cada evento es un line de
 *   `data: {"type":"token|meta|done|error",...}\n\n`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Streaming requiere desactivar el output buffering desde el principio.
// Constantes deben definirse ANTES de cargar config.php para evitar
// que Moodle inicialice buffering propio.
define('NO_DEBUG_DISPLAY', true);
define('NO_OUTPUT_BUFFERING', true);

require_once(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/filelib.php');

global $USER, $DB, $CFG;

require_login();
if (isguestuser()) {
    http_response_code(403);
    exit;
}
require_sesskey();

// ----- Parsear input -----
// Soporta tanto JSON body como form-urlencoded (mayor flexibilidad para
// fetch() desde React).
$rawbody = file_get_contents('php://input');
$payload = json_decode($rawbody, true);
if (!is_array($payload)) {
    // Fallback a $_POST si no es JSON.
    $payload = $_POST;
}

$question    = isset($payload['question'])    ? (string) $payload['question']    : '';
$courseid    = isset($payload['courseid'])    ? (int)    $payload['courseid']    : 0;
$sessionid   = isset($payload['sessionid'])   ? (string) $payload['sessionid']   : '';
$multicourse = !empty($payload['multicourse']);

if ($courseid <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'courseid required']);
    exit;
}

// Validar capability en el contexto del curso.
$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);

// Validaciones de negocio.
$cleanquestion = trim($question);
if ($cleanquestion === '') {
    http_response_code(400);
    echo json_encode(['error' => 'question required']);
    exit;
}
if (mb_strlen($cleanquestion) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => 'question too long']);
    exit;
}
$cleansessionid = trim($sessionid);
if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid sessionid']);
    exit;
}

// ----- Armar payload para el backend Python -----
$body_array = [
    'question'  => $cleanquestion,
    'course_id' => $courseid,
    'user_id'   => (int) $USER->id,
];
if ($cleansessionid !== '') {
    $body_array['session_id'] = $cleansessionid;
}

// Feature B: resolver cursos del alumno si multicourse=true.
if ($multicourse) {
    $enrolled = enrol_get_users_courses(
        (int) $USER->id,
        true,
        ['id', 'shortname', 'fullname']
    );
    $courseids   = [];
    $coursenames = [];
    foreach ($enrolled as $course) {
        $cid = (int) $course->id;
        $courseids[] = $cid;
        $coursenames[(string) $cid] = $course->fullname ?? $course->shortname ?? 'Materia';
    }
    if (empty($courseids)) {
        $courseids   = [$courseid];
        $coursenames = [(string) $courseid => 'Materia actual'];
    }
    $body_array['course_id']    = (int) $courseids[0];
    $body_array['course_ids']   = $courseids;
    $body_array['course_names'] = $coursenames;
}

$body = json_encode($body_array, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($body === false) {
    http_response_code(500);
    echo json_encode(['error' => 'json encode failed']);
    exit;
}

// ----- Config del backend (igual que backend_client) -----
$endpoint = rtrim((string) get_config('local_nexusai', 'api_endpoint'), '/');
$apikey   = (string) get_config('local_nexusai', 'api_key');
$secret   = (string) get_config('local_nexusai', 'shared_secret');

if ($endpoint === '' || $apikey === '' || $secret === '') {
    http_response_code(500);
    echo json_encode(['error' => 'plugin not configured']);
    exit;
}

// ----- HMAC (igual ordering que backend_client::compute_signature) -----
$timestamp = (string) time();
$nonce     = bin2hex(random_bytes(16));
$signature = hash_hmac('sha256', $timestamp . $nonce . $body, $secret);

// ----- Headers SSE al browser ANTES de empezar el cURL -----
// CRÍTICO: tienen que ir antes del primer echo/flush, y NO debe haber
// output buffering por delante.
@header('Content-Type: text/event-stream');
@header('Cache-Control: no-cache');
@header('X-Accel-Buffering: no');  // por si nginx está delante

// Flush cualquier output buffer pendiente de Moodle/PHP. Sin esto los chunks
// se acumulan en memoria y el browser los recibe todos juntos al final.
while (ob_get_level() > 0) {
    @ob_end_flush();
}
@ob_implicit_flush(true);

// ----- cURL al backend Python con WRITEFUNCTION -----
// Usamos curl_* de PHP directamente (no la clase \curl de Moodle) porque
// necesitamos CURLOPT_WRITEFUNCTION para forwardear chunks tal como llegan.
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $endpoint . '/api/v1/chat/stream',
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $body,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apikey,
        'X-Timestamp: ' . $timestamp,
        'X-Nonce: '     . $nonce,
        'X-Signature: ' . $signature,
        'Accept: text/event-stream',
    ],
    CURLOPT_TIMEOUT        => 300,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_RETURNTRANSFER => false,
    // Callback que se ejecuta cada vez que llegan bytes del backend.
    // Lo único que hacemos es escribirlos al output del cliente y forzar flush.
    CURLOPT_WRITEFUNCTION  => function ($curl, $chunk) {
        echo $chunk;
        @flush();
        return strlen($chunk);
    },
]);

$ok = curl_exec($ch);

if ($ok === false) {
    $err = curl_error($ch);
    // Si ya hubo un primer flush, mandamos un evento de error SSE inline.
    echo "data: " . json_encode([
        'type'   => 'error',
        'detail' => 'backend_unreachable: ' . substr($err, 0, 200),
    ]) . "\n\n";
    @flush();
}

curl_close($ch);
exit;
