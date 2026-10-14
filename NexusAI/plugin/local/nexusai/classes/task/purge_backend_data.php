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

    /** @var int Documents asked for per listing; the backend never returns more than 500. */
    const DOCUMENTS_PER_PAGE = 500;

    /** @var int Listings per run at most, so a backend that does not delete cannot loop forever. */
    const MAX_DOCUMENT_PAGES = 100;

    /**
     * Deletes the copies.
     *
     * Removals do not depend on NexusAI being on: what was indexed while it was on has to
     * leave the backend when the course or the user's data is deleted (MMR-301 item 4), so
     * only a configured backend is needed. A failure is not swallowed: the task API runs
     * the task again later, and removing something twice is harmless.
     */
    public function execute(): void {
        if (!\local_nexusai\local\course_guard::backend_configured()) {
            return;
        }
        $data = $this->get_custom_data();

        $client = new \local_nexusai\external\backend_client();
        $client->set_role('system');
        if ($data->action === 'course_documents') {
            // Each listing returns one page; the deleted ones drop out, so list again
            // until nothing is left.
            for ($page = 0; $page < self::MAX_DOCUMENT_PAGES; $page++) {
                $items = $client->list_documents((int) $data->courseid, self::DOCUMENTS_PER_PAGE)['items'] ?? [];
                if (!$items) {
                    return;
                }
                foreach ($items as $doc) {
                    $client->delete_document((string) $doc['id']);
                }
            }
            return;
        }
        foreach ($data->postids as $postid) {
            $client->delete_forum_post((int) $postid);
        }
    }
}
