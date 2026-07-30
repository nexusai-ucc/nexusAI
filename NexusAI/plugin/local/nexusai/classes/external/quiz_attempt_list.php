<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_attempt_list`.
 *
 * Devuelve el historial de quizzes completados por el alumno en un curso
 * (SP-09 — historial por alumno). Cada alumno ve solo su propio historial
 * ($USER->id, nunca un parámetro del cliente).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_attempt_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso',              VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 90),
            'limit'    => new \external_value(PARAM_INT, 'Máximo de items (1..100)',  VALUE_OPTIONAL, 20),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'total'     => new \external_value(PARAM_INT, 'Cantidad de items'),
            'items'     => new \external_multiple_structure(
                new \external_single_structure([
                    'id'              => new \external_value(PARAM_RAW,          'UUID del intento'),
                    'question_type'   => new \external_value(PARAM_ALPHANUMEXT,  'Tipo de quiz (opcional)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'difficulty'      => new \external_value(PARAM_ALPHA,        'Dificultad'),
                    'topic'           => new \external_value(PARAM_RAW,          'Tema (opcional)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'total_questions' => new \external_value(PARAM_INT,          'Total de preguntas'),
                    'correct_answers' => new \external_value(PARAM_INT,          'Respuestas correctas'),
                    'score'           => new \external_value(PARAM_FLOAT,        'Score 0.0-1.0 calculado server-side'),
                    'created_at'      => new \external_value(PARAM_RAW,          'ISO timestamp'),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 90, int $limit = 20): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
            'limit'    => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $days  = max(1, min(365, (int) $params['days']));
        $limit = max(1, min(100, (int) $params['limit']));

        $client   = new backend_client();
        $response = $client->list_quiz_attempts((int) $params['courseid'], (int) $USER->id, $days, $limit);

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'total'     => (int) ($response['total'] ?? 0),
            'items'     => array_map(
                static function (array $i): array {
                    return [
                        'id'              => (string) ($i['id'] ?? ''),
                        'question_type'   => isset($i['question_type']) ? (string) $i['question_type'] : null,
                        'difficulty'      => (string) ($i['difficulty'] ?? 'medium'),
                        'topic'           => isset($i['topic']) ? (string) $i['topic'] : null,
                        'total_questions' => (int) ($i['total_questions'] ?? 0),
                        'correct_answers' => (int) ($i['correct_answers'] ?? 0),
                        'score'           => (float) ($i['score'] ?? 0.0),
                        'created_at'      => (string) ($i['created_at'] ?? ''),
                    ];
                },
                $response['items'] ?? []
            ),
        ];
    }
}
