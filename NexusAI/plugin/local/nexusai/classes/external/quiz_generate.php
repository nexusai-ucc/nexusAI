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
 * External function `local_nexusai_quiz_generate`.
 *
 * Proxy between React and the Python backend's /api/v1/quiz/generate endpoint.
 * Generates a practice quiz with multiple-choice questions based on
 * the course's indexed material.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Proxy between React and the Python backend's /api/v1/quiz/generate endpoint.
 */
class quiz_generate extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'      => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'topic'         => new \external_value(PARAM_RAW, 'Topic (optional)', VALUE_DEFAULT, ''),
            'numquestions'  => new \external_value(PARAM_INT, 'Number of questions (1..10)', VALUE_DEFAULT, 5),
            'questiontype'  => new \external_value(
                PARAM_ALPHANUMEXT,
                'Question type (multiple_choice|true_false|open|mix|flashcard)',
                VALUE_DEFAULT,
                'multiple_choice'
            ),
            'difficulty'    => new \external_value(PARAM_ALPHA, 'Difficulty (easy|medium|hard)', VALUE_DEFAULT, 'medium'),
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
            'topic'     => new \external_value(PARAM_RAW, 'Requested topic', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'questions' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                  => new \external_value(
                        PARAM_ALPHANUMEXT,
                        'Persisted ID (flashcards only, SP-11)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'question_type'      => new \external_value(PARAM_ALPHANUMEXT, 'Question type'),
                    'question'           => new \external_value(PARAM_RAW, 'Question text'),
                    'options'            => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Option')
                    ),
                    'correct_index'      => new \external_value(PARAM_INT, 'Index of the correct option (-1..3)'),
                    'explanation'        => new \external_value(PARAM_RAW, 'Explanation / model answer'),
                    'source_filename'    => new \external_value(PARAM_TEXT, 'File the question comes from'),
                    'source_document_id' => new \external_value(
                        PARAM_ALPHANUMEXT,
                        'Source document ID (UUID)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                ])
            ),
        ]);
    }

    /**
     * Proxy between React and the Python backend's /api/v1/quiz/generate endpoint.
     *
     * @param int $courseid Course ID
     * @param string $topic Topic (optional)
     * @param int $numquestions Number of questions (1..10)
     * @param string $questiontype Question type (multiple_choice|true_false|open|mix|flashcard)
     * @param string $difficulty Difficulty (easy|medium|hard)
     * @return array
     */
    public static function execute(
        int $courseid,
        string $topic = '',
        int $numquestions = 5,
        string $questiontype = 'multiple_choice',
        string $difficulty = 'medium'
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'     => $courseid,
            'topic'        => $topic,
            'numquestions' => $numquestions,
            'questiontype' => $questiontype,
            'difficulty'   => $difficulty,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleantopic = trim((string) $params['topic']);
        if (mb_strlen($cleantopic) > 200) {
            throw new \invalid_parameter_exception('Topic too long (max 200 chars)');
        }
        $numq = max(1, min(10, (int) $params['numquestions']));

        $allowedtypes = ['multiple_choice', 'true_false', 'open', 'mix', 'flashcard', 'fill_blank'];
        $qtype = in_array($params['questiontype'], $allowedtypes, true) ? $params['questiontype'] : 'multiple_choice';

        $alloweddifficulties = ['easy', 'medium', 'hard'];
        $difficulty = in_array($params['difficulty'], $alloweddifficulties, true) ? $params['difficulty'] : 'medium';

        $client   = new backend_client();
        $response = $client->generate_quiz(
            (int) $params['courseid'],
            (int) $USER->id,
            $cleantopic !== '' ? $cleantopic : null,
            $numq,
            $qtype,
            $difficulty
        );

        if (!isset($response['questions']) || !is_array($response['questions'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid quiz response');
        }

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'topic'     => isset($response['topic']) ? (string) $response['topic'] : null,
            'questions' => array_map(
                static function (array $q): array {
                    $opts = $q['options'] ?? [];
                    return [
                        'id'                  => isset($q['id']) ? (string) $q['id'] : null,
                        'question_type'      => (string) ($q['question_type'] ?? 'multiple_choice'),
                        'question'           => (string) ($q['question'] ?? ''),
                        'options'            => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'      => (int) ($q['correct_index'] ?? -1),
                        'explanation'        => (string) ($q['explanation'] ?? ''),
                        'source_filename'    => (string) ($q['source_filename'] ?? ''),
                        'source_document_id' => isset($q['source_document_id']) ? (string) $q['source_document_id'] : null,
                    ];
                },
                $response['questions']
            ),
        ];
    }
}
