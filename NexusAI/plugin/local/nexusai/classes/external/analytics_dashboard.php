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
 * External function `local_nexusai_analytics_dashboard`.
 *
 * Returns a course's aggregated metrics dashboard for the teacher
 * (ANALYTICS-01/02): most frequent questions, daily usage, quiz score
 * distribution and content-gaps ratio. Only accessible to users with the
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
 * Returns a course's aggregated metrics dashboard for the teacher (ANALYTICS-01/02): most
 * frequent questions, daily usage, quiz score distribution and content-gaps ratio.
 */
class analytics_dashboard extends \external_api {
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
            'course_id'   => new \external_value(PARAM_INT, 'Course ID'),
            'period_days' => new \external_value(PARAM_INT, 'Time window'),
            'top_queries' => new \external_multiple_structure(
                new \external_single_structure([
                    'question' => new \external_value(PARAM_RAW, 'Question'),
                    'count'    => new \external_value(PARAM_INT, 'Times asked'),
                ])
            ),
            'daily_message_counts' => new \external_multiple_structure(
                new \external_single_structure([
                    'date'           => new \external_value(PARAM_RAW, 'Date (YYYY-MM-DD)'),
                    'message_count'  => new \external_value(PARAM_INT, 'Messages that day'),
                ])
            ),
            'quiz_score_distribution' => new \external_single_structure([
                'total_attempts' => new \external_value(PARAM_INT, 'Total number of attempts'),
                'average_score'  => new \external_value(PARAM_FLOAT, 'Average score'),
                'buckets'        => new \external_multiple_structure(
                    new \external_single_structure([
                        'range' => new \external_value(PARAM_RAW, 'Bucket range (e.g. "0-20")'),
                        'count' => new \external_value(PARAM_INT, 'Attempts in that range'),
                    ])
                ),
            ]),
            'gaps_ratio' => new \external_single_structure([
                'gaps_detected'      => new \external_value(PARAM_INT, 'Detected content gaps'),
                'questions_answered' => new \external_value(PARAM_INT, 'Questions answered'),
                'ratio'              => new \external_value(PARAM_FLOAT, 'gaps / (gaps + answered)'),
            ]),
            'feedback_ratio' => new \external_single_structure([
                'helpful_count' => new \external_value(PARAM_INT, 'Answers marked helpful (👍)'),
                'total_rated'   => new \external_value(PARAM_INT, 'Total rated answers'),
                'useful_pct'    => new \external_value(PARAM_FLOAT, '% marked helpful'),
            ]),
            'topics_consulted' => new \external_value(PARAM_INT, 'Distinct (grouped) questions consulted in the period'),
        ]);
    }

    /**
     * Returns a course's aggregated metrics dashboard for the teacher (ANALYTICS-01/02): most
     * frequent questions, daily usage, quiz score distribution and content-gaps ratio.
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
        // Only teachers / admins see the analytics dashboard. Students don't.
        require_capability('local/nexusai:manage', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $days = max(1, min(365, (int) $params['days']));

        $client   = new backend_client();
        $response = $client->analytics_dashboard((int) $params['courseid'], $days);

        $qsd = is_array($response['quiz_score_distribution'] ?? null) ? $response['quiz_score_distribution'] : [];
        $gr  = is_array($response['gaps_ratio'] ?? null) ? $response['gaps_ratio'] : [];
        $fr  = is_array($response['feedback_ratio'] ?? null) ? $response['feedback_ratio'] : [];

        return [
            'course_id'   => (int) ($response['course_id'] ?? $params['courseid']),
            'period_days' => (int) ($response['period_days'] ?? $days),
            'top_queries' => array_map(
                static fn(array $q) => [
                    'question' => (string) ($q['question'] ?? ''),
                    'count'    => (int) ($q['count'] ?? 0),
                ],
                $response['top_queries'] ?? []
            ),
            'daily_message_counts' => array_map(
                static fn(array $d) => [
                    'date'          => (string) ($d['date'] ?? ''),
                    'message_count' => (int) ($d['message_count'] ?? 0),
                ],
                $response['daily_message_counts'] ?? []
            ),
            'quiz_score_distribution' => [
                'total_attempts' => (int) ($qsd['total_attempts'] ?? 0),
                'average_score'  => (float) ($qsd['average_score'] ?? 0.0),
                'buckets'        => array_map(
                    static fn(array $b) => [
                        'range' => (string) ($b['range'] ?? ''),
                        'count' => (int) ($b['count'] ?? 0),
                    ],
                    $qsd['buckets'] ?? []
                ),
            ],
            'gaps_ratio' => [
                'gaps_detected'      => (int) ($gr['gaps_detected'] ?? 0),
                'questions_answered' => (int) ($gr['questions_answered'] ?? 0),
                'ratio'              => (float) ($gr['ratio'] ?? 0.0),
            ],
            'feedback_ratio' => [
                'helpful_count' => (int) ($fr['helpful_count'] ?? 0),
                'total_rated'   => (int) ($fr['total_rated'] ?? 0),
                'useful_pct'    => (float) ($fr['useful_pct'] ?? 0.0),
            ],
            'topics_consulted' => (int) ($response['topics_consulted'] ?? 0),
        ];
    }
}
