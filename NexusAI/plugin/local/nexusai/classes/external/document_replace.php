<?php
// This file is part of the NexusAI plugin for Moodle.
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * External function `local_nexusai_document_replace`.
 *
 * CONT-07 (#356): reemplaza el archivo de un documento existente manteniendo
 * su document_id (las citas viejas del chat siguen apuntando al mismo id).
 * Mismos validadores que document_upload.php (magic bytes, tamaño, mimetype).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * CONT-07 (#356): reemplaza el archivo de un documento existente manteniendo su document_id (las citas viejas
 * del chat siguen apuntando al mismo id).
 */
class document_replace extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
            'documentid'  => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento a reemplazar', VALUE_REQUIRED),
            'filename'    => new \external_value(PARAM_FILE, 'Nombre del archivo nuevo (con extensión)', VALUE_REQUIRED),
            'mimetype'    => new \external_value(PARAM_RAW, 'MIME type detectado por el browser', VALUE_REQUIRED),
            'content_b64' => new \external_value(PARAM_RAW, 'Contenido binario en base64', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento (sin cambios)'),
            'course_id'     => new \external_value(PARAM_INT, 'ID del curso'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID del docente que subió'),
            'filename'      => new \external_value(PARAM_RAW, 'Nombre del archivo'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'section'       => new \external_value(PARAM_INT, 'Sección asignada', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(
                PARAM_RAW,
                'Mensaje de error si status=error',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
        ]);
    }

    /** MIME types permitidos → validador de magic bytes (igual que document_upload.php). */
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'text/markdown',
        'text/html',
    ];

    /**
     * Reemplaza el archivo de un documento existente manteniendo su document_id (CONT-07, #356).
     *
     * @param int    $courseid   ID del curso (el contexto del curso valida acceso).
     * @param string $documentid UUID del documento a reemplazar.
     * @param string $filename   Nombre del archivo nuevo.
     * @param string $mimetype   MIME type: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML o TXT.
     * @param string $contentb64 Contenido binario del archivo nuevo en base64.
     * @return array Document state después del reemplazo.
     */
    public static function execute(
        int $courseid,
        string $documentid,
        string $filename,
        string $mimetype,
        string $contentb64
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'documentid'  => $documentid,
            'filename'    => $filename,
            'mimetype'    => $mimetype,
            'content_b64' => $contentb64,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        if (!in_array($params['mimetype'], self::ALLOWED_MIME_TYPES, true)) {
            throw new \invalid_parameter_exception(
                'Unsupported file type. Allowed: PDF, DOCX, PPTX, XLSX, CSV, MD, HTML, TXT. '
                . 'Got: ' . $params['mimetype']
            );
        }

        if (strlen($params['filename']) === 0 || strlen($params['filename']) > 255) {
            throw new \invalid_parameter_exception('Invalid filename length');
        }

        // Base64 inflate ~33%, así que 20 MB de archivo = ~27 MB en base64.
        if (strlen($params['content_b64']) > 30 * 1024 * 1024) {
            throw new \invalid_parameter_exception('File too large (max 20MB)');
        }

        $filebytes = base64_decode($params['content_b64'], true);
        if ($filebytes === false || $filebytes === '') {
            throw new \invalid_parameter_exception('Invalid base64 content');
        }

        self::validate_magic_bytes($filebytes, $params['mimetype']);

        $client = new backend_client();

        // Defensa: verificar que el documento pertenece al curso antes de
        // reemplazarlo (mismo criterio que document_reindex/document_delete).
        $document = $client->get_document($params['documentid']);
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Cannot replace: document does not belong to the requested course'
            );
        }

        $response = $client->replace_document(
            $params['documentid'],
            $params['filename'],
            $params['mimetype'],
            $filebytes
        );

        if (!isset($response['id'], $response['status'])) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Backend replace response is missing required fields'
            );
        }

        // Actualizar la copia en el file storage de Moodle: borrar la vieja
        // (pudo tener otro nombre) y guardar la nueva bajo el nombre actual.
        $fs = get_file_storage();
        $existing = $fs->get_file(
            $context->id,
            'local_nexusai',
            'documents',
            $params['courseid'],
            '/',
            $params['filename']
        );
        if ($existing) {
            $existing->delete();
        }
        $filerecord = [
            'contextid' => $context->id,
            'component' => 'local_nexusai',
            'filearea'  => 'documents',
            'itemid'    => (int) $params['courseid'],
            'filepath'  => '/',
            'filename'  => $params['filename'],
        ];
        $fs->create_file_from_string($filerecord, $filebytes);

        return [
            'id'            => (string) $response['id'],
            'course_id'     => (int) $response['course_id'],
            'uploader_id'   => (int) $response['uploader_id'],
            'filename'      => (string) $response['filename'],
            'mime_type'     => (string) $response['mime_type'],
            'section'       => isset($response['section']) ? (int) $response['section'] : null,
            'status'        => (string) $response['status'],
            'error_message' => $response['error_message'] ?? null,
        ];
    }

    /**
     * Verifica magic bytes contra el MIME type declarado.
     * Lanza invalid_parameter_exception si no coinciden.
     */
    private static function validate_magic_bytes(string $bytes, string $mimetype): void {
        switch ($mimetype) {
            case 'application/pdf':
                if (substr($bytes, 0, 5) !== '%PDF-') {
                    throw new \invalid_parameter_exception('File does not look like a valid PDF');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid DOCX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid PPTX');
                }
                break;
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                if (substr($bytes, 0, 4) !== "PK\x03\x04") {
                    throw new \invalid_parameter_exception('File does not look like a valid XLSX');
                }
                break;
            case 'text/plain':
            case 'text/csv':
            case 'text/markdown':
            case 'text/html':
                if (!mb_check_encoding($bytes, 'UTF-8')) {
                    throw new \invalid_parameter_exception('Text file is not valid UTF-8');
                }
                break;
        }
    }
}
