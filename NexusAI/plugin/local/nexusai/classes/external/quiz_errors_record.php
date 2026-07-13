<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_errors_record`.
 *
 * Persiste las preguntas que el alumno respondió mal en un quiz recién
 * terminado (SP-10 — repaso basado en errores). Reemplaza el localStorage
 * efímero que usaba antes QuizPanel: el historial ahora vive en Postgres.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_errors_record extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'errors'   => new \external_multiple_structure(
                new \external_single_structure([
                    'question_type'       => new \external_value(PARAM_ALPHANUMEXT, 'Tipo de pregunta', VALUE_OPTIONAL, 'multiple_choice'),
                    'question'            => new \external_value(PARAM_RAW,   'Texto de la pregunta', VALUE_REQUIRED),
                    'explanation'         => new \external_value(PARAM_RAW,   'Explicación / respuesta modelo', VALUE_OPTIONAL, ''),
                    'source_filename'     => new \external_value(PARAM_TEXT,  'Archivo fuente', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'source_document_id'  => new \external_value(PARAM_RAW,   'ID del documento fuente (best-effort)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'options'             => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Opción'), VALUE_OPTIONAL, []
                    ),
                    'correct_index'       => new \external_value(PARAM_INT,   'Índice de la opción correcta (-1..3)', VALUE_OPTIONAL, -1),
                    'user_selected_index' => new \external_value(PARAM_INT,   'Índice elegido por el alumno (MC/TF)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'user_answer'         => new \external_value(PARAM_RAW,   'Respuesta libre del alumno (open)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_feedback'         => new \external_value(PARAM_RAW,   'Feedback del evaluador IA (open)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'ai_score'            => new \external_value(PARAM_FLOAT, 'Puntaje del evaluador IA (open)', VALUE_OPTIONAL, null, NULL_ALLOWED),
                ]),
                'Preguntas respondidas mal en el quiz'
            ),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'stored' => new \external_value(PARAM_INT, 'Cantidad de errores persistidos'),
        ]);
    }

    public static function execute(int $courseid, array $errors): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'errors'   => $errors,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        if (empty($params['errors'])) {
            return ['stored' => 0];
        }

        // Tope defensivo: un quiz tiene como máximo 10 preguntas.
        $cleanerrors = array_slice($params['errors'], 0, 10);

        $cleanerrors = array_map(static function (array $e): array {
            $opts = $e['options'] ?? [];
            return [
                'question_type'       => (string) ($e['question_type'] ?? 'multiple_choice'),
                'question'            => (string) ($e['question'] ?? ''),
                'explanation'         => (string) ($e['explanation'] ?? ''),
                'source_filename'     => isset($e['source_filename']) ? (string) $e['source_filename'] : null,
                'source_document_id'  => isset($e['source_document_id']) ? (string) $e['source_document_id'] : null,
                'options'             => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                'correct_index'       => (int) ($e['correct_index'] ?? -1),
                'user_selected_index' => isset($e['user_selected_index']) ? (int) $e['user_selected_index'] : null,
                'user_answer'         => isset($e['user_answer']) ? (string) $e['user_answer'] : null,
                'ai_feedback'         => isset($e['ai_feedback']) ? (string) $e['ai_feedback'] : null,
                'ai_score'            => isset($e['ai_score']) ? (float) $e['ai_score'] : null,
            ];
        }, $cleanerrors);

        $client   = new backend_client();
        $response = $client->record_quiz_errors((int) $params['courseid'], (int) $USER->id, $cleanerrors);

        return [
            'stored' => (int) ($response['stored'] ?? 0),
        ];
    }
}
