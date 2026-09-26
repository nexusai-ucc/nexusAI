<?php
// This file is part of the NexusAI plugin for Moodle.
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * External function `local_nexusai_quiz_attempt_save`.
 *
 * Persists the result of a quiz completed by the student (SP-09 — quiz
 * history). Each student saves their own history ($USER->id, never a
 * client parameter). Called best-effort from the frontend when reaching the
 * final results screen; errors don't block the quiz flow.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Persists the result of a quiz completed by the student (SP-09 — quiz history).
 */
class quiz_attempt_save extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'       => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'questiontype'   => new \external_value(PARAM_ALPHANUMEXT, 'Generated quiz type', VALUE_REQUIRED),
            'difficulty'     => new \external_value(PARAM_ALPHA, 'Difficulty (easy|medium|hard)', VALUE_DEFAULT, 'medium'),
            'topic'          => new \external_value(PARAM_RAW, 'Topic (optional)', VALUE_DEFAULT, ''),
            'totalquestions' => new \external_value(PARAM_INT, 'Total number of questions (1..10)', VALUE_REQUIRED),
            'correctcount'   => new \external_value(PARAM_INT, 'Number of correct answers (0..10)', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'    => new \external_value(PARAM_RAW, 'UUID of the saved attempt'),
            'score' => new \external_value(PARAM_FLOAT, 'Score 0.0-1.0 computed server-side'),
        ]);
    }

    /**
     * Persists the result of a quiz completed by the student (SP-09 — quiz history).
     *
     * @param int $courseid Course ID
     * @param string $questiontype Generated quiz type
     * @param string $difficulty Difficulty (easy|medium|hard)
     * @param string $topic Topic (optional)
     * @param int $totalquestions Total number of questions (1..10)
     * @param int $correctcount Number of correct answers (0..10)
     * @return array
     */
    public static function execute(
        int $courseid,
        string $questiontype,
        string $difficulty = 'medium',
        string $topic = '',
        int $totalquestions = 0,
        int $correctcount = 0
    ): array {
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
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $allowedtypes = ['multiple_choice', 'true_false', 'open', 'mix', 'flashcard', 'fill_blank'];
        $qtype = in_array($params['questiontype'], $allowedtypes, true) ? $params['questiontype'] : 'multiple_choice';

        $alloweddifficulties = ['easy', 'medium', 'hard'];
        $diff = in_array($params['difficulty'], $alloweddifficulties, true) ? $params['difficulty'] : 'medium';

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
            'id'    => (string) ($response['id'] ?? ''),
            'score' => (float)  ($response['score'] ?? 0.0),
        ];
    }
}
