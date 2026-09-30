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
 * Tests for the student data kept in Moodle (DATA-05, issue #525).
 *
 * Nothing here calls the backend: the chat stream is simulated through the
 * relay, and every other web service now reads and writes Moodle's tables.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\chat_store;
use local_nexusai\local\chat_turn;
use local_nexusai\local\course_analytics;
use local_nexusai\local\data_cleanup;
use local_nexusai\local\flashcard_store;
use local_nexusai\local\privacy_store;
use local_nexusai\local\sse_relay;
use local_nexusai\local\usage_store;

/**
 * Covers the stores, the chat turn and relay, and the web services moved to Moodle.
 *
 * @covers \local_nexusai\local\chat_store
 * @covers \local_nexusai\local\chat_turn
 * @covers \local_nexusai\local\sse_relay
 * @covers \local_nexusai\local\quiz_store
 * @covers \local_nexusai\local\flashcard_store
 * @covers \local_nexusai\local\calendar_store
 * @covers \local_nexusai\local\usage_store
 * @covers \local_nexusai\local\course_analytics
 * @covers \local_nexusai\local\privacy_store
 * @covers \local_nexusai\local\data_cleanup
 */
final class local_data_test extends \advanced_testcase {
    /** @var \stdClass Course. */
    private \stdClass $course;

    /** @var \stdClass Student. */
    private \stdClass $student;

    /** @var \stdClass Teacher. */
    private \stdClass $teacher;

    /**
     * A course with NexusAI on, a student and a teacher.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        set_config('enabled', 1, 'local_nexusai');
        set_config('default_course_enabled', 1, 'local_nexusai');
        $gen = $this->getDataGenerator();
        $this->course = $gen->create_course();
        $this->student = $gen->create_and_enrol($this->course, 'student');
        $this->teacher = $gen->create_and_enrol($this->course, 'editingteacher');
    }

    /**
     * Streams a fake answer through the relay, split at awkward places.
     *
     * @param chat_turn $turn Turn.
     * @param array $done Done event.
     * @return array Events the browser got.
     */
    private function stream(chat_turn $turn, array $done): array {
        $out = '';
        $relay = new sse_relay($turn, function (string $bytes) use (&$out): void {
            $out .= $bytes;
        });
        $events = [
            ['type' => 'meta', 'chunks' => 0, 'sources' => []],
            ['type' => 'token', 'content' => 'Hola '],
            ['type' => 'token', 'content' => 'Bayes'],
            ['type' => 'answer_meta', 'grounded' => false],
            $done,
        ];
        $raw = '';
        foreach ($events as $e) {
            $raw .= 'data: ' . json_encode($e) . "\n\n";
        }
        foreach (str_split($raw, 7) as $piece) {
            $relay->write($piece);
        }
        $this->assertTrue($relay->finished());
        return array_map(
            static fn($line) => json_decode(substr($line, 6), true),
            array_values(array_filter(explode("\n\n", $out)))
        );
    }

    /**
     * A streamed question stores the question, the answer, metrics, gap, usage and budget.
     */
    public function test_streamed_question_is_stored_in_moodle(): void {
        global $DB;
        $this->setUser($this->student);
        $turn = new chat_turn((int) $this->student->id, (int) $this->course->id, '¿Qué es Bayes?', null, false);
        $payload = $turn->payload();
        $this->assertSame([], $payload['history']);
        $this->assertSame(8000, $payload['token_limit_hourly']);
        $this->assertFalse($payload['is_teacher']);

        $events = $this->stream($turn, [
            'type' => 'done',
            'prompt_tokens' => 50,
            'completion_tokens' => 5,
            'total_tokens' => 55,
            'metrics' => ['latency_ms' => 900, 'chunks_retrieved' => 0, 'grounded' => false, 'multicourse' => false,
                'prompt_tokens' => 50, 'completion_tokens' => 5],
            'gap' => ['is_gap' => true, 'max_similarity' => null, 'chunks_retrieved' => 0, 'embedding' => [0.1, 0.2]],
            'budget' => ['hourly' => ['limit' => 8000, 'used' => 55, 'remaining' => 7945, 'resets_in_sec' => 100],
                'daily' => ['limit' => 40000, 'used' => 55, 'remaining' => 39945, 'resets_in_sec' => 1000]],
            'usage' => [['feature' => 'chat.stream', 'kind' => 'llm', 'prompt_tokens' => 50, 'completion_tokens' => 5,
                'model' => 'gemini', 'provider' => 'google', 'cost_usd' => '0.00001']],
        ]);

        $this->assertSame($turn->session->uuid, $events[0]['session_id']);
        $done = end($events);
        $this->assertArrayNotHasKey('usage', $done);
        $this->assertArrayNotHasKey('gap', $done);
        $answer = $DB->get_record('local_nexusai_messages', ['uuid' => $done['assistant_message_id']], '*', MUST_EXIST);
        $this->assertSame('Hola Bayes', $answer->content);
        $this->assertSame(50, (int) $answer->tokensprompt);
        $this->assertSame(2, $DB->count_records('local_nexusai_messages', ['sessionid' => $turn->session->id]));
        $this->assertSame(1, $DB->count_records('local_nexusai_interactions', ['userid' => $this->student->id]));
        $gap = $DB->get_record('local_nexusai_gaps', ['userid' => $this->student->id], '*', MUST_EXIST);
        $this->assertSame([0.1, 0.2], json_decode($gap->embedding, true));
        $usage = $DB->get_record('local_nexusai_usage', ['userid' => $this->student->id], '*', MUST_EXIST);
        $this->assertSame('student', $usage->role);
        $this->assertSame('google', $usage->provider);
        $budget = usage_store::budget((int) $this->student->id, 'student');
        $this->assertSame('backend', $budget['source']);
        $this->assertSame(55, $budget['daily']['used']);

        // The next question carries the history, without itself.
        $next = new chat_turn((int) $this->student->id, (int) $this->course->id, 'Y otra', $turn->session->uuid, false);
        $this->assertSame(
            [['role' => 'user', 'content' => '¿Qué es Bayes?'], ['role' => 'assistant', 'content' => 'Hola Bayes']],
            $next->payload()['history']
        );
    }

    /**
     * Someone else's conversation cannot be continued, read or deleted.
     */
    public function test_conversations_belong_to_their_user(): void {
        $this->setUser($this->student);
        $turn = new chat_turn((int) $this->student->id, (int) $this->course->id, 'mía', null, false);
        $this->setUser($this->teacher);
        $this->expectException(\moodle_exception::class);
        new chat_turn((int) $this->teacher->id, (int) $this->course->id, 'ajena', $turn->session->uuid, false);
    }

    /**
     * The history web services read Moodle: list, messages and delete.
     */
    public function test_history_web_services(): void {
        global $DB;
        $this->setUser($this->student);
        $turn = new chat_turn((int) $this->student->id, (int) $this->course->id, 'Primera pregunta', null, false);
        $turn->finish('Respuesta', [], 'messages', false);

        $list = external\chat_sessions_list::execute((int) $this->course->id);
        $this->assertCount(1, $list['sessions']);
        $this->assertSame('Primera pregunta', $list['sessions'][0]['last_message_preview']);
        $this->assertSame(2, $list['sessions'][0]['message_count']);

        $messages = external\chat_session_messages::execute((int) $this->course->id, $turn->session->uuid);
        $this->assertSame(['user', 'assistant'], array_column($messages['messages'], 'role'));

        $vote = external\chat_message_feedback::execute((int) $this->course->id, $messages['messages'][1]['id'], false, 'mal');
        $this->assertTrue($vote['ok']);
        external\chat_message_feedback::execute((int) $this->course->id, $messages['messages'][1]['id'], true);
        $this->assertSame(1, $DB->count_records('local_nexusai_msg_feedback', ['userid' => $this->student->id, 'ishelpful' => 1]));

        external\chat_session_delete::execute((int) $this->course->id, $turn->session->uuid);
        $this->assertSame(0, $DB->count_records('local_nexusai_messages'));
    }

    /**
     * Quiz errors, attempts, difficulty, streak and study plan dismissal work without the backend.
     */
    public function test_quiz_web_services(): void {
        global $DB;
        $this->setUser($this->student);
        $cid = (int) $this->course->id;
        $stored = external\quiz_errors_record::execute($cid, [[
            'question_type' => 'multiple_choice', 'question' => '¿2+2?', 'explanation' => '4',
            'options' => ['3', '4'], 'correct_index' => 1, 'user_selected_index' => 0,
        ]]);
        $this->assertSame(1, $stored['stored']);
        $list = external\quiz_errors_list::execute($cid);
        $this->assertSame(1, $list['total']);
        $this->assertSame(['3', '4'], $list['items'][0]['options']);

        $attempt = external\quiz_attempt_save::execute($cid, 'multiple_choice', 'medium', 'sumas', 5, 4);
        $this->assertSame(0.8, $attempt['score']);
        $this->assertSame(1, external\quiz_attempt_list::execute($cid)['total']);
        $this->assertSame('hard', external\quiz_suggest_difficulty::execute($cid, 'SUMAS')['difficulty']);
        $streak = external\quiz_streak::execute($cid);
        $this->assertSame(1, $streak['currentstreak']);
        $this->assertTrue($streak['practicedtoday']);

        $dismiss = external\quiz_study_plan_dismiss::execute($cid, [$list['items'][0]['id']], []);
        $this->assertSame(1, $dismiss['affected']);
        $this->assertSame(0, count(local\quiz_store::errors_for_backend($cid, (int) $this->student->id, 30, true)));

        $this->assertSame(1, external\quiz_errors_clear::execute($cid)['deleted']);
        $this->assertSame(0, $DB->count_records('local_nexusai_quiz_errors'));
    }

    /**
     * Generated flashcards are stored once; hidden material is not reviewed; SM-2 schedules them.
     */
    public function test_flashcards(): void {
        $this->setUser($this->student);
        $cid = (int) $this->course->id;
        $cards = flashcard_store::save_generated($cid, 'Bayes', [
            ['question' => 'P(A|B)', 'explanation' => 'condicional', 'source_cmid' => 11],
            ['question' => 'Prior', 'explanation' => 'previa', 'source_cmid' => 12],
        ]);
        $again = flashcard_store::save_generated($cid, 'Bayes', [['question' => 'P(A|B)', 'explanation' => 'condicional']]);
        $this->assertSame($cards[0]['id'], $again[0]['id']);

        $summary = flashcard_store::summary($cid, (int) $this->student->id, null, null);
        $this->assertSame(['due_count' => 2, 'total_count' => 2], $summary);
        $visible = flashcard_store::due($cid, (int) $this->student->id, 'bayes', 10, [11]);
        $this->assertSame(['P(A|B)'], array_column($visible, 'question'));

        $updated = external\quiz_flashcards_review_batch::execute($cid, [['flashcardid' => $cards[0]['id'], 'knewit' => true]]);
        $this->assertSame(1, $updated['updated']);
        $this->assertSame(1, flashcard_store::summary($cid, (int) $this->student->id, null, null)['due_count']);
    }

    /**
     * Calendar reminders always belong to the logged-in user, whatever userid the browser sends.
     */
    public function test_calendar_reminders_ignore_the_userid_parameter(): void {
        global $DB;
        $this->setUser($this->student);
        $cid = (int) $this->course->id;
        $saved = external\calendar_alert_save::execute((int) $this->teacher->id, $cid, 55, 'Parcial', time() + DAYSECS, 2);
        $this->assertNotNull($saved['id']);
        $this->assertSame((int) $this->student->id, (int) $DB->get_field('local_nexusai_cal_alerts', 'userid', ['eventid' => 55]));
        $this->assertCount(1, external\calendar_alerts_list::execute((int) $this->teacher->id, $cid)['alerts']);
        $this->assertCount(1, local\calendar_store::due(time()));

        external\calendar_alert_save::execute(0, $cid, 55, 'Parcial', time() + DAYSECS, 0);
        $this->assertSame(0, $DB->count_records('local_nexusai_cal_alerts'));
    }

    /**
     * The teacher's dashboard, gaps and forum webhook come from Moodle.
     */
    public function test_teacher_web_services(): void {
        $this->setUser($this->student);
        foreach (['¿Qué es Bayes?', ' ¿qué es bayes? ', 'Parcial'] as $q) {
            $turn = new chat_turn((int) $this->student->id, (int) $this->course->id, $q, null, false);
            $turn->finish('r', ['metrics' => ['latency_ms' => 1], 'gap' => ['is_gap' => true]], 'stream', false);
        }
        external\quiz_attempt_save::execute((int) $this->course->id, 'multiple_choice', 'easy', '', 5, 5);

        $this->setUser($this->teacher);
        $cid = (int) $this->course->id;
        $dashboard = external\analytics_dashboard::execute($cid);
        $this->assertSame(['question' => '¿qué es bayes?', 'count' => 2], $dashboard['top_queries'][0]);
        $this->assertSame(2, $dashboard['topics_consulted']);
        $this->assertSame(1, $dashboard['quiz_score_distribution']['buckets'][4]['count']);
        $this->assertSame(3, $dashboard['gaps_ratio']['gaps_detected']);
        $this->assertSame(1, $dashboard['daily_message_counts'][0]['message_count'] > 0 ? 1 : 0);

        $gaps = external\gaps_list::execute($cid);
        $this->assertSame(2, $gaps['total']);
        $archived = external\gaps_archive::execute($cid, $gaps['items'][0]['question_ids'], true);
        $this->assertSame(2, $archived['affected']);
        $this->assertSame(1, external\gaps_list::execute($cid)['total']);

        $saved = external\forum_webhook_save::execute($cid, 'https://hooks.test/x');
        $this->assertSame('https://hooks.test/x', $saved['webhook_url']);
        $this->assertSame('https://hooks.test/x', external\forum_webhook_get::execute($cid)['webhook_url']);
        $this->expectException(\invalid_parameter_exception::class);
        external\forum_webhook_save::execute($cid, 'ftp://nope');
    }

    /**
     * Without a value from the backend, the budget is estimated from stored chat usage.
     */
    public function test_budget_estimate_and_web_service(): void {
        $this->setUser($this->student);
        usage_store::record_calls((int) $this->student->id, (int) $this->course->id, 'student', [
            ['feature' => 'chat.stream', 'prompt_tokens' => 3000, 'completion_tokens' => 1000],
            ['feature' => 'quiz.generate', 'prompt_tokens' => 9999],
        ], 'req-1');
        $budget = usage_store::budget((int) $this->student->id, 'student');
        $this->assertSame('estimate', $budget['source']);
        $this->assertSame(4000, $budget['hourly']['used']);
        $this->assertSame(50, $budget['hourly']['percent_used']);

        set_config('token_limit_student_daily', 8000, 'local_nexusai');
        $status = external\budget_status::execute((int) $this->course->id);
        $this->assertSame('student', $status['role']);
        $this->assertSame(8000, $status['daily']['limit']);
        $this->assertSame(1, $status['daily']['questionsleft']);
    }

    /**
     * The student's own export and deletion.
     */
    public function test_self_service_privacy(): void {
        global $DB;
        $this->setUser($this->student);
        $cid = (int) $this->course->id;
        $turn = new chat_turn((int) $this->student->id, $cid, 'hola', null, false);
        $turn->finish('chau', [], 'messages', false);
        external\quiz_attempt_save::execute($cid, 'multiple_choice', 'easy', '', 2, 1);

        $export = privacy_store::export((int) $this->student->id, $cid);
        $this->assertSame(['hola', 'chau'], array_column($export['messages'], 'content'));
        $this->assertCount(1, $export['quiz_attempts']);

        $deleted = privacy_store::delete((int) $this->student->id, $cid);
        $this->assertSame(2, $deleted['messages_deleted']);
        $this->assertSame(1, $deleted['quiz_attempts_anonymized']);
        $this->assertSame(1, $DB->count_records('local_nexusai_quiz_attempts', ['userid' => null]));
    }

    /**
     * Deleting a user or a course removes their NexusAI rows.
     */
    public function test_cleanup_after_user_and_course_deletion(): void {
        global $DB;
        set_config('enabled', 0, 'local_nexusai');
        $this->setUser($this->student);
        $turn = new chat_turn((int) $this->student->id, (int) $this->course->id, 'hola', null, false);
        $turn->finish('chau', [], 'messages', false);
        flashcard_store::save_generated((int) $this->course->id, null, [['question' => 'q', 'explanation' => 'e']]);

        data_cleanup::delete_user((int) $this->student->id);
        $this->assertSame(0, $DB->count_records('local_nexusai_chat_sessions'));

        data_cleanup::delete_course((int) $this->course->id);
        $this->assertSame(0, $DB->count_records('local_nexusai_flashcards'));
        $this->assertSame(0, $DB->count_records('local_nexusai_course'));
    }
}
