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
 * Tests for the non-streaming chat, document replacement and the calendar
 * alerts task (TPC-05, #577).
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
 * Tests for chat_send, document_replace and task\send_calendar_alerts.
 *
 * @covers \local_nexusai\external\chat_send
 * @covers \local_nexusai\external\document_replace
 * @covers \local_nexusai\task\send_calendar_alerts
 */
final class chat_and_replace_test extends external_testcase {
    /**
     * Criterion: a question gets the backend's answer and both turns are kept
     * in a new conversation stored in Moodle.
     */
    public function test_chat_send_stores_the_conversation(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend(['answer' => 'Una pila es una estructura LIFO.', 'sources' => []]);

        // Act.
        $result = $this->call(chat_send::class, ['¿Qué es una pila?', (int) $data->course->id]);

        // Assert.
        $this->assertSame('Una pila es una estructura LIFO.', $result['answer']);
        $this->assertSame(['user', 'assistant'], array_column($result['messages'], 'role'));
        $this->assertNotEmpty($result['session_id']);
    }

    /**
     * Criterion (equivalence classes of the question and session id): blank,
     * longer than 2000 characters and a malformed session id are rejected; an
     * answer without text is a backend error.
     */
    public function test_chat_send_rejects_invalid_input(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $this->mock_backend(['sources' => []]);

        // Act and assert.
        $this->assert_call_fails('errorquestionempty', chat_send::class, ['  ', $courseid]);
        $this->assert_call_fails('errorquestiontoolong', chat_send::class, [str_repeat('a', 2001), $courseid]);
        $this->assert_call_fails('errorinvalidparams', chat_send::class, ['Hola', $courseid, 0, 'corto']);
        $this->assert_call_fails('errorbackend', chat_send::class, ['Hola', $courseid]);
    }

    /**
     * Criterion: a document of the course without an activity is replaced and
     * the backend's new state returned.
     */
    public function test_replace_a_document(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $this->mock_backend(
            ['id' => 'doc-7', 'course_id' => $courseid],
            [
                'id' => 'doc-7',
                'course_id' => $courseid,
                'uploader_id' => (int) $data->user->id,
                'filename' => 'u7-v2.pdf',
                'mime_type' => 'application/pdf',
                'status' => 'pending',
            ]
        );

        // Act.
        $result = $this->call(document_replace::class, [
            $courseid, 'doc-7', 'u7-v2.pdf', 'application/pdf', base64_encode('%PDF-1.7 v2'),
        ]);

        // Assert.
        $this->assertSame('u7-v2.pdf', $result['filename']);
        $this->assertNull($result['section']);
    }

    /**
     * Criterion: the replacement is refused for another course's document, a
     * wrong file type or content that does not match it.
     */
    public function test_replace_rejects_invalid_requests(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $this->mock_backend(['id' => 'doc-8', 'course_id' => 999999]);

        // Act and assert.
        $this->assert_call_fails('errorbackend', document_replace::class, [
            $courseid, 'doc-8', 'a.pdf', 'application/pdf', base64_encode('%PDF-1.7'),
        ]);
        $this->assert_call_fails('errorunsupportedfiletype', document_replace::class, [
            $courseid, 'doc-8', 'a.exe', 'application/x-msdownload', base64_encode('MZ'),
        ]);
        $this->assert_call_fails('errorfilecontent', document_replace::class, [
            $courseid, 'doc-8', 'a.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            base64_encode('no es zip'),
        ]);
    }

    /**
     * Criterion: the alerts task notifies a due alert once and marks it as sent.
     */
    public function test_alerts_task_notifies_due_alerts_once(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        \local_nexusai\local\calendar_store::save((int) $data->user->id, $courseid, 77, 'Parcial 2', time() + DAYSECS, 3);
        $sink = $this->redirectMessages();
        $task = new \local_nexusai\task\send_calendar_alerts();

        // Act.
        $task->execute();
        $task->execute();

        // Assert.
        $this->assertSame(1, $sink->count());
        $this->assertStringContainsString('Parcial 2', $sink->get_messages()[0]->subject);
        $sink->close();
    }

    /**
     * Criterion: with NexusAI off for the course, no alert is sent.
     */
    public function test_alerts_task_skips_a_course_that_is_off(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        \local_nexusai\local\calendar_store::save((int) $data->user->id, $courseid, 78, 'Final', time() + DAYSECS, 7);
        $this->disable_course($courseid);
        $sink = $this->redirectMessages();

        // Act.
        (new \local_nexusai\task\send_calendar_alerts())->execute();

        // Assert.
        $this->assertSame(0, $sink->count());
        $sink->close();
    }
}
