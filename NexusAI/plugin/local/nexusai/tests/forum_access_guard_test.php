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
 * Tests for the per-post forum access check (MMR-301 item 2).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\forum_access_guard;

/**
 * Only the posts the user can see in the forum reach the AI or come back in the results.
 *
 * @covers \local_nexusai\local\forum_access_guard
 */
final class forum_access_guard_test extends \advanced_testcase {
    /**
     * A course with a teacher, two students, a forum and a discussion opened by student A.
     *
     * @param string $type Forum type ('general', 'qanda'...).
     * @return \stdClass Course, users, forum, discussion and its first post.
     */
    private function setup_forum(string $type = 'general'): \stdClass {
        global $DB;
        $generator = $this->getDataGenerator();
        $data = new \stdClass();
        $data->course = $generator->create_course();
        $data->teacher = $generator->create_and_enrol($data->course, 'editingteacher');
        $data->studenta = $generator->create_and_enrol($data->course, 'student');
        $data->studentb = $generator->create_and_enrol($data->course, 'student');
        $data->forum = $generator->create_module('forum', ['course' => $data->course->id, 'type' => $type]);
        $starter = $type === 'qanda' ? $data->teacher : $data->studenta;
        $discussion = $generator->get_plugin_generator('mod_forum')->create_discussion([
            'course'  => $data->course->id,
            'forum'   => $data->forum->id,
            'userid'  => $starter->id,
            'message' => 'Opening post of the discussion',
        ]);
        $data->discussion = $DB->get_record('forum_discussions', ['id' => $discussion->id], '*', MUST_EXIST);
        return $data;
    }

    /**
     * Adds a reply to the discussion's first post.
     *
     * @param \stdClass $data What setup_forum() returned.
     * @param \stdClass $author Author of the reply.
     * @param string $message Text of the reply.
     * @param int $privatereplyto User the reply is privately for (0 = public).
     * @return \stdClass The post.
     */
    private function reply(\stdClass $data, \stdClass $author, string $message, int $privatereplyto = 0): \stdClass {
        return $this->getDataGenerator()->get_plugin_generator('mod_forum')->create_post([
            'discussion'     => $data->discussion->id,
            'parent'         => $data->discussion->firstpost,
            'userid'         => $author->id,
            'message'        => $message,
            'privatereplyto' => $privatereplyto,
        ]);
    }

    /**
     * Messages of the posts the given user can see in the discussion.
     *
     * @param \stdClass $data What setup_forum() returned.
     * @param \stdClass $user User to check as.
     * @param bool $includeprivatereplies Passed to visible_posts().
     * @return string[]
     */
    private function messages_seen_by(\stdClass $data, \stdClass $user, bool $includeprivatereplies = true): array {
        $this->setUser($user);
        $posts = forum_access_guard::visible_posts($data->discussion, 0, $includeprivatereplies);
        return array_map(static fn($post) => $post->message, $posts);
    }

    /**
     * A private reply reaches only its author and its recipient.
     */
    public function test_private_reply_is_hidden_from_other_students(): void {
        $this->resetAfterTest();
        $data = $this->setup_forum();
        $this->reply($data, $data->teacher, 'Private note for student A', (int) $data->studenta->id);
        $this->reply($data, $data->studentb, 'Public reply by student B');

        $this->assertSame(
            ['Opening post of the discussion', 'Public reply by student B'],
            $this->messages_seen_by($data, $data->studentb)
        );
        $this->assertSame(
            ['Opening post of the discussion', 'Private note for student A', 'Public reply by student B'],
            $this->messages_seen_by($data, $data->studenta)
        );
        $this->assertSame(
            ['Opening post of the discussion', 'Private note for student A', 'Public reply by student B'],
            $this->messages_seen_by($data, $data->teacher)
        );
    }

    /**
     * Text that leaves the forum (the digest sent to a webhook) never carries private replies.
     */
    public function test_private_replies_can_be_left_out_for_everyone(): void {
        $this->resetAfterTest();
        $data = $this->setup_forum();
        $this->reply($data, $data->teacher, 'Private note for student A', (int) $data->studenta->id);

        $this->assertSame(['Opening post of the discussion'], $this->messages_seen_by($data, $data->teacher, false));
    }

    /**
     * In a Q&A forum a student does not see the other replies before posting.
     */
    public function test_qanda_replies_are_hidden_until_the_student_posts(): void {
        $this->resetAfterTest();
        $data = $this->setup_forum('qanda');
        $this->reply($data, $data->studenta, 'Answer by student A');

        $this->assertSame(['Opening post of the discussion'], $this->messages_seen_by($data, $data->studentb));
        $this->assertSame(
            ['Opening post of the discussion', 'Answer by student A'],
            $this->messages_seen_by($data, $data->teacher)
        );
    }

    /**
     * The since filter leaves out older posts.
     */
    public function test_since_leaves_out_older_posts(): void {
        $this->resetAfterTest();
        $data = $this->setup_forum();
        $since = time() + HOURSECS;
        $this->getDataGenerator()->get_plugin_generator('mod_forum')->create_post([
            'discussion' => $data->discussion->id,
            'parent'     => $data->discussion->firstpost,
            'userid'     => $data->studentb->id,
            'message'    => 'Recent reply',
            'created'    => $since,
        ]);

        $this->setUser($data->studenta);
        $posts = forum_access_guard::visible_posts($data->discussion, $since);
        $this->assertSame(['Recent reply'], array_map(static fn($post) => $post->message, $posts));
    }

    /**
     * visible_post() returns the post only to who can see it, and only for its own course.
     */
    public function test_visible_post(): void {
        $this->resetAfterTest();
        $data = $this->setup_forum();
        $private = $this->reply($data, $data->teacher, 'Private note for student A', (int) $data->studenta->id);
        $othercourse = $this->getDataGenerator()->create_course();

        $this->setUser($data->studentb);
        $this->assertNull(forum_access_guard::visible_post((int) $private->id, (int) $data->course->id));
        $this->assertNotNull(forum_access_guard::visible_post((int) $data->discussion->firstpost, (int) $data->course->id));
        $this->assertNull(forum_access_guard::visible_post((int) $data->discussion->firstpost, (int) $othercourse->id));
        $this->assertNull(forum_access_guard::visible_post(-1, (int) $data->course->id));

        $this->setUser($data->studenta);
        $post = forum_access_guard::visible_post((int) $private->id, (int) $data->course->id);
        $this->assertSame('Private note for student A', $post->message);
    }
}
