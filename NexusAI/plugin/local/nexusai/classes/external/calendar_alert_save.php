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
 * External function `local_nexusai_calendar_alert_save`.
 *
 * Saves or updates a student's alert for a calendar event.
 * If days_before=0, removes the alert. Accessible to users with the
 * `local/nexusai:use` capability (enrolled students).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Saves or updates a student's alert for a calendar event.
 */
class calendar_alert_save extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'userid'         => new \external_value(PARAM_INT, 'User ID', VALUE_REQUIRED),
            'courseid'       => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'eventid'        => new \external_value(PARAM_INT, 'Event ID in Moodle', VALUE_REQUIRED),
            'eventname'      => new \external_value(PARAM_TEXT, 'Event name', VALUE_REQUIRED),
            'eventtimestamp' => new \external_value(PARAM_INT, 'Unix timestamp of the event', VALUE_REQUIRED),
            'daysbefore'     => new \external_value(PARAM_INT, '0 = no alert, 1, 3 or 7 days before', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'          => new \external_value(
                PARAM_TEXT,
                'Alert UUID (null if deleted)',
                VALUE_OPTIONAL,
                null,
                NULL_ALLOWED
            ),
            'days_before' => new \external_value(PARAM_INT, 'Configured days'),
        ]);
    }

    /**
     * Saves or updates a student's alert for a calendar event.
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param int $eventid Event ID in Moodle
     * @param string $eventname Event name
     * @param int $eventtimestamp Unix timestamp of the event
     * @param int $daysbefore 0 = no alert, 1, 3 or 7 days before
     * @return array
     */
    public static function execute(
        int $userid,
        int $courseid,
        int $eventid,
        string $eventname,
        int $eventtimestamp,
        int $daysbefore
    ): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'userid'         => $userid,
            'courseid'       => $courseid,
            'eventid'        => $eventid,
            'eventname'      => $eventname,
            'eventtimestamp' => $eventtimestamp,
            'daysbefore'     => $daysbefore,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $client   = new backend_client();
        $response = $client->save_calendar_alert(
            (int)    $params['userid'],
            (int)    $params['courseid'],
            (int)    $params['eventid'],
            (string) $params['eventname'],
            (int)    $params['eventtimestamp'],
            (int)    $params['daysbefore']
        );

        return [
            'id'          => $response['id'] ?? null,
            'days_before' => (int) ($response['days_before'] ?? $params['daysbefore']),
        ];
    }
}
