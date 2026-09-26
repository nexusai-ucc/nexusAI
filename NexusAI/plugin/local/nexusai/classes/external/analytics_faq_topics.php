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
 * External function `local_nexusai_analytics_faq_topics`.
 *
 * Returns the course students' most frequent questions, grouped by topic
 * using an LLM (DOC-D02). Only accessible to users with the
 * `local/nexusai:manage` capability (teachers and admins).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Returns the course students' most frequent questions, grouped by topic using an LLM
 * (DOC-D02).
 */
class analytics_faq_topics extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'days'     => new \external_value(PARAM_INT, 'Days back (1..365)', VALUE_DEFAULT, 30),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'course_id'       => new \external_value(PARAM_INT, 'Course ID'),
            'days'            => new \external_value(PARAM_INT, 'Time window'),
            'total_questions' => new \external_value(PARAM_INT, 'Number of questions considered'),
            'topics'          => new \external_multiple_structure(
                new \external_single_structure([
                    'topic'             => new \external_value(PARAM_RAW, 'Topic name'),
                    'count'             => new \external_value(PARAM_INT, 'Times asked (summed within the topic)'),
                    'example_questions' => new \external_multiple_structure(
                        new \external_value(PARAM_RAW, 'Example question')
                    ),
                ])
            ),
        ]);
    }

    /**
     * Returns the course students' most frequent questions, grouped by topic using an LLM
     * (DOC-D02).
     *
     * @param int $courseid Course ID
     * @param int $days Days back (1..365)
     * @return array
     */
    public static function execute(int $courseid, int $days = 30): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'days'     => $days,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Only teachers / admins see the FAQ dashboard. Students don't.
        require_capability('local/nexusai:manage', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $days = max(1, min(365, (int) $params['days']));

        $client   = new backend_client();
        $response = $client->faq_topics((int) $params['courseid'], $days);

        return [
            'course_id'       => (int) ($response['course_id'] ?? $params['courseid']),
            'days'            => (int) ($response['days'] ?? $days),
            'total_questions' => (int) ($response['total_questions'] ?? 0),
            'topics'          => array_map(
                static fn(array $t) => [
                    'topic'             => (string) ($t['topic'] ?? ''),
                    'count'             => (int) ($t['count'] ?? 0),
                    'example_questions' => array_map(
                        static fn($q) => (string) $q,
                        is_array($t['example_questions'] ?? null) ? $t['example_questions'] : []
                    ),
                ],
                $response['topics'] ?? []
            ),
        ];
    }
}
