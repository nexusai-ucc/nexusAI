<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_review_suggestions`.
 *
 * Analiza el historial de errores de quiz del alumno y devuelve sugerencias
 * de qué repasar, agrupadas por archivo fuente del curso (SP-10).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_review_suggestions extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 90),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id'    => new \external_value(PARAM_INT, 'ID del curso'),
            'total_errors' => new \external_value(PARAM_INT, 'Total de errores considerados'),
            'suggestions'  => new \external_multiple_structure(
                new \external_single_structure([
                    'source_filename'    => new \external_value(PARAM_TEXT,  'Archivo fuente', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'source_document_id' => new \external_value(PARAM_RAW,   'ID del documento fuente (best-effort)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'error_count'        => new \external_value(PARAM_INT,   'Cantidad de errores del grupo'),
                    'last_error_at'      => new \external_value(PARAM_RAW,   'ISO timestamp del último error del grupo'),
                    'topic'              => new \external_value(PARAM_RAW,   'Subtema identificado por la IA'),
                    'suggestion'         => new \external_value(PARAM_RAW,   'Sugerencia de repaso'),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 90): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $days = max(1, min(365, (int) $params['days']));

        $client   = new backend_client();
        $response = $client->quiz_review_suggestions((int) $params['courseid'], (int) $USER->id, $days);

        return [
            'course_id'    => (int) ($response['course_id'] ?? $params['courseid']),
            'total_errors' => (int) ($response['total_errors'] ?? 0),
            'suggestions'  => array_map(
                static fn(array $s): array => [
                    'source_filename'    => isset($s['source_filename']) ? (string) $s['source_filename'] : null,
                    'source_document_id' => isset($s['source_document_id']) ? (string) $s['source_document_id'] : null,
                    'error_count'        => (int) ($s['error_count'] ?? 0),
                    'last_error_at'      => (string) ($s['last_error_at'] ?? ''),
                    'topic'              => (string) ($s['topic'] ?? ''),
                    'suggestion'         => (string) ($s['suggestion'] ?? ''),
                ],
                $response['suggestions'] ?? []
            ),
        ];
    }
}
