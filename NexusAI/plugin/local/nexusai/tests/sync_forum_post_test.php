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
     * Fires the post_created event of the discussion's first post.
     *
     * @param \stdClass $forum Forum.
     * @param \stdClass $discussion Discussion.
     */
    private function trigger_post_created(\stdClass $forum, \stdClass $discussion): void {
        \mod_forum\event\post_created::create([
            'context'  => \context_module::instance($forum->cmid),
            'objectid' => $discussion->firstpost,
            'other'    => ['discussionid' => $discussion->id, 'forumid' => $forum->id, 'forumtype' => $forum->type],
        ])->trigger();
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

        $this->trigger_post_created($forum, $discussion);

        $tasks = $this->queued();
        $this->assertCount(1, $tasks);
        $data = reset($tasks)->get_custom_data();
        $this->assertSame('index', $data->action);
        $this->assertEquals($discussion->firstpost, $data->postid);
        $this->assertEquals($course->id, $data->courseid);

        $this->trigger_post_created($forum, $discussion);
        $this->assertCount(1, $this->queued(), 'An identical pending task is not queued twice.');
    }

    /**
     * Nothing is queued in a course where NexusAI is off.
     */
    public function test_nothing_is_queued_when_the_course_is_off(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        [, $forum, $discussion] = $this->create_forum_discussion();

        $this->trigger_post_created($forum, $discussion);

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
}
