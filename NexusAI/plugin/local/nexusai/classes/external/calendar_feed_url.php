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
 * External function `local_nexusai_calendar_feed_url`.
 *
 * Returns the URL of the student's subscribable .ics feed for a course
 * (CAL-07 / #377). Creates the student's token if they don't have one yet.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');
require_once($GLOBALS['CFG']->dirroot . '/local/nexusai/lib.php');

/**
 * Returns the URL of the student's subscribable .ics feed for a course (CAL-07 / #377).
 */
class calendar_feed_url extends \external_api {
    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid' => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'url' => new \external_value(PARAM_RAW, 'Absolute .ics feed URL'),
        ]);
    }

    /**
     * Returns the URL of the student's subscribable .ics feed for a course (CAL-07 / #377).
     *
     * @param int $courseid Course ID
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        return [
            'url' => local_nexusai_calfeed_url((int) $USER->id, (int) $params['courseid']),
        ];
    }
}
