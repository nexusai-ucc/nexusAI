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
 * External function `local_nexusai_quiz_errors_list`.
 *
 * Returns the history of questions the student answered wrong in quizzes
 * of a course (SP-10 — error-based review). Each student only sees their
 * own history ($USER->id, never a client parameter).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Returns the history of questions the student answered wrong in quizzes of a course (SP-10 —
 * error-based review).
 */
class quiz_errors_list extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Days back (1..365)', VALUE_DEFAULT, 90),
            'limit'    => new \external_value(PARAM_INT, 'Max items (1..200)', VALUE_DEFAULT, 100),
            'offset'   => new \external_value(PARAM_INT, 'Items to skip (pagination)', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id' => new \external_value(PARAM_INT, 'Course ID'),
            'total'     => new \external_value(PARAM_INT, 'Number of items'),
            'items'     => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                   => new \external_value(PARAM_RAW, 'Record ID'),
                    'created_at'           => new \external_value(PARAM_RAW, 'ISO timestamp'),
                    'question_type'        => new \external_value(PARAM_ALPHANUMEXT, 'Question type'),
                    'question'             => new \external_value(PARAM_RAW, 'Question text'),
                    'explanation'          => new \external_value(PARAM_RAW, 'Explanation / model answer'),
                    'source_filename'      => new \external_value(PARAM_TEXT, 'Source file', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'source_document_id'   => new \external_value(
                        PARAM_RAW,
                        'Source document ID (best-effort)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'options'              => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Option')
                    ),
                    'correct_index'        => new \external_value(PARAM_INT, 'Index of the correct option'),
                    'user_selected_index'  => new \external_value(
                        PARAM_INT,
                        'Index chosen by the student',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'user_answer'          => new \external_value(
                        PARAM_RAW,
                        'Student\'s free-text answer',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'ai_feedback'          => new \external_value(
                        PARAM_RAW,
                        'AI evaluator feedback',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'ai_score'             => new \external_value(
                        PARAM_FLOAT,
                        'AI evaluator score',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                ])
            ),
        ]);
    }

    /**
     * Returns the history of questions the student answered wrong in quizzes of a course (SP-10 —
     * error-based review).
     *
     * @param int $courseid Course ID
     * @param int $days Days back (1..365)
     * @param int $limit Max items (1..200)
     * @param int $offset Items to skip (pagination)
     * @return array
     */
    public static function execute(int $courseid, int $days = 90, int $limit = 100, int $offset = 0): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
            'limit'    => $limit,
            'offset'   => $offset,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $days   = max(1, min(365, (int) $params['days']));
        $limit  = max(1, min(200, (int) $params['limit']));
        $offset = max(0, (int) $params['offset']);

        $client   = new backend_client();
        $response = $client->list_quiz_errors((int) $params['courseid'], (int) $USER->id, $days, $limit, $offset);

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
