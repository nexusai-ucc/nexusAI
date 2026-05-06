<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_list`.
 *
 * Lista todos los documentos NexusAI-indexados de un curso. La vista docente
 * la usa para mostrar la tabla con estados.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_multiple_structure {
        return new \external_multiple_structure(
            new \external_single_structure([
                'id'            => new \external_value(PARAM_ALPHANUMEXT, 'UUID del documento'),
                'course_id'     => new \external_value(PARAM_INT, 'ID del curso'),
                'uploader_id'   => new \external_value(PARAM_INT, 'ID del docente que subió'),
                'filename'      => new \external_value(PARAM_RAW, 'Nombre del archivo'),
                'mime_type'     => new \external_value(PARAM_RAW, 'MIME type'),
                'status'        => new \external_value(PARAM_ALPHA, 'pending | indexing | indexed | error'),
                'error_message' => new \external_value(PARAM_RAW, 'Mensaje de error si aplica', VALUE_OPTIONAL),
            ]),
            'Lista de documentos del curso, ordenados por fecha de subida descendente'
        );
    }

    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $client = new backend_client();
        $documents = $client->list_documents((int) $params['courseid']);

        return array_map(
            static fn(array $d) => [
                'id'            => (string) ($d['id'] ?? ''),
                'course_id'     => (int) ($d['course_id'] ?? 0),
                'uploader_id'   => (int) ($d['uploader_id'] ?? 0),
                'filename'      => (string) ($d['filename'] ?? ''),
                'mime_type'     => (string) ($d['mime_type'] ?? ''),
                'status'        => (string) ($d['status'] ?? ''),
                'error_message' => $d['error_message'] ?? null,
            ],
            $documents
        );
    }
}
