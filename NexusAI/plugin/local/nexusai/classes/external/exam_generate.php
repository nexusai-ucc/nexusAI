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
 * External function `local_nexusai_exam_generate`.
 *
 * Proxy between React and the Python backend's /api/v1/quiz/generate-exam endpoint.
 * Generates an exam question bank from files chosen by the teacher
 * (EVAL-01, issue #235 / DOC-D04). Unlike `quiz_generate`
 * (student), this one requires the `local/nexusai:manage` capability.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Proxy between React and the Python backend's /api/v1/quiz/generate-exam endpoint.
 */
class exam_generate extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'     => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'documentids'  => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'Source document UUID'),
                'Course files to draw the questions from (at least 1)'
            ),
            'topic'        => new \external_value(PARAM_RAW, 'Optional topic', VALUE_DEFAULT, ''),
            'numquestions' => new \external_value(PARAM_INT, 'Number of questions (1..20)', VALUE_DEFAULT, 10),
            'questiontype' => new \external_value(
                PARAM_ALPHANUMEXT,
                'Question type (multiple_choice|true_false|open|mix)',
                VALUE_DEFAULT,
                'multiple_choice'
            ),
            'difficulty'   => new \external_value(PARAM_ALPHA, 'Difficulty (easy|medium|hard)', VALUE_DEFAULT, 'medium'),
            // DOC-D09 (#390): topics with detected difficulty (Gaps/FAQ) that
            // the teacher chose to prioritize as extra generation context.
            'topics'       => new \external_multiple_structure(
                new \external_single_structure([
                    'label'  => new \external_value(PARAM_TEXT, 'Topic text (gap or FAQ)'),
                    'source' => new \external_value(PARAM_ALPHA, 'Topic origin: gap|faq'),
                ]),
                'Topics with detected difficulty to prioritize (max 15)',
                VALUE_OPTIONAL,
                []
            ),
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
                    'source_topic'       => new \external_value(
                        PARAM_TEXT,
                        'Detected-difficulty topic the question comes from (DOC-D09)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                ])
            ),
        ]);
    }

    /**
     * Proxy between React and the Python backend's /api/v1/quiz/generate-exam endpoint.
     *
     * @param int $courseid Course ID
     * @param array $documentids Course files to draw the questions from (at least 1)
     * @param string $topic Optional topic
     * @param int $numquestions Number of questions (1..20)
     * @param string $questiontype Question type (multiple_choice|true_false|open|mix)
     * @param string $difficulty Difficulty (easy|medium|hard)
     * @param array $topics Topics with detected difficulty to prioritize (max 15)
     * @return array
     */
    public static function execute(
        int $courseid,
        array $documentids,
        string $topic = '',
        int $numquestions = 10,
        string $questiontype = 'multiple_choice',
        string $difficulty = 'medium',
        array $topics = []
    ): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'     => $courseid,
            'documentids'  => $documentids,
            'topic'        => $topic,
            'numquestions' => $numquestions,
            'questiontype' => $questiontype,
            'difficulty'   => $difficulty,
            'topics'       => $topics,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Teachers/admins only — unlike the practice quiz (local/nexusai:use),
        // the exam generator uses the same capability that gates the rest of
        // the teacher dashboard (documents.php).
        require_capability('local/nexusai:manage', $context);

        if (empty($params['documentids'])) {
            throw new \invalid_parameter_exception('At least one document must be selected');
        }

        $cleantopic = trim((string) $params['topic']);
        if (mb_strlen($cleantopic) > 200) {
            throw new \invalid_parameter_exception('Topic too long (max 200 chars)');
        }
        $numq = max(1, min(20, (int) $params['numquestions']));

        $allowedtypes = ['multiple_choice', 'true_false', 'open', 'mix'];
        $qtype = in_array($params['questiontype'], $allowedtypes, true) ? $params['questiontype'] : 'multiple_choice';

        $alloweddifficulties = ['easy', 'medium', 'hard'];
        $difficulty = in_array($params['difficulty'], $alloweddifficulties, true) ? $params['difficulty'] : 'medium';

        // DOC-D09 (#390): sanitize the topics list — origin restricted to
        // gap|faq, label trimmed, and any empty row is ignored.
        $allowedtopicsources = ['gap', 'faq'];
        $focustopics = [];
        foreach (array_slice($params['topics'], 0, 15) as $t) {
            $label = trim((string) ($t['label'] ?? ''));
            if ($label === '') {
                continue;
            }
            $source = in_array($t['source'] ?? '', $allowedtopicsources, true) ? $t['source'] : 'gap';
            $focustopics[] = ['label' => mb_substr($label, 0, 200), 'source' => $source];
        }

        $client   = new backend_client();
        $response = $client->generate_exam(
            (int) $params['courseid'],
            (int) $USER->id,
            array_map('strval', $params['documentids']),
            $cleantopic !== '' ? $cleantopic : null,
            $numq,
            $qtype,
            $difficulty,
            $focustopics
        );

        if (!isset($response['questions']) || !is_array($response['questions'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid exam response');
        }

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'topic'     => isset($response['topic']) ? (string) $response['topic'] : null,
            'questions' => array_map(
                static function (array $q): array {
                    $opts = $q['options'] ?? [];
                    return [
                        'question_type'      => (string) ($q['question_type'] ?? 'multiple_choice'),
                        'question'           => (string) ($q['question'] ?? ''),
                        'options'            => array_map(static fn($o) => (string) $o, is_array($opts) ? $opts : []),
                        'correct_index'      => (int) ($q['correct_index'] ?? -1),
                        'explanation'        => (string) ($q['explanation'] ?? ''),
                        'source_filename'    => (string) ($q['source_filename'] ?? ''),
                        'source_document_id' => isset($q['source_document_id']) ? (string) $q['source_document_id'] : null,
                        'source_topic'       => isset($q['source_topic']) && $q['source_topic'] !== ''
                            ? (string) $q['source_topic']
                            : null,
                    ];
                },
                $response['questions']
            ),
        ];
    }
}
