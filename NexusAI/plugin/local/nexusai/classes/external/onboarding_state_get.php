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
 * External function `local_nexusai_onboarding_state_get` (ONB-05 / #428).
 *
 * Reads, for the current user and a specific course, whether the onboarding
 * tutorial was dismissed (`dismissed`) and which optional steps were marked
 * "not applicable" (`skipped`). Persisted in **core**'s `user_preferences`
 * (`set_user_preference()`/`get_user_preferences()`), not in a table of the
 * plugin's own — that's why it doesn't change the Privacy declaration
 * (`null_provider`, see ADR-006 and ADR-010 section 5).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Reads, for the current user and a specific course, whether the onboarding tutorial was
 * dismissed (`dismissed`) and which optional steps were marked "not applicable" (`skipped`).
 */
class onboarding_state_get extends \external_api {
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
            'courseid'  => new \external_value(PARAM_INT, 'Queried course ID'),
            'dismissed' => new \external_value(PARAM_BOOL, 'The teacher dismissed the tutorial for this course'),
            'skipped'   => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'Key of the step marked "not applicable"')
            ),
        ]);
    }

    /**
     * Reads, for the current user and a specific course, whether the onboarding tutorial was
     * dismissed (`dismissed`) and which optional steps were marked "not applicable" (`skipped`).
     *
     * @param int $courseid Course ID
     * @return array
     */
    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        return self::read_state($params['courseid']);
    }

    /**
     * Separated from execute() so it can be tested without going through validate_context().
     *
     * @param int $courseid
     * @return array{courseid:int, dismissed:bool, skipped:string[]}
     */
    public static function read_state(int $courseid): array {
        $dismissed = get_user_preferences('local_nexusai_onb_dismissed_' . $courseid, '0') === '1';

        $skippedraw = get_user_preferences('local_nexusai_onb_skipped_' . $courseid, '[]');
        $skipped = json_decode($skippedraw, true);
        if (!is_array($skipped)) {
            $skipped = [];
        }

        return [
            'courseid'  => $courseid,
            'dismissed' => $dismissed,
            'skipped'   => array_values(array_map('strval', $skipped)),
        ];
    }
}
