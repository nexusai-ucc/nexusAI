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
 * External function `local_nexusai_user_llm_get` ("My API key").
 *
 * What the "My API key" screen shows: whether the site and the course allow
 * an own key, the saved provider and model, a hint of the key (never the key),
 * when it was last tested and how much it was used this month.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_nexusai\local\user_llm;

/**
 * State of the logged-in user's own API key.
 */
class user_llm_get extends external_api {
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
        return self::state_structure();
    }

    /**
     * The structure every "My API key" function returns.
     *
     * @return external_single_structure
     */
    public static function state_structure(): external_single_structure {
        return new external_single_structure([
            'siteenabled' => new external_value(PARAM_BOOL, 'Whether the site allows own keys'),
            'courseallowed' => new external_value(PARAM_BOOL, 'Whether this course allows own keys'),
            'configured' => new external_value(PARAM_BOOL, 'Whether the user saved a key'),
            'active' => new external_value(PARAM_BOOL, 'Whether the key is used in this course'),
            'provider' => new external_value(PARAM_ALPHANUMEXT, 'Provider id, empty without a key'),
            'providerlabel' => new external_value(PARAM_TEXT, 'Provider name, empty without a key'),
            'model' => new external_value(PARAM_RAW, 'Model name, empty without a key'),
            'keyhint' => new external_value(PARAM_RAW, 'Start and end of the key, never the key'),
            'timetested' => new external_value(PARAM_INT, 'When the provider last answered with the key, 0 if never'),
            'monthrequests' => new external_value(PARAM_INT, 'Answers given with the key this month'),
            'monthtokens' => new external_value(PARAM_INT, 'Tokens used with the key this month'),
            'providers' => new external_multiple_structure(
                new external_single_structure([
                    'id' => new external_value(PARAM_ALPHANUMEXT, 'Provider id'),
                    'label' => new external_value(PARAM_TEXT, 'Provider name'),
                ]),
                'Providers the user can choose from'
            ),
        ]);
    }

    /**
     * The logged-in user's key state for a course.
     *
     * @param int $courseid Course.
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
        self::check_access((int) $params['courseid']);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);
        return self::state((int) $USER->id, (int) $params['courseid']);
    }

    /**
     * Context and capability checks shared by the "My API key" functions.
     *
     * Each function then calls course_guard::require_enabled() itself, like
     * every other course function (course_guard_test checks it in each file).
     *
     * @param int $courseid Course.
     */
    public static function check_access(int $courseid): void {
        $context = \context_course::instance($courseid);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
    }

    /**
     * Builds the state the screen shows.
     *
     * @param int $userid User.
     * @param int $courseid Course.
     * @return array
     */
    public static function state(int $userid, int $courseid): array {
        $status = user_llm::status($userid);
        $usage = $status !== null ? user_llm::month_usage($userid) : ['requests' => 0, 'tokens' => 0];
        $providers = [];
        foreach (user_llm::PROVIDERS as $id => $label) {
            $providers[] = ['id' => $id, 'label' => $label];
        }
        return [
            'siteenabled' => user_llm::site_enabled(),
            'courseallowed' => user_llm::course_allowed($courseid),
            'configured' => $status !== null,
            'active' => user_llm::active_for($userid, [$courseid]),
            'provider' => $status['provider'] ?? '',
            'providerlabel' => $status !== null ? user_llm::PROVIDERS[$status['provider']] : '',
            'model' => $status['model'] ?? '',
            'keyhint' => $status['hint'] ?? '',
            'timetested' => $status['timetested'] ?? 0,
            'monthrequests' => $usage['requests'],
            'monthtokens' => $usage['tokens'],
            'providers' => $providers,
        ];
    }
}
