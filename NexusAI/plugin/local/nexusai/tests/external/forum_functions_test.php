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
 * Tests for the forum AI external functions (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for forum_summarize_thread, forum_suggest_reply, forum_search_similar
 * and forum_weekly_digest.
 *
 * @covers \local_nexusai\external\forum_summarize_thread
 * @covers \local_nexusai\external\forum_suggest_reply
 * @covers \local_nexusai\external\forum_search_similar
 * @covers \local_nexusai\external\forum_weekly_digest
 */
final class forum_functions_test extends external_testcase {
    /**
     * Arrange: a course with a general forum and a discussion opened by a
     * student, with one reply.
     *
     * @param string $role Role of the logged-in user.
     * @return \stdClass Course, user, forum, discussion and reply.
     */
    private function setup_forum(string $role = 'student'): \stdClass {
        $data = $this->setup_course($role);
        $generator = $this->getDataGenerator();
        $forumgen = $generator->get_plugin_generator('mod_forum');
        $author = $generator->create_and_enrol($data->course, 'student');
        $data->forum = $generator->create_module('forum', ['course' => $data->course->id, 'name' => 'Consultas']);
        $data->discussion = $forumgen->create_discussion([
            'course' => $data->course->id,
            'forum' => $data->forum->id,
            'userid' => $author->id,
            'name' => 'Duda sobre recursión',
            'message' => '<p>¿Cómo se calcula la complejidad de una función recursiva?</p>',
        ]);
        $data->reply = $forumgen->create_post([
            'discussion' => $data->discussion->id,
            'parent' => $data->discussion->firstpost,
            'userid' => $author->id,
            'message' => '<p>Con el teorema maestro, creo.</p>',
        ]);
        return $data;
    }

    /**
     * Criterion: the summary of a visible thread comes from the backend, and
     * authors leave Moodle only as pseudonyms.
     */
    public function test_summarize_thread_returns_the_backend_summary(): void {
        // Arrange.
        $data = $this->setup_forum();
        $this->mock_backend([
            'summary' => 'Preguntan por la complejidad de funciones recursivas.',
            'key_points' => ['Teorema maestro'],
            'resolved' => true,
            'posts_used' => 2,
        ]);

        // Act.
        $result = $this->call(forum_summarize_thread::class, [(int) $data->discussion->id, (int) $data->course->id]);

        // Assert.
        $this->assertStringContainsString('recursivas', $result['summary']);
        $this->assertSame(['Teorema maestro'], $result['key_points']);
        $this->assertTrue($result['resolved']);
        $this->assertSame(2, $result['posts_used']);
        $this->assertFalse($result['posts_truncated']);
    }

    /**
     * Criterion: the suggested reply answers the chosen post and reports
     * whether course material backed it.
     */
    public function test_suggest_reply_returns_the_backend_suggestion(): void {
        // Arrange.
        $data = $this->setup_forum('editingteacher');
        $this->mock_backend([
            'suggested_reply' => 'Se puede plantear la recurrencia T(n) = 2T(n/2) + n.',
            'has_course_material' => true,
            'sources_used' => 2,
        ]);

        // Act.
        $result = $this->call(forum_suggest_reply::class, [
            (int) $data->discussion->id,
            (int) $data->course->id,
            (int) $data->discussion->firstpost,
        ]);

        // Assert.
        $this->assertStringContainsString('T(n)', $result['suggested_reply']);
        $this->assertTrue($result['has_course_material']);
        $this->assertSame(2, $result['sources_used']);
    }

    /**
     * Criterion: similar posts come back only if the user can see them, with a
     * plain-text preview; ids the user cannot see are dropped.
     */
    public function test_search_similar_keeps_only_visible_posts(): void {
        // Arrange.
        $data = $this->setup_forum();
        $this->mock_backend([
            'similar_posts' => [
                ['forum_post_id' => (int) $data->reply->id, 'similarity' => 0.87],
                ['forum_post_id' => 999999, 'similarity' => 0.80],
            ],
            'threshold_used' => 0.75,
        ]);

        // Act.
        $result = $this->call(forum_search_similar::class, [
            '¿Cómo calculo la complejidad de una recursión?',
            (int) $data->course->id,
            0,
            50,
        ]);

        // Assert.
        $this->assertCount(1, $result['similar_posts']);
        $this->assertSame((int) $data->reply->id, $result['similar_posts'][0]['forum_post_id']);
        $this->assertSame('Con el teorema maestro, creo.', $result['similar_posts'][0]['preview']);
        $this->assertEqualsWithDelta(0.75, $result['threshold_used'], 0.001);
    }

    /**
     * Criterion (boundary): a text shorter than 10 characters returns no
     * results without calling the backend.
     */
    public function test_search_similar_ignores_a_short_text(): void {
        // Arrange.
        $data = $this->setup_forum();

        // Act.
        $result = $this->call(forum_search_similar::class, ['corto', (int) $data->course->id]);

        // Assert.
        $this->assertSame([], $result['similar_posts']);
    }

    /**
     * Criterion: the weekly digest sends the recent discussions and maps the
     * backend's answer.
     */
    public function test_weekly_digest_maps_the_backend_answer(): void {
        // Arrange.
        $data = $this->setup_forum('editingteacher');
        $this->mock_backend([
            'course_id' => (int) $data->course->id,
            'period_days' => 7,
            'discussion_count' => 1,
            'discussions' => [[
                'discussion_id' => (int) $data->discussion->id,
                'discussion_name' => 'Duda sobre recursión',
                'forum_name' => 'Consultas',
                'post_count' => 2,
                'urgent' => true,
            ]],
            'summary' => 'Una consulta sin resolver sobre recursión.',
        ]);

        // Act.
        $result = $this->call(forum_weekly_digest::class, [(int) $data->course->id, 99]);

        // Assert.
        $this->assertSame(1, $result['discussion_count']);
        $this->assertTrue($result['discussions'][0]['urgent']);
        $this->assertSame('Una consulta sin resolver sobre recursión.', $result['summary']);
    }

    /**
     * Criterion: without recent discussions the digest is empty and the
     * backend is not called.
     */
    public function test_weekly_digest_without_discussions_is_empty(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');

        // Act.
        $result = $this->call(forum_weekly_digest::class, [(int) $data->course->id]);

        // Assert.
        $this->assertSame(0, $result['discussion_count']);
        $this->assertNull($result['summary']);
    }

    /**
     * Criterion: a student cannot read the weekly digest (local/nexusai:manage).
     */
    public function test_student_cannot_read_the_weekly_digest(): void {
        // Arrange.
        $data = $this->setup_course('student');

        // Act and assert.
        $this->assert_call_fails('nopermissions', forum_weekly_digest::class, [(int) $data->course->id]);
    }
}
