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
 * External function `local_nexusai_quiz_evaluate`.
 *
 * Evaluates a student's free-text answer to an open question using an LLM
 * (SP-05: open questions with AI-based evaluation).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Evaluates a student's free-text answer to an open question using an LLM (SP-05: open
 * questions with AI-based evaluation).
 */
class quiz_evaluate extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'    => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'question'    => new \external_value(PARAM_RAW, 'Question text', VALUE_REQUIRED),
            'modelanswer' => new \external_value(PARAM_RAW, 'Model answer (quiz explanation)', VALUE_REQUIRED),
            'useranswer'  => new \external_value(PARAM_RAW, 'Answer written by the student', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'correct'  => new \external_value(PARAM_BOOL, 'Is the answer correct?'),
            'score'    => new \external_value(PARAM_FLOAT, 'Score 0.0 to 1.0'),
            'feedback' => new \external_value(PARAM_RAW, 'Detailed feedback from the AI evaluator'),
        ]);
    }

    /**
     * Evaluates a student's free-text answer to an open question using an LLM (SP-05: open
     * questions with AI-based evaluation).
     *
     * @param int $courseid Course ID
     * @param string $question Question text
     * @param string $modelanswer Model answer (quiz explanation)
     * @param string $useranswer Answer written by the student
     * @return array
     */
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
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $client   = new backend_client();
        $response = $client->evaluate_quiz_answer(
            (int) $params['courseid'],
            (int) $USER->id,
            (string) $params['question'],
            (string) $params['modelanswer'],
            (string) $params['useranswer'],
        );

        return [
            'correct'  => (bool)  ($response['correct'] ?? false),
            'score'    => (float) ($response['score'] ?? 0.0),
            'feedback' => (string)($response['feedback'] ?? ''),
        ];
    }
}
