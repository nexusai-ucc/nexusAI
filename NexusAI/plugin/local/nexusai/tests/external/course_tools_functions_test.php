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
 * Tests for calendar alerts, forum webhook, chat housekeeping, gaps archive
 * and privacy delete external functions (TPC-05, #577).
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
 * Tests for the course tools external functions.
 *
 * @covers \local_nexusai\external\calendar_alert_save
 * @covers \local_nexusai\external\calendar_alerts_list
 * @covers \local_nexusai\external\calendar_feed_url
 * @covers \local_nexusai\external\calendar_feed_revoke
 * @covers \local_nexusai\external\forum_webhook_save
 * @covers \local_nexusai\external\forum_webhook_get
 * @covers \local_nexusai\external\chat_session_delete
 * @covers \local_nexusai\external\chat_message_feedback
 * @covers \local_nexusai\external\gaps_archive
 * @covers \local_nexusai\external\privacy_delete
 */
final class course_tools_functions_test extends external_testcase {
    /**
     * Criterion: a saved alert appears in the user's alert list, not yet notified.
     */
    public function test_saved_alert_is_listed(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $userid = (int) $data->user->id;

        // Act.
        $saved = $this->call(calendar_alert_save::class, [$userid, $courseid, 42, 'Parcial 1', time() + WEEKSECS, 3]);
        $list = $this->call(calendar_alerts_list::class, [$userid, $courseid]);

        // Assert.
        $this->assertSame(3, $saved['days_before']);
        $this->assertSame(42, $list['alerts'][0]['event_id']);
        $this->assertFalse($list['alerts'][0]['notified']);
    }

    /**
     * Criterion: revoking the calendar feed gives a different URL from before.
     */
    public function test_revoking_the_feed_changes_the_url(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $before = $this->call(calendar_feed_url::class, [$courseid])['url'];

        // Act.
        $after = $this->call(calendar_feed_revoke::class, [$courseid])['url'];

        // Assert.
        $this->assertNotEmpty($before);
        $this->assertNotSame($before, $after);
    }

    /**
     * Criterion: the teacher saves the forum webhook and reads it back; a URL
     * without http(s) is rejected (invalid class).
     */
    public function test_webhook_is_saved_and_read_back(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;

        // Act.
        $this->call(forum_webhook_save::class, [$courseid, 'https://hooks.example.com/nexus']);
        $result = $this->call(forum_webhook_get::class, [$courseid]);

        // Assert.
        $this->assertSame('https://hooks.example.com/nexus', $result['webhook_url']);
        $this->assert_call_fails('errorwebhookurl', forum_webhook_save::class, [$courseid, 'ftp://hooks.example.com']);
    }

    /**
     * Criterion: a student cannot configure the webhook.
     */
    public function test_student_cannot_configure_the_webhook(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act and assert.
        $this->assert_call_fails('nopermissions', forum_webhook_get::class, [(int) $data->course->id]);
    }

    /**
     * Criterion: feedback on an answer is stored, and a deleted conversation
     * disappears from the list.
     */
    public function test_feedback_and_delete_a_conversation(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $session = chat_store::get_or_create_session((int) $data->user->id, $courseid, null);
        chat_store::add_message($session, 'user', '¿Qué es un grafo?');
        $answer = chat_store::add_message($session, 'assistant', 'Un conjunto de nodos y aristas.');

        // Act.
        $feedback = $this->call(chat_message_feedback::class, [$courseid, $answer->uuid, false, '  Le faltó un ejemplo  ']);
        $deleted = $this->call(chat_session_delete::class, [$courseid, $session->uuid]);

        // Assert.
        $this->assertTrue($feedback['ok']);
        $this->assertTrue($deleted['success']);
        $this->assertSame([], chat_store::list_sessions((int) $data->user->id, $courseid, 10));
        $this->assert_call_fails('errorinvalidparams', chat_session_delete::class, [$courseid, 'x']);
    }

    /**
     * Criterion: archiving gaps hides them from the default list; no ids is invalid.
     */
    public function test_archived_gaps_leave_the_list(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        chat_store::record_gap($courseid, (int) $data->user->id, '¿Hay recuperatorio?', ['is_gap' => true]);
        $ids = $this->call(gaps_list::class, [$courseid])['items'][0]['question_ids'];

        // Act.
        $result = $this->call(gaps_archive::class, [$courseid, $ids, true]);

        // Assert.
        $this->assertSame(1, $result['affected']);
        $this->assertSame(0, $this->call(gaps_list::class, [$courseid])['total']);
        $this->assert_call_fails('errorinvalidparams', gaps_archive::class, [$courseid, [], true]);
    }

    /**
     * Criterion: deleting my data removes my conversations of the course.
     */
    public function test_privacy_delete_removes_the_conversations(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $session = chat_store::get_or_create_session((int) $data->user->id, $courseid, null);
        chat_store::add_message($session, 'user', 'Hola');

        // Act.
        $this->call(privacy_delete::class, [$courseid]);

        // Assert.
        $this->assertSame([], chat_store::list_sessions((int) $data->user->id, $courseid, 10));
    }
}
