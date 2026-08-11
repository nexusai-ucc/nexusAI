<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_analytics_dashboard`.
 *
 * Devuelve el dashboard agregado de métricas de un curso para el docente
 * (ANALYTICS-01/02): preguntas más frecuentes, uso diario, distribución de
 * puntajes de quiz y ratio de vacíos de contenido. Solo accesible para
 * usuarios con capability `local/nexusai:manage` (docentes y admins).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class analytics_dashboard extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 30),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id'   => new \external_value(PARAM_INT, 'ID del curso'),
            'period_days' => new \external_value(PARAM_INT, 'Ventana temporal'),
            'top_queries' => new \external_multiple_structure(
                new \external_single_structure([
                    'question' => new \external_value(PARAM_RAW, 'Pregunta'),
                    'count'    => new \external_value(PARAM_INT, 'Veces preguntada'),
                ])
            ),
            'daily_message_counts' => new \external_multiple_structure(
                new \external_single_structure([
                    'date'           => new \external_value(PARAM_RAW, 'Fecha (YYYY-MM-DD)'),
                    'message_count'  => new \external_value(PARAM_INT, 'Mensajes ese día'),
                ])
            ),
            'quiz_score_distribution' => new \external_single_structure([
                'total_attempts' => new \external_value(PARAM_INT, 'Cantidad total de intentos'),
                'average_score'  => new \external_value(PARAM_FLOAT, 'Puntaje promedio'),
                'buckets'        => new \external_multiple_structure(
                    new \external_single_structure([
                        'range' => new \external_value(PARAM_RAW, 'Rango del bucket (ej. "0-20")'),
                        'count' => new \external_value(PARAM_INT, 'Intentos en ese rango'),
                    ])
                ),
            ]),
            'gaps_ratio' => new \external_single_structure([
                'gaps_detected'      => new \external_value(PARAM_INT, 'Vacíos de contenido detectados'),
                'questions_answered' => new \external_value(PARAM_INT, 'Preguntas respondidas'),
                'ratio'              => new \external_value(PARAM_FLOAT, 'gaps / (gaps + respondidas)'),
            ]),
            'topics_consulted' => new \external_value(PARAM_INT, 'Preguntas distintas (agrupadas) consultadas en el período'),
        ]);
    }

    public static function execute(int $courseid, int $days = 30): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Solo docentes / admins ven el dashboard de analytics. Los alumnos no.
        require_capability('local/nexusai:manage', $context);

        $days = max(1, min(365, (int) $params['days']));

        $client   = new backend_client();
        $response = $client->analytics_dashboard((int) $params['courseid'], $days);

        $qsd = is_array($response['quiz_score_distribution'] ?? null) ? $response['quiz_score_distribution'] : [];
        $gr  = is_array($response['gaps_ratio'] ?? null) ? $response['gaps_ratio'] : [];

        return [
            'course_id'   => (int) ($response['course_id'] ?? $params['courseid']),
            'period_days' => (int) ($response['period_days'] ?? $days),
            'top_queries' => array_map(
                static fn(array $q) => [
                    'question' => (string) ($q['question'] ?? ''),
                    'count'    => (int) ($q['count'] ?? 0),
                ],
                $response['top_queries'] ?? []
            ),
            'daily_message_counts' => array_map(
                static fn(array $d) => [
                    'date'          => (string) ($d['date'] ?? ''),
                    'message_count' => (int) ($d['message_count'] ?? 0),
                ],
                $response['daily_message_counts'] ?? []
            ),
            'quiz_score_distribution' => [
                'total_attempts' => (int) ($qsd['total_attempts'] ?? 0),
                'average_score'  => (float) ($qsd['average_score'] ?? 0.0),
                'buckets'        => array_map(
                    static fn(array $b) => [
                        'range' => (string) ($b['range'] ?? ''),
                        'count' => (int) ($b['count'] ?? 0),
                    ],
                    $qsd['buckets'] ?? []
                ),
            ],
            'gaps_ratio' => [
                'gaps_detected'      => (int) ($gr['gaps_detected'] ?? 0),
                'questions_answered' => (int) ($gr['questions_answered'] ?? 0),
                'ratio'              => (float) ($gr['ratio'] ?? 0.0),
            ],
            'topics_consulted' => (int) ($response['topics_consulted'] ?? 0),
        ];
    }
}
