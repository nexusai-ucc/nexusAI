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
 * External function `local_nexusai_user_llm_delete` ("My API key").
 *
 * Removes the logged-in user's own key. From then on NexusAI uses only the
 * institution's models for them.
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
 * Removes the logged-in user's own API key.
 */
class user_llm_delete extends external_api {
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
        return user_llm_get::state_structure();
    }

    /**
     * Removes the key.
     *
     * @param int $courseid Course.
     * @return array The new state.
     */
    public static function execute(int $courseid): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
        $courseid = (int) $params['courseid'];
        user_llm_get::check_access($courseid);
        user_llm::delete((int) $USER->id);
        return user_llm_get::state((int) $USER->id, $courseid);
    }
}
