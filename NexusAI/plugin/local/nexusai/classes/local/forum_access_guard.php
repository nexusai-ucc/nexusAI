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
 * Checks access to a forum discussion before NexusAI reads or sends its posts (MMR-301 item 2).
 *
 * The external functions that touch forum posts only validated the course-level
 * `local/nexusai:use` capability, which ignores `mod/forum:viewdiscussion`, group
 * separation and hidden or timed discussions. This reuses Moodle's own
 * `forum_user_can_see_discussion()` so the same rules forum itself enforces apply here.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Validates that the current user can see a forum discussion.
 */
class forum_access_guard {
    /**
     * Returns the discussion record if the current user can see it, throws otherwise.
     *
     * @param int $discussionid mdl_forum_discussions ID.
     * @param int $courseid Moodle course ID the discussion is expected to belong to.
     * @return \stdClass The discussion record.
     * @throws \moodle_exception discussionnotaccessible, or if the discussion/forum/cm do not exist.
     */
    public static function require_can_view_discussion(int $discussionid, int $courseid): \stdClass {
        global $DB, $USER, $CFG;

        $discussion = $DB->get_record('forum_discussions', [
            'id'     => $discussionid,
            'course' => $courseid,
        ], '*', MUST_EXIST);
        $forum = $DB->get_record('forum', ['id' => $discussion->forum], '*', MUST_EXIST);
        $cm = get_coursemodule_from_instance('forum', $forum->id, $courseid, false, MUST_EXIST);
        $modcontext = \context_module::instance($cm->id);

        require_once($CFG->dirroot . '/mod/forum/lib.php');
        if (!forum_user_can_see_discussion($forum, $discussion, $modcontext, $USER)) {
            throw new \moodle_exception('discussionnotaccessible', 'local_nexusai');
        }

        return $discussion;
    }

    /**
     * Same check as require_can_view_discussion(), without throwing — for filtering a list.
     *
     * @param int $discussionid mdl_forum_discussions ID.
     * @param int $courseid Moodle course ID the discussion is expected to belong to.
     * @return bool
     */
    public static function can_view_discussion(int $discussionid, int $courseid): bool {
        try {
            self::require_can_view_discussion($discussionid, $courseid);
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
