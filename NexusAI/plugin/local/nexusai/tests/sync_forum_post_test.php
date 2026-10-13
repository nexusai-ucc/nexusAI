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
 * Tests for the forum post sync ad hoc task (MMR-301 item 10).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\task\sync_forum_post;

/**
 * The forum observers queue the sync instead of calling the backend.
 *
 * @covers \local_nexusai\task\sync_forum_post
 * @covers \local_nexusai\observer
 */
final class sync_forum_post_test extends \advanced_testcase {
    /**
     * Creates a course with a forum and a discussion.
     *
     * @return array [course, forum, discussion]
     */
    private function create_forum_discussion(): array {
        global $DB;
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $user = $generator->create_and_enrol($course, 'student');
        $forum = $generator->create_module('forum', ['course' => $course->id]);
        $discussion = $generator->get_plugin_generator('mod_forum')->create_discussion([
            'course'  => $course->id,
            'forum'   => $forum->id,
            'userid'  => $user->id,
            'message' => 'How do I solve the second exercise of the practical work?',
        ]);
        // The generator does not return firstpost; read the stored discussion.
        $discussion = $DB->get_record('forum_discussions', ['id' => $discussion->id], '*', MUST_EXIST);
        return [$course, $forum, $discussion];
    }

    /**
     * Hands the post_created event of the discussion's first post to the observer.
     *
     * The observer is called directly instead of triggering the event: what is
     * tested is what the observer does, not Moodle's event dispatching.
     *
     * @param \stdClass $forum Forum.
     * @param \stdClass $discussion Discussion.
     */
    private function notify_post_created(\stdClass $forum, \stdClass $discussion): void {
        $event = \mod_forum\event\post_created::create([
            'context'  => \context_module::instance($forum->cmid),
            'objectid' => $discussion->firstpost,
            'other'    => ['discussionid' => $discussion->id, 'forumid' => $forum->id, 'forumtype' => $forum->type],
        ]);
        observer::forum_post_created($event);
    }

    /**
     * Pending sync tasks.
     *
     * @return \core\task\adhoc_task[]
     */
    private function queued(): array {
        return \core\task\manager::get_adhoc_tasks(sync_forum_post::class);
    }

    /**
     * A new post in a course with NexusAI on is queued, not sent right away.
     */
    public function test_post_created_queues_the_sync(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        [$course, $forum, $discussion] = $this->create_forum_discussion();
        local\course_guard::set_enabled((int) $course->id, true);
        $this->assertTrue(local\course_guard::is_enabled((int) $course->id));

        $this->notify_post_created($forum, $discussion);

        $tasks = $this->queued();
        $this->assertCount(1, $tasks);
        $data = reset($tasks)->get_custom_data();
        $this->assertSame('index', $data->action);
        $this->assertEquals($discussion->firstpost, $data->postid);
        $this->assertEquals($course->id, $data->courseid);

        $this->notify_post_created($forum, $discussion);
        $this->assertCount(1, $this->queued(), 'An identical pending task is not queued twice.');
    }

    /**
     * Nothing is queued in a course where NexusAI is off.
     */
    public function test_nothing_is_queued_when_the_course_is_off(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        [, $forum, $discussion] = $this->create_forum_discussion();

        $this->notify_post_created($forum, $discussion);

        $this->assertCount(0, $this->queued());
    }

    /**
     * A post deleted before the task runs is skipped without calling the backend.
     */
    public function test_a_post_deleted_meanwhile_is_skipped(): void {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();
        [$course, , $discussion] = $this->create_forum_discussion();
        local\course_guard::set_enabled((int) $course->id, true);
        $DB->delete_records('forum_posts', ['id' => $discussion->firstpost]);

        $task = new sync_forum_post();
        $task->set_custom_data([
            'action'       => 'index',
            'postid'       => (int) $discussion->firstpost,
            'courseid'     => (int) $course->id,
            'discussionid' => (int) $discussion->id,
        ]);
        $task->execute();

        $this->expectOutputString('');
    }

    /**
     * A removal task for the given post.
     *
     * @param int $postid Post ID.
     * @param int $courseid Course ID.
     * @return sync_forum_post
     */
    private function removal(int $postid, int $courseid): sync_forum_post {
        $task = new sync_forum_post();
        $task->set_custom_data(['action' => 'delete', 'postid' => $postid, 'courseid' => $courseid, 'discussionid' => 0]);
        return $task;
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
     * A deleted post is queued for removal even in a course where NexusAI is off now:
     * it may have been indexed while it was on.
     */
    public function test_deleted_post_is_queued_when_the_course_is_off(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $this->configure_backend();
        [$course, $forum, $discussion] = $this->create_forum_discussion();
        $this->assertFalse(local\course_guard::is_enabled((int) $course->id));

        observer::forum_post_deleted(\mod_forum\event\post_deleted::create([
            'context'  => \context_module::instance($forum->cmid),
            'objectid' => $discussion->firstpost,
            'other'    => ['discussionid' => $discussion->id, 'forumid' => $forum->id, 'forumtype' => $forum->type],
        ]));

        $tasks = $this->queued();
        $this->assertCount(1, $tasks);
        $this->assertSame('delete', reset($tasks)->get_custom_data()->action);
    }

    /**
     * The removal runs for a course that no longer exists, and a backend failure fails the
     * task so the task API runs it again instead of losing it.
     */
    public function test_removal_does_not_depend_on_the_course_and_is_retried(): void {
        $this->resetAfterTest();
        $this->configure_backend();

        $this->expectException(\moodle_exception::class);
        $this->removal(123, 999999)->execute();
    }

    /**
     * Without a backend the removal has nothing to do.
     */
    public function test_removal_without_a_backend_does_nothing(): void {
        $this->resetAfterTest();

        $this->removal(123, 999999)->execute();

        $this->expectOutputString('');
    }
}
