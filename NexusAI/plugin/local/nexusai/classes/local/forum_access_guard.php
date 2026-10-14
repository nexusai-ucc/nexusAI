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
 * Checks access to forum discussions and posts before NexusAI reads or sends them (MMR-301 item 2).
 *
 * The external functions that touch forum posts only validated the course-level
 * `local/nexusai:use` capability, which ignores `mod/forum:viewdiscussion`, group
 * separation and hidden or timed discussions. This reuses Moodle's own
 * `forum_user_can_see_discussion()` and, for each post, `forum_user_can_see_post()`,
 * so the same rules forum itself enforces apply here: private replies, deleted posts
 * and Q&A forums where students only see the other replies after posting.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Validates that the current user can see a forum discussion and its posts.
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

    /**
     * The posts of a discussion the current user can see, oldest first.
     *
     * Seeing the discussion is not enough: a private reply is only for its author, its
     * recipient and whoever has `mod/forum:readprivatereplies`, and a Q&A forum hides the
     * other replies until the student posts. Each post goes through `forum_user_can_see_post()`.
     *
     * @param \stdClass $discussion Discussion record, already checked with require_can_view_discussion().
     * @param int $since Only posts created at or after this time (0 = all).
     * @param bool $includeprivatereplies False to leave out every private reply, even the ones
     *     the user can see (for text that leaves the forum, such as the digest sent to a webhook).
     * @return \stdClass[] Post records.
     */
    public static function visible_posts(\stdClass $discussion, int $since = 0, bool $includeprivatereplies = true): array {
        global $DB, $USER, $CFG;
        require_once($CFG->dirroot . '/mod/forum/lib.php');

        $forum = $DB->get_record('forum', ['id' => $discussion->forum], '*', MUST_EXIST);
        $cm = get_fast_modinfo($discussion->course)->get_instances_of('forum')[(int) $forum->id] ?? null;
        if (!$cm) {
            return [];
        }

        $posts = $DB->get_records_select(
            'forum_posts',
            'discussion = :discussionid AND created >= :since',
            ['discussionid' => (int) $discussion->id, 'since' => $since],
            'created ASC, id ASC'
        );

        $visible = [];
        foreach ($posts as $post) {
            if (!$includeprivatereplies && !empty($post->privatereplyto)) {
                continue;
            }
            if (forum_user_can_see_post($forum, $discussion, $post, $USER, $cm)) {
                $visible[] = $post;
            }
        }
        return $visible;
    }

    /**
     * Whether the current user can see a forum post of the course.
     *
     * @param int $postid mdl_forum_posts ID.
     * @param int $courseid Moodle course ID the post is expected to belong to.
     * @return \stdClass|null The post record, or null when it does not exist, is in another
     *     course or the user cannot see it.
     */
    public static function visible_post(int $postid, int $courseid): ?\stdClass {
        global $DB, $USER, $CFG;
        require_once($CFG->dirroot . '/mod/forum/lib.php');

        $post = $DB->get_record('forum_posts', ['id' => $postid]);
        if (!$post) {
            return null;
        }
        $discussion = $DB->get_record('forum_discussions', ['id' => $post->discussion, 'course' => $courseid]);
        if (!$discussion) {
            return null;
        }
        $forum = $DB->get_record('forum', ['id' => $discussion->forum], '*', MUST_EXIST);
        $cm = get_fast_modinfo($courseid)->get_instances_of('forum')[(int) $forum->id] ?? null;
        if (!$cm || !forum_user_can_see_post($forum, $discussion, $post, $USER, $cm)) {
            return null;
        }
        return $post;
    }
}
