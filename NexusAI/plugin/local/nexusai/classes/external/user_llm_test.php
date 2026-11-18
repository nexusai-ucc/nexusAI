<?php
// This file is part of Moodle - https://moodle.org/
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
 * External function `local_nexusai_user_llm_test` ("My API key").
 *
 * Tries the saved key again ("Test again"). The key stays saved even if the
 * provider fails: the user decides whether to change it or remove it.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_nexusai\local\user_llm;

/**
 * Tests the logged-in user's saved key.
 */
class user_llm_test extends external_api {
    /**
     * Parameters for execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course the screen was opened from', VALUE_REQUIRED),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return user_llm_save::result_structure();
    }

    /**
     * Tests the saved key.
     *
     * @param int $courseid Course.
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
        $courseid = (int) $params['courseid'];
        user_llm_get::check_access($courseid);
        $userid = (int) $USER->id;

        $credentials = user_llm::credentials($userid);
        if ($credentials === null) {
            $result = [
                'ok' => false,
                'reason' => 'rejected',
                'message' => get_string('userllm_missing', 'local_nexusai'),
            ];
        } else {
            $result = user_llm_save::probe($userid, $courseid, $credentials);
            if ($result['ok']) {
                user_llm::mark_tested($userid, time());
            }
        }
        $result['state'] = user_llm_get::state($userid, $courseid);
        return $result;
    }
}
