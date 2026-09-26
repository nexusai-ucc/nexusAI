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
 * External function `local_nexusai_quiz_flashcards_due`.
 *
 * SP-11 (#315): already-generated flashcards that are "due today" according
 * to spaced repetition (SM-2), most overdue first. Doesn't call the LLM —
 * serves from the bank already persisted by `local_nexusai_quiz_generate`.
 * Same question shape as `quiz_generate` so it can render with the same
 * flashcards component on the React side.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * SP-11 (#315): already-generated flashcards that are "due today" according to spaced
 * repetition (SM-2), most overdue first.
 */
class quiz_flashcards_due extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'topic'    => new \external_value(PARAM_TEXT, 'Topic (optional)', VALUE_DEFAULT, ''),
            'limit'    => new \external_value(PARAM_INT, 'Maximum amount (1..50)', VALUE_DEFAULT, 10),
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
            'questions' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                  => new \external_value(
                        PARAM_ALPHANUMEXT,
                        'Flashcard ID (UUID)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'question_type'       => new \external_value(PARAM_ALPHANUMEXT, 'Question type'),
                    'question'            => new \external_value(PARAM_RAW, 'Front of the card'),
                    'options'             => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Option')
                    ),
                    'correct_index'       => new \external_value(PARAM_INT, 'Always -1 for flashcards'),
                    'explanation'         => new \external_value(PARAM_RAW, 'Back of the card'),
                    'source_filename'     => new \external_value(PARAM_TEXT, 'Source file'),
                    'source_document_id'  => new \external_value(
                        PARAM_ALPHANUMEXT,
                        'Source document ID',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                ])
            ),
        ]);
    }

    /**
     * SP-11 (#315): already-generated flashcards that are "due today" according to spaced
     * repetition (SM-2), most overdue first.
     *
     * @param int $courseid Course ID
     * @param string $topic Topic (optional)
     * @param int $limit Maximum amount (1..50)
     * @return array
     */
    public static function execute(int $courseid, string $topic = '', int $limit = 10): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'topic'    => $topic,
            'limit'    => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $lim = max(1, min(50, (int) $params['limit']));

        $client   = new backend_client();
        $response = $client->flashcards_due(
            (int) $params['courseid'],
            (int) $USER->id,
            trim($params['topic']) === '' ? null : trim($params['topic']),
            $lim
        );

        $questions = is_array($response['questions'] ?? null) ? $response['questions'] : [];

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'questions' => array_map(
                static function (array $q): array {
                    $opts = $q['options'] ?? [];
                    return [
                        'id'                  => isset($q['id']) ? (string) $q['id'] : null,
                        'question_type'       => (string) ($q['question_type'] ?? 'flashcard'),
                        'question'            => (string) ($q['question'] ?? ''),
                        'options'             => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'       => (int) ($q['correct_index'] ?? -1),
                        'explanation'         => (string) ($q['explanation'] ?? ''),
                        'source_filename'     => (string) ($q['source_filename'] ?? ''),
                        'source_document_id'  => isset($q['source_document_id']) ? (string) $q['source_document_id'] : null,
                    ];
                },
                $questions
            ),
        ];
    }
}
