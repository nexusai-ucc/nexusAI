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
 * Ad hoc task that sends a forum post to the backend's similarity index, or removes it.
 *
 * The forum event observers only queue this task, so posting, editing or
 * deleting in a forum never waits for the backend (MMR-301 item 10).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\task;

/**
 * Indexes or removes one forum post in the backend.
 *
 * Custom data: action ('index' or 'delete'), postid, courseid, discussionid.
 */
class sync_forum_post extends \core\task\adhoc_task {
    /** @var int Posts shorter than this ("Thanks!", etc.) add nothing to the index. */
    const MIN_CHARS = 10;

    /**
     * Queues the sync of one post. An identical task still pending is not queued twice.
     *
     * @param string $action 'index' or 'delete'.
     * @param int $postid mdl_forum_posts ID.
     * @param int $courseid Course ID.
     * @param int $discussionid mdl_forum_discussions ID (0 when deleting).
     */
    public static function queue(string $action, int $postid, int $courseid, int $discussionid = 0): void {
        $task = new self();
        $task->set_custom_data([
            'action'       => $action,
            'postid'       => $postid,
            'courseid'     => $courseid,
            'discussionid' => $discussionid,
        ]);
        \core\task\manager::queue_adhoc_task($task, true);
    }

    /**
     * Sends the post as it is now (or removes it). A backend failure is logged, not retried.
     */
    public function execute(): void {
        global $DB;

        $data = $this->get_custom_data();
        $postid = (int) $data->postid;
        $courseid = (int) $data->courseid;

        if ($data->action === 'delete') {
            // A removal does not depend on the course: by the time the task runs, a deleted
            // course has no NexusAI settings left, and a course turned off still has its
            // posts in the backend (MMR-301 item 4). A failure is not swallowed: the task
            // API retries it later, and removing a post twice is harmless.
            if (\local_nexusai\local\course_guard::backend_configured()) {
                self::client()->delete_forum_post($postid);
            }
            return;
        }

        if (!\local_nexusai\local\course_guard::is_enabled($courseid)) {
            return;
        }

        try {
            // Read the post when the task runs: an edit made meanwhile is sent as it is now,
            // and a post deleted meanwhile is skipped.
            $post = $DB->get_record('forum_posts', ['id' => $postid]);
            if (!$post) {
                return;
            }
            $content = trim(strip_tags($post->message ?? ''));
            if (strlen($content) < self::MIN_CHARS) {
                return;
            }
            $discussionid = (int) $data->discussionid ?: (int) $post->discussion;
            $scope = \local_nexusai\local\visible_material::forum_scope($discussionid, $courseid);
            self::client()->index_forum_post($postid, $discussionid, $courseid, $content, $scope['cmid'], $scope['groupid']);
        } catch (\Throwable $e) {
            mtrace('[NexusAI] Forum post sync (' . $data->action . ') failed for post=' . $postid . ': ' . $e->getMessage());
        }
    }

    /**
     * Backend client acting as the system, not as a user.
     *
     * @return \local_nexusai\external\backend_client
     */
    private static function client(): \local_nexusai\external\backend_client {
        $client = new \local_nexusai\external\backend_client();
        $client->set_role('system');
        return $client;
    }
}
