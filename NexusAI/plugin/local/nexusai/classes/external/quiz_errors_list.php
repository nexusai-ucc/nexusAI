<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_errors_list`.
 *
 * Devuelve el historial de preguntas que el alumno respondió mal en quizes
 * de un curso (SP-10 — repaso basado en errores). Cada alumno ve solo su
 * propio historial ($USER->id, nunca un parámetro del cliente).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_errors_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Días hacia atrás (1..365)', VALUE_OPTIONAL, 90),
            'limit'    => new \external_value(PARAM_INT, 'Máximo de items (1..200)', VALUE_OPTIONAL, 100),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'ID del curso'),
            'total'     => new \external_value(PARAM_INT, 'Cantidad de items'),
            'items'     => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                   => new \external_value(PARAM_RAW,   'ID del registro'),
                    'created_at'           => new \external_value(PARAM_RAW,   'ISO timestamp'),
                    'question_type'        => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta'),
                    'question'             => new \external_value(PARAM_RAW,   'Texto de la pregunta'),
                    'explanation'          => new \external_value(PARAM_RAW,   'Explicación / respuesta modelo'),
                    'source_filename'      => new \external_value(PARAM_TEXT,  'Archivo fuente', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'source_document_id'   => new \external_value(PARAM_RAW,   'ID del documento fuente (best-effort)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'options'              => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Opción')
                    ),
                    'correct_index'        => new \external_value(PARAM_INT,   'Índice de la opción correcta'),
                    'user_selected_index'  => new \external_value(PARAM_INT,   'Índice elegido por el alumno', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'user_answer'          => new \external_value(PARAM_RAW,   'Respuesta libre del alumno', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_feedback'          => new \external_value(PARAM_RAW,   'Feedback del evaluador IA', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_score'             => new \external_value(PARAM_FLOAT, 'Puntaje del evaluador IA', VALUE_OPTIONAL, null, NULL_ALLOWED),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, int $days = 90, int $limit = 100): array {
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
        $limit = max(1, min(200, (int) $params['limit']));

        $client   = new backend_client();
        $response = $client->list_quiz_errors((int) $params['courseid'], (int) $USER->id, $days, $limit);

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'total'     => (int) ($response['total'] ?? 0),
            'items'     => array_map(
                static function (array $i): array {
                    $opts = $i['options'] ?? [];
                    return [
                        'id'                  => (string) ($i['id'] ?? ''),
                        'created_at'          => (string) ($i['created_at'] ?? ''),
                        'question_type'       => (string) ($i['question_type'] ?? 'multiple_choice'),
                        'question'            => (string) ($i['question'] ?? ''),
                        'explanation'         => (string) ($i['explanation'] ?? ''),
                        'source_filename'     => isset($i['source_filename']) ? (string) $i['source_filename'] : null,
                        'source_document_id'  => isset($i['source_document_id']) ? (string) $i['source_document_id'] : null,
                        'options'             => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'       => (int) ($i['correct_index'] ?? -1),
                        'user_selected_index' => isset($i['user_selected_index']) ? (int) $i['user_selected_index'] : null,
                        'user_answer'         => isset($i['user_answer']) ? (string) $i['user_answer'] : null,
                        'ai_feedback'         => isset($i['ai_feedback']) ? (string) $i['ai_feedback'] : null,
                        'ai_score'            => isset($i['ai_score']) ? (float) $i['ai_score'] : null,
                    ];
                },
                $response['items'] ?? []
            ),
        ];
    }
}
