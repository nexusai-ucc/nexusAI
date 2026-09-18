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
 * External function `local_nexusai_gaps_list`.
 *
 * Returns the teacher's "gaps" — frequent student questions that the
 * course's indexed material couldn't answer well. Only accessible to
 * users with the `local/nexusai:manage` capability (teachers and admins).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Returns the teacher's "gaps" — frequent student questions that the course's indexed material
 * couldn't answer well.
 */
class gaps_list extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'        => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'days'            => new \external_value(PARAM_INT, 'Days back (1..365)', VALUE_DEFAULT, 30),
            'limit'           => new \external_value(PARAM_INT, 'Max items (1..100)', VALUE_DEFAULT, 20),
            // UX-15 (#385): offset over the already-clustered groups, to request the next page.
            'offset'          => new \external_value(PARAM_INT, 'Position to paginate from', VALUE_DEFAULT, 0),
            // DOC-D08 (#383): only active gaps by default.
            'includearchived' => new \external_value(PARAM_BOOL, 'Include already-archived gaps', VALUE_DEFAULT, false),
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
            'days'      => new \external_value(PARAM_INT, 'Time window'),
            'total'     => new \external_value(
                PARAM_INT,
                'Total number of grouped gaps (for pagination, not the count already trimmed by limit)'
            ),
            'items'     => new \external_multiple_structure(
                new \external_single_structure([
                    'question'       => new \external_value(PARAM_RAW, 'Grouped question'),
                    'count'          => new \external_value(PARAM_INT, 'Times asked'),
                    'last_asked_at'  => new \external_value(PARAM_RAW, 'ISO timestamp of the last one'),
                    'avg_similarity' => new \external_value(
                        PARAM_FLOAT,
                        'Average similarity (0..1)',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    // Real unanswered_questions IDs behind this gap — this is what
                    // has to be sent back to gaps_archive, not the text.
                    'question_ids'   => new \external_multiple_structure(
                        new \external_value(PARAM_ALPHANUMEXT, 'UUID of an unanswered_questions row')
                    ),
                    'is_archived'    => new \external_value(PARAM_BOOL, 'True if every row in the group is archived'),
                ])
            ),
        ]);
    }

    /**
     * Returns the teacher's "gaps" — frequent student questions that the course's indexed
     * material couldn't answer well.
     *
     * @param int $courseid Course ID
     * @param int $days Days back (1..365)
     * @param int $limit Max items (1..100)
     * @param int $offset Position to paginate from
     * @param bool $includearchived Include already-archived gaps
     * @return array
     */
    public static function execute(
        int $courseid,
        int $days = 30,
        int $limit = 20,
        int $offset = 0,
        bool $includearchived = false
    ): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'        => $courseid,
            'days'            => $days,
            'limit'           => $limit,
            'offset'          => $offset,
            'includearchived' => $includearchived,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        // Only teachers / admins see the gaps. Students don't.
        require_capability('local/nexusai:manage', $context);

        $days   = max(1, min(365, (int) $params['days']));
        $limit  = max(1, min(100, (int) $params['limit']));
        $offset = max(0, (int) $params['offset']);

        $client   = new backend_client();
        $response = $client->list_gaps((int) $params['courseid'], $days, $limit, (bool) $params['includearchived'], $offset);

        return [
            'course_id' => (int) ($response['course_id'] ?? $params['courseid']),
            'days'      => (int) ($response['days'] ?? $days),
            'total'     => (int) ($response['total'] ?? 0),
            'items'     => array_map(
                static fn(array $i) => [
                    'question'       => (string) ($i['question'] ?? ''),
                    'count'          => (int)    ($i['count'] ?? 0),
                    'last_asked_at'  => (string) ($i['last_asked_at'] ?? ''),
                    'avg_similarity' => isset($i['avg_similarity']) ? (float) $i['avg_similarity'] : null,
                    'question_ids'   => array_map('strval', $i['question_ids'] ?? []),
                    'is_archived'    => (bool) ($i['is_archived'] ?? false),
                ],
                $response['items'] ?? []
            ),
        ];
    }
}
