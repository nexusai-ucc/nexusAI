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
 * External function `local_nexusai_course_setup_state` (ONB-02 / #425).
 *
 * Aggregates a course's "setup state" in a single call: what's still missing
 * for the teacher to set up. Feeds the creation tutorial (ONB-03) and the
 * review mode when editing (ONB-04).
 *
 * All Moodle signals are resolved **in-process** (no remote webservices):
 * sections with content, groups, enrolled students, forums and calendar
 * events. The only external signal is "material indexed in NexusAI", which
 * comes from the Python backend via `backend_client::get_course_stats`
 * — if the backend doesn't respond, that signal degrades to `present = null`
 * and the rest of the response stays valid.
 *
 * It's **100% read-only**: it doesn't write anything to Moodle (see ADR-010).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once($GLOBALS['CFG']->libdir . '/externallib.php');
require_once($GLOBALS['CFG']->dirroot . '/group/lib.php');
require_once($GLOBALS['CFG']->dirroot . '/calendar/lib.php');

/**
 * Aggregates a course's "setup state" in a single call: what's still missing for the teacher to set up.
 */
class course_setup_state extends \external_api {
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
     * Structure of an individual signal: present + count.
     *
     * `present` allows null only on the `material` signal (backend down).
     */
    private static function signal_structure(string $desc, bool $nullablepresent = false): \external_single_structure {
        return new \external_single_structure([
            'present' => new \external_value(
                PARAM_BOOL,
                $desc . ' — present',
                $nullablepresent ? VALUE_DEFAULT : VALUE_REQUIRED,
                null,
                $nullablepresent ? NULL_ALLOWED : NULL_NOT_ALLOWED
            ),
            'count'   => new \external_value(PARAM_INT, $desc . ' — count', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Return value for execute().
     *
     * @return \external_single_structure
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'courseid' => new \external_value(PARAM_INT, 'Queried course ID'),
            'sections' => self::signal_structure('Sections with at least one activity/resource'),
            'groups'   => self::signal_structure('Groups defined in the course'),
            'students' => self::signal_structure('Enrolled students (role with student archetype)'),
            'forums'   => self::signal_structure('Course forums'),
            'calendar' => self::signal_structure('Course\'s own calendar events'),
            'material' => self::signal_structure('Material indexed in NexusAI', true),
        ]);
    }

    /**
     * Aggregates a course's "setup state" in a single call: what's still missing for the teacher to set up.
     *
     * @param int $courseid Course ID
     * @return array
     */
    public static function execute(int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:manage', $context);

        $state = self::gather_moodle_signals($params['courseid'], $context);
        $state['courseid'] = (int) $params['courseid'];
        $state['material'] = self::material_signal(self::fetch_course_stats($params['courseid']));

        return $state;
    }

    /**
     * Gathers the 5 signals that live in Moodle. Separated from execute() so
     * it can be tested with a generated course without depending on the backend.
     *
     * @param int        $courseid
     * @param \context    $context  Course context (to count enrolment).
     * @return array{sections:array, groups:array, students:array, forums:array, calendar:array}
     */
    public static function gather_moodle_signals(int $courseid, \context $context): array {
        global $DB;

        // Sections with content (at least one module, hidden or not).
        $modinfo = get_fast_modinfo($courseid);
        $sectionswithcontent = 0;
        foreach ($modinfo->get_sections() as $cmids) {
            if (!empty($cmids)) {
                $sectionswithcontent++;
            }
        }

        // Groups.
        $groupcount = count(groups_get_all_groups($courseid));

        // Enrolled students (only roles with the student archetype).
        $studentroles = array_keys(get_archetype_roles('student'));
        $studentcount = empty($studentroles)
            ? 0
            : count_role_users($studentroles, $context);

        // Forums.
        $forumcount = $DB->count_records('forum', ['course' => $courseid]);

        // The course's own calendar events (not the user's).
        $calendarcount = $DB->count_records_select(
            'event',
            "courseid = :courseid AND eventtype <> 'user'",
            ['courseid' => $courseid]
        );

        return [
            'sections' => self::signal($sectionswithcontent),
            'groups'   => self::signal($groupcount),
            'students' => self::signal($studentcount),
            'forums'   => self::signal($forumcount),
            'calendar' => self::signal($calendarcount),
        ];
    }

    /**
     * Builds a signal from a count: present = count > 0.
     */
    public static function signal(int $count): array {
        $count = max(0, $count);
        return ['present' => $count > 0, 'count' => $count];
    }

    /**
     * Translates the `/courses/{id}/stats` response into a signal. `null` (the
     * backend didn't respond) → present unknown.
     *
     * @param array|null $stats Backend response, or null if it failed.
     * @return array{present:bool|null, count:int}
     */
    public static function material_signal(?array $stats): array {
        if ($stats === null) {
            return ['present' => null, 'count' => 0];
        }
        $count = (int) ($stats['document_count'] ?? 0);
        $present = array_key_exists('has_indexed_content', $stats)
            ? (bool) $stats['has_indexed_content']
            : $count > 0;
        return ['present' => $present, 'count' => max(0, $count)];
    }

    /**
     * Requests material stats from the backend. Any failure (incomplete
     * config, backend down, timeout) returns null instead of breaking the
     * whole external function.
     *
     * @param int $courseid
     * @return array|null
     */
    private static function fetch_course_stats(int $courseid): ?array {
        try {
            return (new backend_client())->get_course_stats($courseid);
        } catch (\Throwable $e) {
            debugging(
                'local_nexusai course_setup_state: could not fetch course stats: ' . $e->getMessage(),
                DEBUG_DEVELOPER
            );
            return null;
        }
    }
}
