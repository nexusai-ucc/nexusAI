<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_analytics_faq_topics`.
 *
 * Devuelve las preguntas más frecuentes de los alumnos del curso, agrupadas
 * por tema mediante un LLM (DOC-D02). Solo accesible para usuarios con
 * capability `local/nexusai:manage` (docentes y admins).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class analytics_faq_topics extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 30),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id'       => new \external_value(PARAM_INT, 'ID del curso'),
            'days'            => new \external_value(PARAM_INT, 'Ventana temporal'),
            'total_questions' => new \external_value(PARAM_INT, 'Cantidad de preguntas consideradas'),
            'topics'          => new \external_multiple_structure(
                new \external_single_structure([
                    'topic'             => new \external_value(PARAM_RAW, 'Nombre del tema'),
                    'count'             => new \external_value(PARAM_INT, 'Veces preguntada (sumado dentro del tema)'),
                    'example_questions' => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Pregunta de ejemplo')
                    ),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 30): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Solo docentes / admins ven el dashboard de FAQ. Los alumnos no.
        require_capability('local/nexusai:manage', $context);

        $days = max(1, min(365, (int) $params['days']));

        $client   = new backend_client();
        $response = $client->faq_topics((int) $params['courseid'], $days);

        return [
            'course_id'       => (int) ($response['course_id'] ?? $params['courseid']),
            'days'            => (int) ($response['days'] ?? $days),
            'total_questions' => (int) ($response['total_questions'] ?? 0),
            'topics'          => array_map(
                static fn(array $t) => [
                    'topic'             => (string) ($t['topic'] ?? ''),
                    'count'             => (int) ($t['count'] ?? 0),
                    'example_questions' => array_map(
                        static fn($q) => (string) $q,
                        is_array($t['example_questions'] ?? null) ? $t['example_questions'] : []
                    ),
                ],
                $response['topics'] ?? []
            ),
        ];
    }
}
