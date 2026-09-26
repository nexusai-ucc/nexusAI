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
 * External function `local_nexusai_onboarding_state_set` (ONB-05 / #428).
 *
 * Saves, for the current user and a specific course, whether the tutorial
 * was dismissed (`dismissed`) and which optional steps are marked "not
 * applicable" (`skipped`). Full replacement (read-modify-write from the
 * front end) — same simple pattern as the rest of the plugin, no partial operations.
 *
 * The only write in the whole onboarding epic (ADR-010), and it's on
 * core's `user_preferences`, not a table of its own.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');

/**
 * Saves, for the current user and a specific course, whether the tutorial was dismissed
 * (`dismissed`) and which optional steps are marked "not applicable" (`skipped`).
 */
class onboarding_state_set extends \external_api {
    /** Cap on `skipped` items — there are at most 6 possible steps today, 20 gives margin. */
    private const MAX_SKIPPED = 20;

    /**
     * Parameters for execute().
     *
     * @return \external_function_parameters
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'Course ID', VALUE_REQUIRED),
            'dismissed' => new \external_value(PARAM_BOOL, 'Dismiss (true) or reopen (false) the tutorial', VALUE_REQUIRED),
            'skipped'   => new \external_multiple_structure(
                new \external_value(PARAM_ALPHANUMEXT, 'Key of the step marked "not applicable"'),
                'Optional steps excluded from future reviews',
                VALUE_REQUIRED
            ),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'success' => new \external_value(PARAM_BOOL, 'Saved successfully'),
        ]);
    }

    /**
     * Saves, for the current user and a specific course, whether the tutorial was dismissed
     * (`dismissed`) and which optional steps are marked "not applicable" (`skipped`).
     *
     * @param int $courseid Course ID
     * @param bool $dismissed Dismiss (true) or reopen (false) the tutorial
     * @param array $skipped Optional steps excluded from future reviews
     * @return array
     */
    public static function execute(int $courseid, bool $dismissed, array $skipped): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'dismissed' => $dismissed,
            'skipped'   => $skipped,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);
        \local_nexusai\local\course_guard::require_enabled((int) $params['courseid']);

        self::write_state($params['courseid'], $params['dismissed'], $params['skipped']);

        return ['success' => true];
    }

    /**
     * Separated from execute() so it can be tested without going through validate_context().
     */
    public static function write_state(int $courseid, bool $dismissed, array $skipped): void {
        $skipped = array_slice(array_values(array_unique($skipped)), 0, self::MAX_SKIPPED);

        set_user_preference('local_nexusai_onb_dismissed_' . $courseid, $dismissed ? '1' : '0');
        set_user_preference('local_nexusai_onb_skipped_' . $courseid, json_encode($skipped));
    }
}
