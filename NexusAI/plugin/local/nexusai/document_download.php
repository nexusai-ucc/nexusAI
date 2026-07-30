<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Descarga de documentos subidos al plugin NexusAI.
 *
 * Sirve el archivo directamente desde el file storage de Moodle, sin
 * depender del backend Python. El archivo se guarda en Moodle durante
 * el upload (ver classes/external/document_upload.php).
 *
 * Query params:
 *   - courseid  (int)    — ID del curso (para localizar el archivo en Moodle)
 *   - filename  (string) — Nombre del archivo
 *   - sesskey   (string) — CSRF token de Moodle
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

$courseid = isset($_GET['courseid']) ? (int) $_GET['courseid'] : 0;
$filename = isset($_GET['filename']) ? trim((string) $_GET['filename']) : '';

if ($courseid <= 0) {
    http_response_code(400);
    die('courseid requerido');
}

// Sanitizar filename: solo nombre de archivo, sin path traversal.
$filename = basename($filename);
if ($filename === '' || strlen($filename) > 255) {
    http_response_code(400);
    die('filename inválido');
}

$context = context_course::instance($courseid);
require_capability('local/nexusai:use', $context);

$fs   = get_file_storage();
$file = $fs->get_file($context->id, 'local_nexusai', 'documents', $courseid, '/', $filename);

if (!$file || $file->is_directory()) {
    http_response_code(404);
    die('El archivo no está disponible. Para habilitarlo, eliminá y volvé a subir el documento desde la sección Documentos del plugin.');
}

// send_stored_file maneja Content-Type, Content-Disposition, caching y rangos.
send_stored_file($file, 86400, 0, false, ['filename' => $filename]);
