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
 * @covers \local_nexusai\privacy\provider
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
     * Fills in the backend connection; nothing listens on that port.
     */
    private function configure_backend(): void {
        set_config('api_endpoint', 'http://127.0.0.1:9', 'local_nexusai');
        set_config('api_key', 'test-key', 'local_nexusai');
        set_config('shared_secret', 'test-secret', 'local_nexusai');
    }

    /**
     * A course with a forum and one discussion started by the given user.
     *
     * @param \stdClass $course Course.
     * @param \stdClass $author Author of the discussion.
     * @return int ID of the discussion's first post.
     */
    private function create_forum_post(\stdClass $course, \stdClass $author): int {
        global $DB;
        $generator = $this->getDataGenerator();
        $forum = $generator->create_module('forum', ['course' => $course->id]);
        $discussion = $generator->get_plugin_generator('mod_forum')->create_discussion([
            'course' => $course->id,
            'forum'  => $forum->id,
            'userid' => $author->id,
        ]);
        return (int) $DB->get_field('forum_discussions', 'firstpost', ['id' => $discussion->id]);
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
        $this->configure_backend();
        $course = $this->getDataGenerator()->create_course();

        local\data_cleanup::delete_course((int) $course->id);

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertSame('course_documents', $queued[0]->action);
        $this->assertEquals($course->id, $queued[0]->courseid);
    }

    /**
     * Deleting a course for real queues the removal of its forum posts and documents.
     *
     * It goes through Moodle's delete_course(): remove_course_contents() deletes the forum
     * posts before the course_deleted event fires, so only the before_course_deleted hook
     * can still find them (MMR-301 item 4). Calling data_cleanup::delete_course() directly,
     * with the posts still there, would hide that.
     */
    public function test_deleting_a_course_for_real_queues_its_forum_posts_purge(): void {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $postid = $this->create_forum_post($course, $generator->create_and_enrol($course, 'student'));

        delete_course($course->id, false);

        $this->assertFalse($DB->record_exists('forum_posts', ['id' => $postid]), 'Moodle removed the post.');
        // Only the hook's task is checked: the documents purge is queued by the course_deleted
        // observer, which some databases only run when the deletion's transaction commits, so it
        // may not have run yet inside the test (it is covered by the documents purge test).
        $forumtasks = array_values(array_filter(
            $this->queued(purge_backend_data::class),
            static fn($data) => $data->action === 'forum_posts'
        ));
        $this->assertCount(1, $forumtasks);
        $this->assertEquals([$postid], $forumtasks[0]->postids);
    }

    /**
     * The course_deleted clean-up only queues the documents: by then the posts are gone.
     */
    public function test_course_deleted_cleanup_queues_only_the_documents(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $this->create_forum_post($course, $generator->create_and_enrol($course, 'student'));

        local\data_cleanup::delete_course((int) $course->id);

        $queued = $this->queued(purge_backend_data::class);
        $this->assertSame(['course_documents'], array_column($queued, 'action'));
    }

    /**
     * Deleting a single forum, with its course left intact, also queues its posts' purge.
     *
     * The course_module_deleted event fires after mod_forum has already removed the
     * discussions and posts, so local_nexusai_pre_course_module_delete() (lib.php) is
     * what finds them, before Moodle calls forum_delete_instance().
     */
    public function test_deleting_a_forum_module_queues_its_posts_purge(): void {
        global $DB;
        $this->resetAfterTest();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $forum = $generator->create_module('forum', ['course' => $course->id]);
        $postid = (int) $DB->get_field('forum_discussions', 'firstpost', [
            'id' => $generator->get_plugin_generator('mod_forum')->create_discussion([
                'course' => $course->id,
                'forum'  => $forum->id,
                'userid' => $generator->create_and_enrol($course, 'student')->id,
            ])->id,
        ]);
        $cm = $DB->get_record('course_modules', ['id' => $forum->cmid], '*', MUST_EXIST);

        local_nexusai_pre_course_module_delete($cm);

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertSame('forum_posts', $queued[0]->action);
        $this->assertEquals([$postid], $queued[0]->postids);
    }

    /**
     * Deleting a non-forum module (a "File" activity, which already has its own sync
     * through sync_resource()) queues nothing through this callback.
     */
    public function test_deleting_a_non_forum_module_queues_nothing(): void {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->configure_backend();
        $course = $this->getDataGenerator()->create_course();
        $resource = $this->getDataGenerator()->create_module('resource', ['course' => $course->id]);
        $cm = $DB->get_record('course_modules', ['id' => $resource->cmid], '*', MUST_EXIST);

        local_nexusai_pre_course_module_delete($cm);

        $this->assertCount(0, $this->queued(purge_backend_data::class));
    }

    /**
     * Without a backend there is nothing to remove from it.
     */
    public function test_nothing_is_queued_without_a_backend(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();

        local\data_cleanup::delete_course((int) $course->id);

        $this->assertCount(0, $this->queued(purge_backend_data::class));
    }

    /**
     * With NexusAI off site-wide nothing is removed: the backend does not separate sites,
     * and a staging copy with production's credentials must not delete production's data.
     */
    public function test_nothing_is_queued_with_the_plugin_off_site_wide(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        set_config('enabled', 0, 'local_nexusai');
        $course = $this->getDataGenerator()->create_course();

        local\data_cleanup::delete_course((int) $course->id);

        $this->assertCount(0, $this->queued(purge_backend_data::class));
    }

    /**
     * Deleting a user's data queues the removal of their indexed forum posts.
     */
    public function test_deleting_user_data_queues_their_forum_posts_purge(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $postid = $this->create_forum_post($course, $student);
        $context = \context_course::instance($course->id);

        privacy\provider::delete_data_for_user(new approved_contextlist($student, 'local_nexusai', [$context->id]));

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertSame('forum_posts', $queued[0]->action);
        $this->assertEquals([$postid], $queued[0]->postids);
    }

    /**
     * A user who only wrote forum posts, and never used NexusAI, is still found by the Privacy API,
     * so their indexed posts can be removed.
     */
    public function test_forum_author_without_nexusai_data_is_found(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $postid = $this->create_forum_post($course, $student);
        $context = \context_course::instance($course->id);

        $contextids = privacy\provider::get_contexts_for_userid((int) $student->id)->get_contextids();
        $this->assertEquals([$context->id], array_values($contextids));

        $userlist = new \core_privacy\local\request\userlist($context, 'local_nexusai');
        privacy\provider::get_users_in_context($userlist);
        $this->assertEquals([$student->id], $userlist->get_userids());

        privacy\provider::delete_data_for_user(new approved_contextlist($student, 'local_nexusai', $contextids));
        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $this->assertEquals([$postid], $queued[0]->postids);
    }

    /**
     * Without a backend, forum authors are not reported: there is no copy anywhere.
     */
    public function test_forum_author_is_not_reported_without_a_backend(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_and_enrol($course, 'student');
        $this->create_forum_post($course, $student);

        $this->assertCount(0, privacy\provider::get_contexts_for_userid((int) $student->id)->get_contextids());
    }

    /**
     * Deleting the data of everyone in a course queues the removal of all its forum posts.
     */
    public function test_deleting_the_whole_course_queues_all_its_posts(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $posta = $this->create_forum_post($course, $generator->create_and_enrol($course, 'student'));
        $postb = $this->create_forum_post($course, $generator->create_and_enrol($course, 'student'));

        privacy\provider::delete_data_for_all_users_in_context(\context_course::instance($course->id));

        $queued = $this->queued(purge_backend_data::class);
        $this->assertCount(1, $queued);
        $postids = $queued[0]->postids;
        sort($postids);
        $this->assertEquals([$posta, $postb], $postids);
    }

    /**
     * A removal the backend could not do fails the task, so the task API runs it again.
     */
    public function test_failed_purge_is_retried(): void {
        $this->resetAfterTest();
        $this->configure_backend();
        $task = new purge_backend_data();
        $task->set_custom_data(['action' => 'forum_posts', 'postids' => [1]]);

        $this->expectException(\moodle_exception::class);
        $task->execute();
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
