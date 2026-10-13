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
 * Ad hoc task that removes copies the backend keeps of deleted data.
 *
 * Deleting a course or a user's data removes the plugin's own rows right away
 * (local queries) and queues this task for the backend's copies: the course's
 * indexed documents, or the user's indexed forum posts (one call per post), so
 * the deletion never waits for the backend.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\task;

/**
 * Deletes a course's documents or a list of forum posts from the backend.
 *
 * Custom data: action ('course_documents' with courseid, or 'forum_posts' with postids).
 */
class purge_backend_data extends \core\task\adhoc_task {
    /** @var int Forum posts handled by one task, so a single task never runs for too long. */
    const POSTS_PER_TASK = 200;

    /**
     * Queues the removal of every document of a deleted course.
     *
     * @param int $courseid Deleted course.
     */
    public static function queue_course_documents(int $courseid): void {
        $task = new self();
        $task->set_custom_data(['action' => 'course_documents', 'courseid' => $courseid]);
        \core\task\manager::queue_adhoc_task($task, true);
    }

    /**
     * Queues the removal of some forum posts from the similarity index, in batches.
     *
     * @param int[] $postids mdl_forum_posts ids.
     */
    public static function queue_forum_posts(array $postids): void {
        foreach (array_chunk(array_values(array_map('intval', $postids)), self::POSTS_PER_TASK) as $chunk) {
            $task = new self();
            $task->set_custom_data(['action' => 'forum_posts', 'postids' => $chunk]);
            \core\task\manager::queue_adhoc_task($task);
        }
    }

    /**
     * Deletes the copies. A backend failure is logged and the rest goes on.
     */
    public function execute(): void {
        if (!\local_nexusai\local\course_guard::plugin_enabled()) {
            return;
        }
        $data = $this->get_custom_data();

        try {
            $client = new \local_nexusai\external\backend_client();
            $client->set_role('system');
            if ($data->action === 'course_documents') {
                foreach ($client->list_documents((int) $data->courseid)['items'] ?? [] as $doc) {
                    $client->delete_document((string) $doc['id']);
                }
                return;
            }
            foreach ($data->postids as $postid) {
                $client->delete_forum_post((int) $postid);
            }
        } catch (\Throwable $e) {
            mtrace('[NexusAI] Purging backend data (' . $data->action . ') failed: ' . $e->getMessage());
        }
    }
}
