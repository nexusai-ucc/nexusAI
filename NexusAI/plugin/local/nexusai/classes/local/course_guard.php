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
 * Whether NexusAI is on for a course (CURSO-01, issue #520).
 *
 * Every entry point of the plugin (external functions, standalone scripts,
 * the widget, observers and tasks) asks this class before doing anything, so
 * a course that is off shows nothing, calls nothing and spends no tokens.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Site-wide and per-course switch for NexusAI.
 */
class course_guard {
    /** @var string Table holding the per-course setting. */
    const TABLE = 'local_nexusai_course';

    /**
     * Whether the site-wide switch in the plugin settings is on.
     *
     * @return bool
     */
    public static function plugin_enabled(): bool {
        return !empty(get_config('local_nexusai', 'enabled'));
    }

    /**
     * Whether NexusAI is on for a course: the site-wide switch AND the course
     * setting. A course without its own setting uses the admin default, which
     * ships off so courses can be turned on one at a time.
     *
     * @param int $courseid Course id.
     * @return bool
     */
    public static function is_enabled(int $courseid): bool {
        if ($courseid <= SITEID || !self::plugin_enabled()) {
            return false;
        }
        return self::course_setting($courseid);
    }

    /**
     * Stops the request when NexusAI is off for the course.
     *
     * @param int $courseid Course id.
     * @return void
     * @throws \moodle_exception coursedisabled
     */
    public static function require_enabled(int $courseid): void {
        if (!self::is_enabled($courseid)) {
            throw new \moodle_exception('coursedisabled', 'local_nexusai');
        }
    }

    /**
     * The course's own setting, ignoring the site-wide switch.
     *
     * @param int $courseid Course id.
     * @return bool
     */
    public static function course_setting(int $courseid): bool {
        global $DB;
        $enabled = $DB->get_field(self::TABLE, 'enabled', ['courseid' => $courseid]);
        if ($enabled === false) {
            return !empty(get_config('local_nexusai', 'default_course_enabled'));
        }
        return (bool) $enabled;
    }

    /**
     * Turns NexusAI on or off for a course. Nothing is deleted when turning
     * it off: history, questions and documents come back when it is on again.
     *
     * @param int $courseid Course id.
     * @param bool $enabled New value.
     * @return void
     */
    public static function set_enabled(int $courseid, bool $enabled): void {
        global $DB, $USER;

        $now = time();
        $existing = $DB->get_record(self::TABLE, ['courseid' => $courseid]);
        if ($existing) {
            $existing->enabled = $enabled ? 1 : 0;
            $existing->usermodified = (int) $USER->id;
            $existing->timemodified = $now;
            $DB->update_record(self::TABLE, $existing);
        } else {
            $DB->insert_record(self::TABLE, (object) [
                'courseid' => $courseid,
                'enabled' => $enabled ? 1 : 0,
                'usermodified' => (int) $USER->id,
                'timemodified' => $now,
            ]);
        }

        \local_nexusai\event\course_settings_updated::create([
            'context' => \context_course::instance($courseid),
            'other' => ['enabled' => $enabled ? 1 : 0],
        ])->trigger();
    }

    /**
     * Whether NexusAI may show anything outside a course (dashboard, site
     * pages, the create-course screen). Off by default.
     *
     * @return bool
     */
    public static function show_outside_course(): bool {
        return self::plugin_enabled() && !empty(get_config('local_nexusai', 'show_outside_course'));
    }
}
