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
 * Tests that material sync and backend purges are queued, never run in the request.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use core_privacy\local\request\approved_contextlist;
use local_nexusai\local\course_guard;
use local_nexusai\task\purge_backend_data;
use local_nexusai\task\sync_material;

/**
 * The observers and the deletions queue ad hoc tasks for everything that needs the backend.
 *
 * @covers \local_nexusai\task\sync_material
 * @covers \local_nexusai\task\purge_backend_data
 * @covers \local_nexusai\observer
 * @covers \local_nexusai\local\data_cleanup
 */
final class backend_tasks_test extends \advanced_testcase {
    /**
     * Pending tasks of a class, as custom data objects.
     *
     * @param string $class Task class.
     * @return \stdClass[]
     */
    private function queued(string $class): array {
        return array_values(array_map(
            static fn($task) => $task->get_custom_data(),
            \core\task\manager::get_adhoc_tasks($class)
        ));
    }

    /**
     * Updating or deleting a "File" activity queues the index sync instead of calling the backend.
     */
    public function test_file_activity_events_queue_the_sync(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        course_guard::set_enabled((int) $course->id, true);
        $resource = $this->getDataGenerator()->create_module('resource', ['course' => $course->id]);
        // Creating the File activity runs course_module_created, which logs a developer
        // message on some databases (when the creation transaction commits). Only what
        // the observers under test do matters here.
        $this->resetDebugging();
        $data = [
            'courseid' => $course->id,
            'context'  => \context_module::instance($resource->cmid),
            'objectid' => $resource->cmid,
            'other'    => ['modulename' => 'resource', 'instanceid' => $resource->id, 'name' => 'Notes'],
        ];

        observer::course_module_updated(\core\event\course_module_updated::create($data));
        observer::course_module_deleted(\core\event\course_module_deleted::create($data));

        $queued = $this->queued(sync_material::class);
        $this->assertCount(2, $queued);
        $this->assertEqualsCanonicalizing(['sync', 'remove'], array_column($queued, 'action'));
        $this->assertEquals($resource->cmid, $queued[0]->cmid);
        $this->assertDebuggingNotCalled();
    }

    /**
     * Deleting a course queues the removal of its documents from the backend.
     */
    public function test_deleting_a_course_queues_its_documents_purge(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();

        local\data_cleanup::delete_course((int) $course->id);

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertSame('course_documents', $queued[0]->action);
        $this->assertEquals($course->id, $queued[0]->courseid);
    }

    /**
     * With the plugin off nothing is queued for the backend.
     */
    public function test_nothing_is_queued_when_the_plugin_is_off(): void {
        $this->resetAfterTest();
        set_config('enabled', 0, 'local_nexusai');
        $course = $this->getDataGenerator()->create_course();

        local\data_cleanup::delete_course((int) $course->id);

        $this->assertCount(0, $this->queued(purge_backend_data::class));
    }

    /**
     * Deleting a user's data queues the removal of their indexed forum posts.
     */
    public function test_deleting_user_data_queues_their_forum_posts_purge(): void {
        global $DB;
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $forum = $generator->create_module('forum', ['course' => $course->id]);
        $discussion = $generator->get_plugin_generator('mod_forum')->create_discussion([
            'course' => $course->id,
            'forum'  => $forum->id,
            'userid' => $student->id,
        ]);
        $postid = (int) $DB->get_field('forum_discussions', 'firstpost', ['id' => $discussion->id]);
        $context = \context_course::instance($course->id);

        privacy\provider::delete_data_for_user(new approved_contextlist($student, 'local_nexusai', [$context->id]));

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertSame('forum_posts', $queued[0]->action);
        $this->assertEquals([$postid], $queued[0]->postids);
    }

    /**
     * Many posts are split in several tasks.
     */
    public function test_forum_posts_are_purged_in_batches(): void {
        $this->resetAfterTest();

        purge_backend_data::queue_forum_posts(range(1, purge_backend_data::POSTS_PER_TASK + 1));

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(2, $queued);
        $sizes = array_map(static fn($data) => count($data->postids), $queued);
        sort($sizes);
        $this->assertSame([1, purge_backend_data::POSTS_PER_TASK], $sizes);
    }
}
