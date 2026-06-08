<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Proxy de descarga de documentos originales subidos por docentes.
 *
 * El alumno abre este endpoint en una nueva pestaña. PHP valida la sesión
 * de Moodle, firma la request con HMAC y reenvía al backend FastAPI.
 * El binario del archivo se devuelve al browser con Content-Disposition.
 *
 * Query params:
 *   - document_id (UUID)  — ID del documento en el backend
 *   - courseid    (int)   — ID del curso (para validar capability)
 *   - sesskey     (string) — CSRF token de Moodle
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('NO_DEBUG_DISPLAY', true);

require_once(__DIR__ . '/../../config.php');

global $USER, $CFG;

require_login();
if (isguestuser()) {
    http_response_code(403);
    die('Acceso denegado');
}
require_sesskey();

// ----- Validar parámetros -----
$document_id = isset($_GET['document_id']) ? trim((string) $_GET['document_id']) : '';
$courseid    = isset($_GET['courseid'])    ? (int) $_GET['courseid']              : 0;

// UUID v4 format validation — prevent path traversal.
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $document_id)) {
    http_response_code(400);
    die('document_id inválido');
}

if ($courseid <= 0) {
    http_response_code(400);
    die('courseid requerido');
}

// Validar capability en el contexto del curso.
$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);

// ----- Config del backend -----
$endpoint = rtrim((string) get_config('local_nexusai', 'api_endpoint'), '/');
$apikey   = (string) get_config('local_nexusai', 'api_key');
$secret   = (string) get_config('local_nexusai', 'shared_secret');

if ($endpoint === '' || $apikey === '' || $secret === '') {
    http_response_code(500);
    die('Plugin no configurado');
}

// ----- HMAC con body vacío (GET sin body) -----
$timestamp = (string) time();
$nonce     = bin2hex(random_bytes(16));
$body      = '';
$signature = hash_hmac('sha256', $timestamp . $nonce . $body, $secret);

// ----- cURL al backend — capturamos headers de respuesta + body -----
$response_headers = [];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $endpoint . '/api/v1/documents/' . rawurlencode($document_id) . '/download',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $apikey,
        'X-Timestamp: '  . $timestamp,
        'X-Nonce: '      . $nonce,
        'X-Signature: '  . $signature,
        'Content-Length: 0',
    ],
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_CONNECTTIMEOUT => 10,
    // Capturar cada header de respuesta para extraer Content-Disposition.
    CURLOPT_HEADERFUNCTION => function ($curl, $header) use (&$response_headers) {
        $trimmed = trim($header);
        if ($trimmed !== '') {
            $response_headers[] = $trimmed;
        }
        return strlen($header);
    },
]);

$file_data  = curl_exec($ch);
$http_code  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
$content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($curl_error || $file_data === false) {
    http_response_code(502);
    die('Error de conexión al backend');
}

if ($http_code === 404) {
    http_response_code(404);
    die('Documento no encontrado o no disponible para descarga');
}

if ($http_code !== 200) {
    http_response_code(502);
    die('Error del backend: HTTP ' . (int) $http_code);
}

// ----- Extraer filename del Content-Disposition de la respuesta -----
// FastAPI FileResponse envía: Content-Disposition: attachment; filename="archivo.pdf"
$filename = '';
foreach ($response_headers as $hdr) {
    if (stripos($hdr, 'content-disposition:') === 0) {
        if (preg_match('/filename="([^"]+)"/i', $hdr, $m)) {
            $filename = $m[1];
        }
        break;
    }
}
if ($filename === '') {
    // Fallback: construir nombre desde Content-Type.
    $ext_map = [
        'application/pdf'  => '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
        'text/plain'       => '.txt',
    ];
    $clean_ct = strtolower(trim(explode(';', $content_type ?: '')[0]));
    $ext      = $ext_map[$clean_ct] ?? '';
    $filename = 'documento_' . substr($document_id, 0, 8) . $ext;
}

// ----- Enviar el archivo al browser -----
$safe_ct = $content_type ?: 'application/octet-stream';
header('Content-Type: ' . $safe_ct);
header('Content-Disposition: attachment; filename="' . str_replace('"', '', $filename) . '"');
header('Content-Length: ' . strlen($file_data));
header('Cache-Control: no-store');

echo $file_data;
exit;
