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
 * Ad hoc task that brings the index up to date with an edited or deleted "File" activity.
 *
 * The course module observers only queue this task, so editing or deleting an
 * activity never waits for the backend (it may have to upload the whole file).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\task;

use local_nexusai\local\material_sync;

/**
 * Reindexes or removes the documents of one activity.
 *
 * Custom data: action ('sync' or 'remove'), courseid, cmid.
 */
class sync_material extends \core\task\adhoc_task {
    /**
     * Queues the sync of one activity. An identical task still pending is not queued twice.
     *
     * @param string $action 'sync' (the activity was updated) or 'remove' (it was deleted).
     * @param int $courseid Course id.
     * @param int $cmid Course module id.
     */
    public static function queue(string $action, int $courseid, int $cmid): void {
        $task = new self();
        $task->set_custom_data(['action' => $action, 'courseid' => $courseid, 'cmid' => $cmid]);
        \core\task\manager::queue_adhoc_task($task, true);
    }

    /**
     * Works with the activity as it is when the task runs: a file replaced again
     * meanwhile is the one indexed, and an activity deleted meanwhile is removed.
     */
    public function execute(): void {
        if (!\local_nexusai\local\course_guard::plugin_enabled()) {
            return;
        }
        $data = $this->get_custom_data();
        $courseid = (int) $data->courseid;
        $cmid = (int) $data->cmid;

        try {
            $client = new \local_nexusai\external\backend_client();
            $client->set_role('system');
            $sync = new material_sync($client);
            if ($data->action === 'remove') {
                $sync->remove_activity($courseid, $cmid);
            } else {
                $sync->sync_activity($courseid, $cmid);
            }
        } catch (\Throwable $e) {
            mtrace('[NexusAI] Syncing the index failed for cmid=' . $cmid . ': ' . $e->getMessage());
        }
    }
}
