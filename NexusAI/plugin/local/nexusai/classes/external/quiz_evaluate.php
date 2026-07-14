<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_evaluate`.
 *
 * Evalúa la respuesta libre de un alumno a una pregunta abierta usando LLM
 * (SP-05: preguntas abiertas con evaluación por IA).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_evaluate extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'question'    => new \external_value(PARAM_RAW, 'Texto de la pregunta', VALUE_REQUIRED),
            'modelanswer' => new \external_value(PARAM_RAW, 'Respuesta modelo (explanation del quiz)', VALUE_REQUIRED),
            'useranswer'  => new \external_value(PARAM_RAW, 'Respuesta escrita por el alumno', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'correct'  => new \external_value(PARAM_BOOL,  '¿La respuesta es correcta?'),
            'score'    => new \external_value(PARAM_FLOAT, 'Puntaje 0.0 a 1.0'),
            'feedback' => new \external_value(PARAM_RAW,  'Feedback detallado del evaluador IA'),
        ]);
    }

    public static function execute(int $courseid, string $question, string $modelanswer, string $useranswer): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'question'    => $question,
            'modelanswer' => $modelanswer,
            'useranswer'  => $useranswer,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->evaluate_quiz_answer(
            (int) $params['courseid'],
            (int) $USER->id,
            (string) $params['question'],
            (string) $params['modelanswer'],
            (string) $params['useranswer'],
        );

        return [
            'correct'  => (bool)  ($response['correct']  ?? false),
            'score'    => (float) ($response['score']    ?? 0.0),
            'feedback' => (string)($response['feedback'] ?? ''),
        ];
    }
}
