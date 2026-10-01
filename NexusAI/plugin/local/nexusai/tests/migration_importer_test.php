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
 * Tests for the migration of the backend data into Moodle (DATA-06, issue #526).
 *
 * The backend export is simulated with arrays shaped like its JSON, paged the
 * same way, and its summary is computed the way its SQL does.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\migration_importer;

/**
 * Covers the import, the resume after a failure and the verification.
 *
 * @covers \local_nexusai\local\migration_importer
 */
final class migration_importer_test extends \advanced_testcase {
    /** @var \stdClass Course. */
    private \stdClass $course;

    /** @var \stdClass Student. */
    private \stdClass $student;

    /** @var int Course module of a document. */
    private int $cmid;

    /**
     * A course with a student and a resource.
     */
    protected function setUp(): void {
        parent::setUp();
        $this->resetAfterTest();
        $this->setAdminUser();
        $gen = $this->getDataGenerator();
        $this->course = $gen->create_course();
        $this->student = $gen->create_and_enrol($this->course, 'student');
        $this->cmid = (int) $gen->create_module('resource', ['course' => $this->course->id])->cmid;
    }

    /**
     * A backend id.
     *
     * @param int $n Number.
     * @return string
     */
    private static function id(int $n): string {
        return sprintf('00000000-0000-4000-8000-%012d', $n);
    }

    /**
     * Backend data: one row or more in every table, linked like in the backend.
     *
     * @param int $userid Student.
     * @param int $courseid Course.
     * @param int $base Added to every backend id, to build a second set.
     * @return array table => rows.
     */
    private function backend_data(int $userid, int $courseid, int $base = 0): array {
        $hash = hash('sha256', (string) $userid);
        return [
            'chat_sessions' => [
                ['id' => self::id($base + 1), 'user_id' => $userid, 'course_id' => $courseid,
                    'created_at' => '2026-08-31T23:59:00+00:00', 'updated_at' => '2026-09-01T10:00:00+00:00'],
            ],
            'messages' => [
                ['id' => self::id($base + 11), 'session_id' => self::id($base + 1), 'role' => 'user',
                    'content' => '¿Qué es un grafo?', 'token_count_prompt' => null, 'token_count_completion' => null,
                    'created_at' => '2026-08-31T23:59:30.123456+00:00'],
                ['id' => self::id($base + 12), 'session_id' => self::id($base + 1), 'role' => 'assistant',
                    'content' => 'Un conjunto de nodos.', 'token_count_prompt' => 900, 'token_count_completion' => 120,
                    'created_at' => '2026-09-01T00:00:05+00:00'],
            ],
            'interaction_logs' => [
                ['id' => self::id($base + 21), 'course_id' => $courseid, 'user_id_hash' => $hash,
                    'user_message_id' => self::id($base + 11), 'question_char_count' => 17, 'answer_char_count' => 21,
                    'chunks_retrieved' => 4,
                    'has_relevant_context' => true, 'is_multicourse' => false, 'prompt_tokens' => 900,
                    'completion_tokens' => 120, 'latency_ms' => 812.5, 'endpoint' => 'stream',
                    'created_at' => '2026-09-01T00:00:05+00:00'],
            ],
            'message_feedback' => [
                ['id' => self::id($base + 31), 'message_id' => self::id($base + 12), 'course_id' => $courseid, 'is_helpful' => true,
                    'comment' => null, 'user_id_hash' => $hash, 'created_at' => '2026-09-01T00:01:00+00:00',
                    'updated_at' => '2026-09-01T00:01:00+00:00'],
            ],
            'unanswered_questions' => [
                ['id' => self::id($base + 41), 'course_id' => $courseid, 'user_id' => $userid, 'question' => '¿Y los árboles B?',
                    'max_similarity' => 0.31, 'chunks_retrieved' => 2, 'embedding' => [0.5, 0.25],
                    'created_at' => '2026-09-02T12:00:00+00:00', 'archived_at' => null, 'student_dismissed_at' => null],
            ],
            'quiz_attempts' => [
                ['id' => self::id($base + 51), 'course_id' => $courseid, 'user_id' => $userid, 'question_type' => 'multiple_choice',
                    'difficulty' => 'hard', 'topic' => 'Grafos', 'total_questions' => 5, 'correct_answers' => 3,
                    'score' => 60.0, 'created_at' => '2026-09-03T12:00:00+00:00', 'deleted_at' => null],
            ],
            'quiz_errors' => [
                ['id' => self::id($base + 61), 'course_id' => $courseid, 'user_id' => $userid, 'question_type' => 'multiple_choice',
                    'question' => '¿Cuántas aristas?', 'explanation' => 'n-1', 'source_filename' => 'grafos.pdf',
                    'source_document_id' => self::id($base + 99), 'options' => ['n', 'n-1'], 'correct_index' => 1,
                    'user_selected_index' => 0, 'user_answer' => null, 'ai_feedback' => null, 'ai_score' => null,
                    'created_at' => '2026-09-03T12:00:00+00:00', 'dismissed_at' => null],
            ],
            'flashcards' => [
                ['id' => self::id($base + 71), 'course_id' => $courseid, 'topic' => 'Grafos', 'content_hash' => str_repeat('a', 64),
                    'question' => 'Q1', 'explanation' => 'E1', 'source_filename' => 'grafos.pdf',
                    'source_document_id' => self::id($base + 99), 'source_cmid' => $this->cmid,
                    'created_at' => '2026-09-03T12:00:00+00:00'],
                ['id' => self::id($base + 72), 'course_id' => $courseid, 'topic' => null, 'content_hash' => str_repeat('b', 64),
                    'question' => 'Q2', 'explanation' => 'E2', 'source_filename' => null, 'source_document_id' => null,
                    'source_cmid' => 999999, 'created_at' => '2026-09-03T12:00:01+00:00'],
            ],
            'flashcard_reviews' => [
                ['id' => self::id($base + 81), 'flashcard_id' => self::id($base + 71), 'user_id' => $userid, 'ease_factor' => 2.6,
                    'interval_days' => 6, 'repetitions' => 2, 'last_reviewed_at' => '2026-09-04T12:00:00+00:00',
                    'next_review_at' => '2026-09-10T12:00:00+00:00', 'deleted_at' => null,
                    'created_at' => '2026-09-03T12:00:00+00:00', 'updated_at' => '2026-09-04T12:00:00+00:00'],
            ],
            'calendar_alerts' => [
                ['id' => self::id($base + 91), 'user_id' => $userid, 'course_id' => $courseid, 'event_id' => 77,
                    'event_name' => 'Parcial', 'event_timestamp' => 1790000000, 'days_before' => 2, 'notified' => false,
                    'created_at' => '2026-09-05T12:00:00+00:00'],
            ],
            'forum_webhook_configs' => [
                ['id' => self::id($base + 95), 'course_id' => $courseid, 'webhook_url' => 'https://example.com/hook',
                    'created_at' => '2026-09-05T12:00:00+00:00', 'updated_at' => '2026-09-05T12:00:00+00:00'],
            ],
        ];
    }

    /**
     * A page source over the data, like GET /migration/export.
     *
     * @param array $data table => rows.
     * @param int|null $failat Throw when asked for this page number (counting every call).
     * @return callable
     */
    private static function source(array $data, ?int $failat = null): callable {
        $calls = 0;
        return static function (string $table, ?string $after, int $limit) use ($data, $failat, &$calls): array {
            $calls++;
            if ($failat !== null && $calls === $failat) {
                throw new \moodle_exception('errorbackendunreachable', 'local_nexusai', '', 'test');
            }
            $offset = (int) $after;
            $rows = array_slice($data[$table] ?? [], $offset, $limit);
            $next = $offset + $limit < count($data[$table] ?? []) ? (string) ($offset + $limit) : null;
            return ['table' => $table, 'rows' => $rows, 'next' => $next];
        };
    }

    /**
     * The backend summary of the data, the way its SQL computes it.
     *
     * @param array $data table => rows.
     * @return array
     */
    private static function summary(array $data): array {
        $counts = array_map('count', $data);
        $courses = array_column($data['chat_sessions'], 'course_id', 'id');
        $group = static function (array $rows, callable $course, string $prompt, string $completion, string $label): array {
            $sums = [];
            foreach ($rows as $row) {
                $key = $course($row) . '|' . gmdate('Y-m', migration_importer::time($row['created_at']));
                $sums[$key] = $sums[$key] ?? [0, 0, 0];
                $sums[$key][0]++;
                $sums[$key][1] += (int) $row[$prompt];
                $sums[$key][2] += (int) $row[$completion];
            }
            $out = [];
            foreach ($sums as $key => [$n, $p, $c]) {
                [$courseid, $month] = explode('|', $key);
                $out[] = ['course_id' => (int) $courseid, 'month' => $month, $label => $n,
                    'prompt_tokens' => $p, 'completion_tokens' => $c];
            }
            return $out;
        };
        return [
            'counts' => $counts,
            'message_tokens' => $group($data['messages'], static function (array $row) use ($courses) {
                return $courses[$row['session_id']];
            }, 'token_count_prompt', 'token_count_completion', 'messages'),
            'interaction_tokens' => $group($data['interaction_logs'], static function (array $row) {
                return $row['course_id'];
            }, 'prompt_tokens', 'completion_tokens', 'interactions'),
        ];
    }

    /**
     * Every table arrives with its relations, dates and users, and the summaries match.
     */
    public function test_imports_every_table_with_its_relations(): void {
        global $DB;
        $data = $this->backend_data((int) $this->student->id, (int) $this->course->id);
        $state = (new migration_importer(self::source($data)))->run(1);

        foreach (migration_importer::TABLES as $table => $local) {
            $this->assertTrue($state['tables'][$table]['done'], $table);
            $this->assertEquals(count($data[$table]), $DB->count_records($local), $table);
        }

        $session = $DB->get_record('local_nexusai_chat_sessions', ['uuid' => self::id(1)]);
        $this->assertEquals($this->student->id, $session->userid);
        $this->assertEquals(strtotime('2026-08-31T23:59:00Z'), $session->timecreated);
        $answer = $DB->get_record('local_nexusai_messages', ['uuid' => self::id(12)]);
        $this->assertEquals($session->id, $answer->sessionid);
        $this->assertEquals(900, $answer->tokensprompt);

        $question = $DB->get_record('local_nexusai_messages', ['uuid' => self::id(11)]);
        $interaction = $DB->get_record('local_nexusai_interactions', []);
        $this->assertEquals($question->id, $interaction->messageid);
        $this->assertEquals($this->student->id, $interaction->userid);
        $this->assertEquals(1, $interaction->hascontext);

        $vote = $DB->get_record('local_nexusai_msg_feedback', []);
        $this->assertEquals($answer->id, $vote->messageid);
        $this->assertEquals($this->student->id, $vote->userid);

        $gap = $DB->get_record('local_nexusai_gaps', ['uuid' => self::id(41)]);
        $this->assertEquals(sha1(\core_text::strtolower('¿Y los árboles B?')), $gap->questionhash);
        $this->assertEquals([0.5, 0.25], json_decode($gap->embedding, true));

        $error = $DB->get_record('local_nexusai_quiz_errors', ['uuid' => self::id(61)]);
        $this->assertEquals(['n', 'n-1'], json_decode($error->options, true));

        $this->assertEquals($this->cmid, $DB->get_field('local_nexusai_flashcards', 'sourcecmid', ['uuid' => self::id(71)]));
        $this->assertNull($DB->get_field('local_nexusai_flashcards', 'sourcecmid', ['uuid' => self::id(72)]));
        $card = $DB->get_field('local_nexusai_flashcards', 'id', ['uuid' => self::id(71)]);
        $this->assertEquals($card, $DB->get_field('local_nexusai_fc_reviews', 'flashcardid', []));

        $differences = migration_importer::compare(
            self::summary($data),
            migration_importer::local_summary(),
            migration_importer::state()
        );
        $this->assertSame([], $differences);
    }

    /**
     * Rows of a deleted user or course are skipped, and the verification counts them.
     */
    public function test_skips_rows_of_users_and_courses_that_are_gone(): void {
        global $DB;
        $data = $this->backend_data((int) $this->student->id, (int) $this->course->id);
        $gone = $this->backend_data(888888, 777777, 1000);
        foreach ($data as $table => $rows) {
            $data[$table] = array_merge($rows, $gone[$table]);
        }

        $state = (new migration_importer(self::source($data)))->run(500);

        $this->assertEquals(['nouser' => 1], $state['tables']['chat_sessions']['skipped']);
        $this->assertEquals(['nosession' => 2], $state['tables']['messages']['skipped']);
        $this->assertEquals(['nocourse' => 1], $state['tables']['interaction_logs']['skipped']);
        $this->assertEquals(['nocourse' => 2], $state['tables']['flashcards']['skipped']);
        $this->assertEquals(['noflashcard' => 1], $state['tables']['flashcard_reviews']['skipped']);
        $this->assertEquals(1, $DB->count_records('local_nexusai_chat_sessions'));

        $differences = migration_importer::compare(
            self::summary($data),
            migration_importer::local_summary(),
            migration_importer::state()
        );
        $this->assertSame([], $differences);
    }

    /**
     * A run that fails half way resumes where it stopped, without repeating rows.
     */
    public function test_resumes_after_a_failure_without_duplicates(): void {
        global $DB;
        $data = $this->backend_data((int) $this->student->id, (int) $this->course->id);

        try {
            (new migration_importer(self::source($data, 3)))->run(1);
            $this->fail('The source should have failed');
        } catch (\moodle_exception $e) {
            $this->assertStringContainsString('test', $e->getMessage());
        }
        $state = migration_importer::state();
        $this->assertTrue($state['tables']['chat_sessions']['done']);
        $this->assertFalse($state['tables']['messages']['done']);
        $this->assertEquals(1, $DB->count_records('local_nexusai_messages'));

        $state = (new migration_importer(self::source($data)))->run(1);
        $this->assertEquals(2, $DB->count_records('local_nexusai_messages'));
        $this->assertEquals(1, $DB->count_records('local_nexusai_interactions'));
        $this->assertEquals(0, $state['tables']['messages']['existing']);

        // Running again from scratch finds every row already there.
        migration_importer::reset();
        $state = (new migration_importer(self::source($data)))->run(500);
        $this->assertEquals(2, $state['tables']['messages']['existing']);
        $this->assertEquals(2, $DB->count_records('local_nexusai_messages'));
        // Interactions and votes have no uuid and are recognised all the same.
        $this->assertEquals(1, $state['tables']['interaction_logs']['existing']);
        $this->assertEquals(1, $state['tables']['message_feedback']['existing']);
        $this->assertEquals(1, $DB->count_records('local_nexusai_interactions'));
        $this->assertEquals(1, $DB->count_records('local_nexusai_msg_feedback'));
    }

    /**
     * The verification reports a missing row and a token difference.
     */
    public function test_compare_reports_differences(): void {
        $data = $this->backend_data((int) $this->student->id, (int) $this->course->id);
        (new migration_importer(self::source($data)))->run(500);
        $summary = self::summary($data);
        $summary['counts']['quiz_attempts']++;
        $summary['message_tokens'][1]['prompt_tokens'] += 5;

        $differences = migration_importer::compare(
            $summary,
            migration_importer::local_summary(),
            migration_importer::state()
        );

        $this->assertCount(2, $differences);
        $this->assertStringContainsString('quiz_attempts: expected 2', $differences[0]);
        $this->assertStringContainsString('2026-09', $differences[1]);
    }

    /**
     * Backend dates become Unix times in UTC, with or without zone.
     */
    public function test_time_reads_backend_dates_as_utc(): void {
        $this->assertEquals(1788220800, migration_importer::time('2026-09-01T00:00:00+00:00'));
        $this->assertEquals(1788220800, migration_importer::time('2026-09-01T00:00:00'));
        $this->assertEquals(1788220800, migration_importer::time('2026-08-31T21:00:00.5-03:00'));
    }
}
