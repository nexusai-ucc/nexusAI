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
 * Tests for the chat history, gaps and privacy external functions (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use local_nexusai\local\chat_store;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for chat_sessions_list, chat_session_messages, gaps_list and privacy_export.
 *
 * @covers \local_nexusai\external\chat_sessions_list
 * @covers \local_nexusai\external\chat_session_messages
 * @covers \local_nexusai\external\gaps_list
 * @covers \local_nexusai\external\privacy_export
 */
final class chat_history_functions_test extends external_testcase {
    /**
     * Arrange: a conversation of the logged-in user with a question and an answer.
     *
     * @param \stdClass $data What setup_course() returned.
     * @return \stdClass The session.
     */
    private function create_conversation(\stdClass $data): \stdClass {
        $session = chat_store::get_or_create_session((int) $data->user->id, (int) $data->course->id, null);
        chat_store::add_message($session, 'user', '¿Qué es una cola?');
        chat_store::add_message($session, 'assistant', 'Una estructura FIFO.');
        return $session;
    }

    /**
     * Criterion: the user's conversations of the course are listed with their
     * message count and a preview of the last message.
     */
    public function test_sessions_list_shows_the_conversations(): void {
        // Arrange.
        $data = $this->setup_course();
        $session = $this->create_conversation($data);

        // Act.
        $result = $this->call(chat_sessions_list::class, [(int) $data->course->id, true, 500]);

        // Assert.
        $this->assertCount(1, $result['sessions']);
        $this->assertSame($session->uuid, $result['sessions'][0]['id']);
        $this->assertSame(2, $result['sessions'][0]['message_count']);
    }

    /**
     * Criterion: resuming a conversation returns its messages in order.
     */
    public function test_session_messages_returns_the_conversation(): void {
        // Arrange.
        $data = $this->setup_course();
        $session = $this->create_conversation($data);

        // Act.
        $result = $this->call(chat_session_messages::class, [(int) $data->course->id, $session->uuid]);

        // Assert.
        $this->assertSame($session->uuid, $result['session_id']);
        $this->assertSame(['user', 'assistant'], array_column($result['messages'], 'role'));
    }

    /**
     * Criterion: another user's conversation is not found, and a malformed id
     * (shorter than 8 characters) is rejected.
     */
    public function test_session_messages_protects_other_conversations(): void {
        // Arrange.
        $data = $this->setup_course();
        $session = $this->create_conversation($data);
        $other = $this->getDataGenerator()->create_and_enrol($data->course, 'student');
        $this->setUser($other);

        // Act and assert.
        $this->assert_call_fails('errorsessionnotfound', chat_session_messages::class, [(int) $data->course->id, $session->uuid]);
        $this->assert_call_fails('errorinvalidparams', chat_session_messages::class, [(int) $data->course->id, 'abc']);
    }

    /**
     * Criterion: questions the material could not answer are grouped in the
     * gaps list the teacher sees.
     */
    public function test_gaps_list_groups_the_unanswered_questions(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $student = $this->getDataGenerator()->create_and_enrol($data->course, 'student');
        $gap = ['is_gap' => true, 'max_similarity' => 0.2, 'chunks_retrieved' => 0];
        chat_store::record_gap($courseid, (int) $student->id, '¿Entra el tema 7 en el parcial?', $gap);
        chat_store::record_gap($courseid, (int) $student->id, '¿Entra el tema 7 en el parcial?', $gap);
        chat_store::record_gap($courseid, (int) $student->id, 'No es una laguna', ['is_gap' => false]);

        // Act.
        $result = $this->call(gaps_list::class, [$courseid, 0, 0, -1]);

        // Assert.
        $this->assertSame(1, $result['total']);
        $this->assertSame(2, $result['items'][0]['count']);
        $this->assertFalse($result['items'][0]['is_archived']);
    }

    /**
     * Criterion: a student cannot see the gaps (local/nexusai:manage).
     */
    public function test_student_cannot_see_the_gaps(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act and assert.
        $this->assert_call_fails('nopermissions', gaps_list::class, [(int) $data->course->id]);
    }

    /**
     * Criterion: the privacy export contains the user's own conversations.
     */
    public function test_privacy_export_contains_the_conversations(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->create_conversation($data);

        // Act.
        $result = $this->call(privacy_export::class, [(int) $data->course->id]);

        // Assert.
        $this->assertNotEmpty($result);
        $this->assertStringContainsString('¿Qué es una cola?', json_encode($result, JSON_UNESCAPED_UNICODE));
    }
}
