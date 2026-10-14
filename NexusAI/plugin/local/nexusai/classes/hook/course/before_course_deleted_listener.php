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
 * Listener for the `core_course\hook\before_course_deleted` hook (MMR-301 item 4).
 *
 * When Moodle deletes a course, remove_course_contents() calls each forum's
 * forum_delete_instance() directly, so its posts are gone by the time the
 * course_deleted event fires, and neither that event nor the
 * pre_course_module_delete callback gets to see them. This hook runs before any
 * content is removed: it is the only point where the course's forum posts can
 * still be listed to purge their copies from the backend.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\hook\course;

use core_course\hook\before_course_deleted;

/**
 * Queues the purge of a course's forum posts from the backend before Moodle deletes them.
 */
class before_course_deleted_listener {
    /**
     * Lists the course's forum posts while they still exist and queues their removal
     * from the backend (task\purge_backend_data). Never stops the course deletion.
     *
     * @param before_course_deleted $hook The hook, with the course about to be deleted.
     */
    public static function callback(before_course_deleted $hook): void {
        $courseid = (int) $hook->course->id;
        try {
            \local_nexusai\privacy\provider::delete_backend_forum_posts($courseid, null);
        } catch (\Throwable $e) {
            debugging(
                '[NexusAI] Could not queue the forum posts purge of course ' . $courseid . ': ' . $e->getMessage(),
                DEBUG_NORMAL
            );
        }
    }
}
