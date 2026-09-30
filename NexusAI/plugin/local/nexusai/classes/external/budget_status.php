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
 * External function `local_nexusai_budget_status` (DATA-05).
 *
 * How much of their token limit the logged-in user has left, for the bar in
 * the widget: percentage used today and an approximate number of questions
 * left, worked out from the user's average tokens per question.
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
use local_nexusai\local\usage_store;

/**
 * The user's remaining token budget per hour and per day.
 */
class budget_status extends external_api {
    /**
     * Parameters for execute().
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
        ]);
    }

    /**
     * One window of the budget.
     *
     * @param string $name hourly or daily.
     * @return external_single_structure
     */
    private static function window(string $name): external_single_structure {
        return new external_single_structure([
            'limit' => new external_value(PARAM_INT, "Tokens allowed per window ($name)"),
            'used' => new external_value(PARAM_INT, 'Tokens used in the current window'),
            'remaining' => new external_value(PARAM_INT, 'Tokens left'),
            'percentused' => new external_value(PARAM_INT, 'Percentage used, 0..100'),
            'resetsinsec' => new external_value(PARAM_INT, 'Seconds until the window renews'),
            'questionsleft' => new external_value(PARAM_INT, 'Approximate questions left'),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'role' => new external_value(PARAM_ALPHA, 'student or teacher'),
            'source' => new external_value(PARAM_ALPHA, 'backend (latest reported value) or estimate'),
            'hourly' => self::window('hour'),
            'daily' => self::window('day'),
        ]);
    }

    /**
     * The logged-in user's remaining budget.
     *
     * @param int $courseid Course, to resolve the role.
     * @return array
     */
    public static function execute(int $courseid): array {
        global $USER;
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        $role = has_capability('local/nexusai:manage', $context) ? 'teacher' : 'student';
        $budget = usage_store::budget((int) $USER->id, $role);
        $pertoken = usage_store::average_question_tokens((int) $USER->id);
        $out = ['role' => $role, 'source' => $budget['source']];
        foreach (['hourly', 'daily'] as $window) {
            $w = $budget[$window];
            $out[$window] = [
                'limit' => $w['limit'],
                'used' => $w['used'],
                'remaining' => $w['remaining'],
                'percentused' => $w['percent_used'],
                'resetsinsec' => $w['resets_in_sec'],
                'questionsleft' => intdiv($w['remaining'], max(1, $pertoken)),
            ];
        }
        return $out;
    }
}
