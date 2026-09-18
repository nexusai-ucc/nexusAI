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
 * External function `local_nexusai_chat_sessions_list`.
 *
 * Lists the student's previous sessions for the history sidebar.
 * Optional filter by course (default: only the current course).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Lists the student's previous sessions for the history sidebar.
 */
class chat_sessions_list extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'Course to validate the capability against', VALUE_REQUIRED),
            'scopecourse' => new \external_value(
                PARAM_BOOL,
                'If true, lists only sessions from the current course. If false, all of the user\'s.',
                VALUE_DEFAULT,
                true
            ),
            'limit'      => new \external_value(PARAM_INT, 'Maximum (1..100)', VALUE_DEFAULT, 20),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'sessions' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                   => new \external_value(PARAM_RAW, 'Session UUID'),
                    'course_id'            => new \external_value(PARAM_INT, 'Session\'s course'),
                    'created_at'           => new \external_value(PARAM_RAW, 'Creation ISO timestamp'),
                    'updated_at'           => new \external_value(PARAM_RAW, 'Last-activity ISO timestamp'),
                    'last_message_preview' => new \external_value(
                        PARAM_RAW,
                        'Preview of the first message',
                        VALUE_OPTIONAL,
                        null,
                        NULL_ALLOWED
                    ),
                    'message_count'        => new \external_value(PARAM_INT, 'Number of messages'),
                ])
            ),
        ]);
    }

    /**
     * Lists the student's previous sessions for the history sidebar.
     *
     * @param int $courseid Course to validate the capability against
     * @param bool $scopecourse If true, lists only sessions from the current course. If false, all of the user's.
     * @param int $limit Maximum (1..100)
     * @return array
     */
    public static function execute(int $courseid, bool $scopecourse = true, int $limit = 20): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'scopecourse' => $scopecourse,
            'limit'       => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $limit = max(1, min(100, (int) $params['limit']));
        $scopecourseid = !empty($params['scopecourse']) ? (int) $params['courseid'] : null;

        $client   = new backend_client();
        $response = $client->list_sessions((int) $USER->id, $scopecourseid, $limit);

        $sessions = $response['sessions'] ?? [];
        return [
            'sessions' => array_map(
                static fn(array $s) => [
                    'id'                   => (string) ($s['id'] ?? ''),
                    'course_id'            => (int)    ($s['course_id'] ?? 0),
                    'created_at'           => (string) ($s['created_at'] ?? ''),
                    'updated_at'           => (string) ($s['updated_at'] ?? ''),
                    'last_message_preview' => isset($s['last_message_preview']) ? (string) $s['last_message_preview'] : null,
                    'message_count'        => (int)    ($s['message_count'] ?? 0),
                ],
                $sessions
            ),
        ];
    }
}
