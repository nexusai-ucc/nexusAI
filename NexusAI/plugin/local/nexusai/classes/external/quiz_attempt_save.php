<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_quiz_attempt_save`.
 *
 * Persiste el resultado de un quiz completado por el alumno (SP-09 — historial
 * de quizzes). Cada alumno guarda su propio historial ($USER->id, nunca un
 * parámetro del cliente). Llamado best-effort desde el frontend al llegar a
 * la pantalla de resultado final; los errores no bloquean el flujo del quiz.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class quiz_attempt_save extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'       => new \external_value(PARAM_INT,          'ID del curso',                              VALUE_REQUIRED),
            'questiontype'   => new \external_value(PARAM_ALPHANUMEXT,  'Tipo de quiz generado',                     VALUE_REQUIRED),
            'difficulty'     => new \external_value(PARAM_ALPHA,        'Dificultad (easy|medium|hard)',             VALUE_OPTIONAL, 'medium'),
            'topic'          => new \external_value(PARAM_RAW,          'Tema (opcional)',                           VALUE_OPTIONAL, ''),
            'totalquestions' => new \external_value(PARAM_INT,          'Cantidad total de preguntas (1..10)',       VALUE_REQUIRED),
            'correctcount'   => new \external_value(PARAM_INT,          'Cantidad de respuestas correctas (0..10)', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'         => new \external_value(PARAM_RAW, 'UUID del intento guardado'),
            'created_at' => new \external_value(PARAM_RAW, 'ISO timestamp del intento'),
        ]);
    }

    public static function execute(int $courseid, string $questiontype, string $difficulty = 'medium', string $topic = '', int $totalquestions = 0, int $correctcount = 0): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'       => $courseid,
            'questiontype'   => $questiontype,
            'difficulty'     => $difficulty,
            'topic'          => $topic,
            'totalquestions' => $totalquestions,
            'correctcount'   => $correctcount,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $allowed_types = ['multiple_choice', 'true_false', 'open', 'mix', 'flashcard', 'fill_blank'];
        $qtype = in_array($params['questiontype'], $allowed_types, true) ? $params['questiontype'] : 'multiple_choice';

        $allowed_difficulties = ['easy', 'medium', 'hard'];
        $diff = in_array($params['difficulty'], $allowed_difficulties, true) ? $params['difficulty'] : 'medium';

        $totalq = max(1, min(10, (int) $params['totalquestions']));
        $correct = max(0, min($totalq, (int) $params['correctcount']));

        $cleantopic = trim((string) $params['topic']);
        if (mb_strlen($cleantopic) > 200) {
            $cleantopic = mb_substr($cleantopic, 0, 200);
        }

        $client   = new backend_client();
        $response = $client->save_quiz_attempt(
            (int) $params['courseid'],
            (int) $USER->id,
            $qtype,
            $diff,
            $cleantopic !== '' ? $cleantopic : null,
            $totalq,
            $correct
        );

        return [
            'id'         => (string) ($response['id'] ?? ''),
            'created_at' => (string) ($response['created_at'] ?? ''),
        ];
    }
}
