<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_upload`.
 *
 * Recibe el contenido del archivo en base64 directamente desde React (FileReader
 * sobre drag-and-drop HTML5), valida y reenvía al backend Python.
 *
 * Decisión: NO usamos el draft area de Moodle ni el filepicker tradicional.
 * Razones:
 *   - El draft area + filepicker es server-rendered y requiere page reload.
 *     React + FileReader → base64 → AJAX da una UX fluida sin reload.
 *   - El backend Python ya espera base64 (ver app/documents/router.py),
 *     así que no agregamos overhead.
 *   - Tamaño máximo aceptado: 20 MB → en base64 dentro del JSON de la request
 *     ~27 MB. Bajo el post_max_size típico de Moodle (64 MB).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_upload extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
            'filename'    => new \external_value(PARAM_FILE, 'Nombre del archivo (con extensión)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detectado por el browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Contenido binario en base64', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento creado'),
            'course_id'     => new \external_value(PARAM_INT, 'ID del curso'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID del docente que subió'),
            'filename'      => new \external_value(PARAM_RAW, 'Nombre del archivo'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(PARAM_RAW, 'Mensaje de error si status=error', VALUE_OPTIONAL),
        ]);
    }

    /**
     * @param int    $courseid    ID del curso (el contexto del curso valida acceso).
     * @param string $filename    Nombre del archivo subido.
     * @param string $mimetype    MIME type. Solo 'application/pdf' aceptado en MVP.
     * @param string $contentb64  Contenido binario del archivo en base64.
     * @return array Document state después del upload.
     */
    public static function execute(int $courseid, string $filename, string $mimetype, string $contentb64): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'filename'    => $filename,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
        ]);

        // Validar contexto del curso + capability manage.
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        // Validar tipo MIME — solo PDF en MVP.
        if ($params['mimetype'] !== 'application/pdf') {
            throw new \invalid_parameter_exception(
                'Only PDF is supported in MVP. Got: ' . $params['mimetype']
            );
        }

        // Defensa: el filename no puede tener path traversal ni caracteres raros.
        // PARAM_FILE ya filtra la mayoría, pero re-chequeamos largo.
        if (strlen($params['filename']) === 0 || strlen($params['filename']) > 255) {
            throw new \invalid_parameter_exception('Invalid filename length');
        }

        // Validar tamaño base64 antes de decodear (ahorra memoria si está desbordado).
        // base64 inflate ~33%, así que 20 MB de archivo = ~27 MB en base64.
        // Le damos margen y rechazamos > 30 MB de base64.
        if (strlen($params['content_b64']) > 30 * 1024 * 1024) {
            throw new \invalid_parameter_exception('File too large (max 20MB)');
        }

        // Decodear base64 para obtener el binary y validar magic bytes.
        // base64_decode con strict=true rechaza caracteres no válidos.
        $filebytes = base64_decode($params['content_b64'], true);
        if ($filebytes === false || $filebytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        // Magic bytes: los PDFs empiezan con "%PDF-".
        if (substr($filebytes, 0, 5) !== '%PDF-') {
            throw new \invalid_parameter_exception('File does not look like a valid PDF');
        }

        // POST al backend con HMAC. El cliente backend re-encodea a base64
        // (sí, doble encode/decode, pero el contrato del backend está en
        // services/api/app/documents/router.py y queda más limpio así).
        $client = new backend_client();
        $response = $client->upload_document(
            (int) $params['courseid'],
            (int) $USER->id,  // SIEMPRE del server, no del cliente
            $params['filename'],
            $params['mimetype'],
            $filebytes
        );

        // Validar shape de la respuesta.
        if (!isset($response['id'], $response['status'])) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'Backend upload response is missing required fields'
            );
        }

        return [
            'id'            => (string) $response['id'],
            'course_id'     => (int) $response['course_id'],
            'uploader_id'   => (int) $response['uploader_id'],
            'filename'      => (string) $response['filename'],
            'mime_type'     => (string) $response['mime_type'],
            'status'        => (string) $response['status'],
            'error_message' => $response['error_message'] ?? null,
        ];
    }
}
