<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_document_pre_exam_summary`.
 *
 * Proxy entre React y el endpoint /api/v1/documents/pre-exam-summary del
 * backend Python. Genera un resumen de repaso combinando todo el material
 * indexado relevante para un próximo examen, opcionalmente acotado a una
 * unidad/sección del curso (BUS-04).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class document_pre_exam_summary extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso de Moodle', VALUE_REQUIRED),
            'section'  => new \external_value(PARAM_INT, 'Unidad/sección opcional', VALUE_OPTIONAL, null, NULL_ALLOWED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'summary'          => new \external_value(PARAM_RAW, 'Resumen de repaso generado por IA'),
            'documents_used'   => new \external_multiple_structure(
                new \external_single_structure([
                    'document_id' => new \external_value(PARAM_RAW,  'UUID del documento'),
                    'filename'    => new \external_value(PARAM_TEXT, 'Nombre del archivo'),
                ])
            ),
            'total_documents'  => new \external_value(PARAM_INT, 'Cantidad de documentos usados'),
        ]);
    }

    public static function execute(int $courseid, ?int $section = null): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'section'  => $section,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->pre_exam_summary(
            (int) $params['courseid'],
            (int) $USER->id,
            isset($params['section']) ? (int) $params['section'] : null
        );

        return [
            'summary'         => (string) ($response['summary'] ?? ''),
            'documents_used'  => array_map(
                static fn(array $d) => [
                    'document_id' => (string) ($d['document_id'] ?? ''),
                    'filename'    => (string) ($d['filename'] ?? ''),
                ],
                $response['documents_used'] ?? []
            ),
            'total_documents' => (int) ($response['total_documents'] ?? 0),
        ];
    }
}
