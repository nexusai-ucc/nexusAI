<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_gaps_list`.
 *
 * Devuelve los "gaps" del docente — preguntas frecuentes de alumnos que el
 * material indexado del curso no pudo responder bien. Solo accesible para
 * usuarios con capability `local/nexusai:manage` (docentes y admins).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class gaps_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 30),
            'limit'    => new \external_value(PARAM_INT, 'Máximo de items (1..100)', VALUE_OPTIONAL, 20),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'days'      => new \external_value(PARAM_INT, 'Ventana temporal'),
            'total'     => new \external_value(PARAM_INT, 'Cantidad de items'),
            'items'     => new \external_multiple_structure(
                new \external_single_structure([
                    'question'       => new \external_value(PARAM_RAW, 'Pregunta agrupada'),
                    'count'          => new \external_value(PARAM_INT, 'Veces preguntada'),
                    'last_asked_at'  => new \external_value(PARAM_RAW, 'ISO timestamp de la última'),
                    'avg_similarity' => new \external_value(PARAM_FLOAT, 'Similaridad promedio (0..1)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 30, int $limit = 20): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
            'limit'    => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Solo docentes / admins ven los gaps. Los alumnos no.
        require_capability('local/nexusai:manage', $context);

        $days  = max(1, min(365, (int) $params['days']));
        $limit = max(1, min(100, (int) $params['limit']));

        $client   = new backend_client();
        $response = $client->list_gaps((int) $params['courseid'], $days, $limit);

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'days'      => (int) ($response['days'] ?? $days),
            'total'     => (int) ($response['total'] ?? 0),
            'items'     => array_map(
                static fn(array $i) => [
                    'question'       => (string) ($i['question'] ?? ''),
                    'count'          => (int)    ($i['count'] ?? 0),
                    'last_asked_at'  => (string) ($i['last_asked_at'] ?? ''),
                    'avg_similarity' => isset($i['avg_similarity']) ? (float) $i['avg_similarity'] : null,
                ],
                $response['items'] ?? []
            ),
        ];
    }
}
