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
 * External function `local_nexusai_document_reindex`.
 *
 * Re-corre la indexación de un documento ya subido, sin pedir un archivo
 * nuevo (CONT-09, #358) — el backend lee el archivo que ya tiene guardado
 * en disco desde el upload original. A diferencia de `document_replace`,
 * no recibe ningún contenido en la request.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_reindex extends \external_api {
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'ID del curso (para validar capability)', VALUE_REQUIRED),
            'documentid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento a reindexar', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'            => new \external_value(PARAM_ALPHANUMEXT, 'ID del documento'),
            'course_id'     => new \external_value(PARAM_INT, 'ID del curso'),
            'uploader_id'   => new \external_value(PARAM_INT, 'ID de quien subió el archivo originalmente'),
            'filename'      => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
            'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
            'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
            'error_message' => new \external_value(PARAM_RAW, 'Mensaje de error si status=error', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'created_at'    => new \external_value(PARAM_RAW, 'Timestamp de creación', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'updated_at'    => new \external_value(PARAM_RAW, 'Timestamp de última actualización', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }

    public static function execute(int $courseid, string $documentid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'   => $courseid,
            'documentid' => $documentid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client = new backend_client();

        // Defensa: verificar que el documento pertenece al curso antes de
        // reindexar (mismo criterio que document_delete/document_status).
        $document = $client->get_document($params['documentid']);
        if (((int) ($document['course_id'] ?? 0)) !== (int) $params['courseid']) {
            throw new \moodle_exception(
                'errorbackend',
                'local_nexusai',
                '',
                'Cannot reindex: document does not belong to the requested course'
            );
        }

        $response = $client->reindex_document($params['documentid']);

        return [
            'id'            => (string) ($response['id'] ?? $params['documentid']),
            'course_id'     => (int) ($response['course_id'] ?? $params['courseid']),
            'uploader_id'   => (int) ($response['uploader_id'] ?? 0),
            'filename'      => (string) ($response['filename'] ?? ''),
            'mime_type'     => (string) ($response['mime_type'] ?? ''),
            'status'        => (string) ($response['status'] ?? 'pending'),
            'error_message' => $response['error_message'] ?? null,
            'created_at'    => isset($response['created_at']) ? (string) $response['created_at'] : null,
            'updated_at'    => isset($response['updated_at']) ? (string) $response['updated_at'] : null,
        ];
    }
}
