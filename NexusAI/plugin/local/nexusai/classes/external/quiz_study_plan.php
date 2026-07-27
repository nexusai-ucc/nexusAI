<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_study_plan`.
 *
 * Plan de estudio personalizado: combina el historial de errores de quiz
 * del alumno con las preguntas del chat que el material no pudo responder
 * bien, y devuelve una lista unificada de temas débiles rankeada.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_study_plan extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 30),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'topics'    => new \external_multiple_structure(
                new \external_single_structure([
                    'topic'                => new \external_value(PARAM_RAW, 'Tema débil identificado por la IA'),
                    'quiz_error_count'     => new \external_value(PARAM_INT, 'Errores de quiz que sustentan este tema'),
                    'gap_count'            => new \external_value(PARAM_INT, 'Preguntas de chat sin responder que sustentan este tema'),
                    'reason'               => new \external_value(PARAM_RAW, 'Por qué es un tema débil'),
                    'suggested_quiz_topic' => new \external_value(PARAM_RAW, 'Tema sugerido para precargar el generador de quiz'),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 30): array {
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
        $response = $client->quiz_study_plan((int) $params['courseid'], (int) $USER->id, $days);

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'topics'    => array_map(
                static fn(array $t): array => [
                    'topic'                => (string) ($t['topic'] ?? ''),
                    'quiz_error_count'     => (int) ($t['quiz_error_count'] ?? 0),
                    'gap_count'            => (int) ($t['gap_count'] ?? 0),
                    'reason'               => (string) ($t['reason'] ?? ''),
                    'suggested_quiz_topic' => (string) ($t['suggested_quiz_topic'] ?? ($t['topic'] ?? '')),
                ],
                $response['topics'] ?? []
            ),
        ];
    }
}
