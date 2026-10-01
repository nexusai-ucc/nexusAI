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
 * Brings the student data the backend kept into the plugin's tables (DATA-06).
 *
 * Reads the backend's temporary export (one table at a time, in creation order,
 * paged by cursor) and writes each row in its local_nexusai_* table, keeping the
 * backend id in the uuid column and rebuilding the relations (session and
 * messages, message and vote, flashcard and reviews) from it.
 *
 * Each page is written in one transaction together with the cursor of the next
 * one, so an interrupted run resumes where it stopped. Rows whose user or course
 * no longer exist in Moodle are skipped and counted, so the verification can
 * still check that nothing was lost.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Imports and verifies the backend data.
 */
class migration_importer {
    /** Backend table => local table, in the order they have to be imported. */
    public const TABLES = [
        'chat_sessions' => 'local_nexusai_chat_sessions',
        'messages' => 'local_nexusai_messages',
        'interaction_logs' => 'local_nexusai_interactions',
        'message_feedback' => 'local_nexusai_msg_feedback',
        'unanswered_questions' => 'local_nexusai_gaps',
        'quiz_attempts' => 'local_nexusai_quiz_attempts',
        'quiz_errors' => 'local_nexusai_quiz_errors',
        'flashcards' => 'local_nexusai_flashcards',
        'flashcard_reviews' => 'local_nexusai_fc_reviews',
        'calendar_alerts' => 'local_nexusai_cal_alerts',
        'forum_webhook_configs' => 'local_nexusai_forum_webhooks',
    ];

    /** Config key that keeps the progress between runs. */
    private const STATE = 'migration_state';

    /** @var callable Returns a page: fn(string $table, ?string $after, int $limit): array. */
    private $page;

    /** @var callable Receives progress lines. */
    private $log;

    /** @var array Progress: per table cursor and counters, plus what was skipped. */
    private array $state;

    /** @var array<string,int>|null sha256 of a user id => user id, built on first use. */
    private ?array $userhashes = null;

    /**
     * Constructor.
     *
     * @param callable $page Fetches a page of a backend table.
     * @param callable|null $log Receives progress lines.
     */
    public function __construct(callable $page, ?callable $log = null) {
        $this->page = $page;
        $this->log = $log ?? static function (string $line): void {
        };
        $this->state = self::state();
    }

    /**
     * Saved progress of the migration.
     *
     * @return array
     */
    public static function state(): array {
        $state = json_decode((string) get_config('local_nexusai', self::STATE), true);
        $state = is_array($state) ? $state : [];
        $state += ['tables' => [], 'skippedsessions' => [], 'skippedtokens' => []];
        $state['skippedtokens'] += ['messages' => [], 'interaction_logs' => []];
        foreach (array_keys(self::TABLES) as $table) {
            $state['tables'][$table] = ($state['tables'][$table] ?? []) + [
                'cursor' => null,
                'done' => false,
                'read' => 0,
                'imported' => 0,
                'existing' => 0,
                'skipped' => [],
                'seconds' => 0.0,
            ];
        }
        return $state;
    }

    /**
     * Forgets the progress, to start over.
     */
    public static function reset(): void {
        unset_config(self::STATE, 'local_nexusai');
    }

    /**
     * Whether the run has not started and some local table already has rows.
     *
     * @return string[] Local tables with rows.
     */
    public static function non_empty_tables(): array {
        global $DB;
        $tables = [];
        foreach (self::TABLES as $local) {
            if ($DB->record_exists($local, [])) {
                $tables[] = $local;
            }
        }
        return $tables;
    }

    /**
     * Imports every table that is not finished yet.
     *
     * @param int $limit Rows per page.
     * @return array The progress after the run.
     */
    public function run(int $limit = 500): array {
        foreach (array_keys(self::TABLES) as $table) {
            if ($this->state['tables'][$table]['done']) {
                ($this->log)("{$table}: already imported");
                continue;
            }
            $this->import_table($table, $limit);
        }
        return $this->state;
    }

    /**
     * Imports one table page by page.
     *
     * @param string $table Backend table.
     * @param int $limit Rows per page.
     */
    private function import_table(string $table, int $limit): void {
        global $DB;
        $progress = &$this->state['tables'][$table];
        do {
            $start = microtime(true);
            $page = ($this->page)($table, $progress['cursor'], $limit);
            $rows = $page['rows'] ?? [];
            $transaction = $DB->start_delegated_transaction();
            $method = 'import_' . $table;
            foreach ($this->$method($rows) as $outcome) {
                if ($outcome === 'imported' || $outcome === 'existing') {
                    $progress[$outcome]++;
                } else {
                    $progress['skipped'][$outcome] = ($progress['skipped'][$outcome] ?? 0) + 1;
                }
            }
            $progress['read'] += count($rows);
            $progress['cursor'] = $page['next'] ?? null;
            $progress['done'] = $progress['cursor'] === null;
            $progress['seconds'] = round($progress['seconds'] + microtime(true) - $start, 2);
            set_config(self::STATE, json_encode($this->state), 'local_nexusai');
            $transaction->allow_commit();
            ($this->log)(sprintf(
                '%s: %d read, %d imported, %d already there, %d skipped (%.1f s)',
                $table,
                $progress['read'],
                $progress['imported'],
                $progress['existing'],
                array_sum($progress['skipped']),
                $progress['seconds']
            ));
        } while (!$progress['done']);
        unset($progress);
    }

    /**
     * Imports chat sessions.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_chat_sessions(array $rows): array {
        global $DB;
        $existing = $this->existing_uuids('local_nexusai_chat_sessions', $rows);
        $users = $this->existing_ids('user', array_column($rows, 'user_id'), 'deleted = 0');
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $outcomes = [];
        foreach ($rows as $row) {
            $skip = $this->missing($row, $users, $courses);
            if ($skip) {
                $this->state['skippedsessions'][$row['id']] = (int) $row['course_id'];
                $outcomes[] = $skip;
            } else if (isset($existing[$row['id']])) {
                $outcomes[] = 'existing';
            } else {
                $DB->insert_record('local_nexusai_chat_sessions', (object) [
                    'uuid' => $row['id'],
                    'userid' => (int) $row['user_id'],
                    'courseid' => (int) $row['course_id'],
                    'multicourse' => 0,
                    'courseids' => null,
                    'timecreated' => self::time($row['created_at']),
                    'timemodified' => self::time($row['updated_at'] ?? $row['created_at']),
                ]);
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Imports chat messages; a message without its session is skipped.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_messages(array $rows): array {
        global $DB;
        $existing = $this->existing_uuids('local_nexusai_messages', $rows);
        $sessions = $this->ids_by_uuid('local_nexusai_chat_sessions', array_column($rows, 'session_id'));
        $outcomes = [];
        foreach ($rows as $row) {
            if (!isset($sessions[$row['session_id']])) {
                $courseid = $this->state['skippedsessions'][$row['session_id']] ?? 0;
                $this->skip_tokens('messages', $courseid, $row, 'token_count_prompt', 'token_count_completion');
                $outcomes[] = 'nosession';
            } else if (isset($existing[$row['id']])) {
                $outcomes[] = 'existing';
            } else {
                $DB->insert_record('local_nexusai_messages', (object) [
                    'uuid' => $row['id'],
                    'sessionid' => $sessions[$row['session_id']],
                    'role' => (string) $row['role'],
                    'content' => (string) $row['content'],
                    'tokensprompt' => self::int_or_null($row['token_count_prompt'] ?? null),
                    'tokenscompletion' => self::int_or_null($row['token_count_completion'] ?? null),
                    'cachekey' => null,
                    'timecreated' => self::time($row['created_at']),
                ]);
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Imports interaction metrics. The backend only kept a hash of the user: the
     * user comes from the question's conversation or from the hash.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_interaction_logs(array $rows): array {
        global $DB;
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $messages = $this->messages_with_user(array_column($rows, 'user_message_id'));
        $records = [];
        $outcomes = [];
        foreach ($rows as $row) {
            if (!isset($courses[(int) $row['course_id']])) {
                $this->skip_tokens('interaction_logs', (int) $row['course_id'], $row, 'prompt_tokens', 'completion_tokens');
                $outcomes[] = 'nocourse';
                continue;
            }
            if ($this->has_interaction($row)) {
                $outcomes[] = 'existing';
                continue;
            }
            $message = $messages[$row['user_message_id'] ?? ''] ?? null;
            $records[] = (object) [
                'courseid' => (int) $row['course_id'],
                'userid' => $message->userid ?? $this->user_from_hash($row['user_id_hash'] ?? null),
                'userhash' => $row['user_id_hash'] ?? null,
                'messageid' => $message->id ?? null,
                'questionchars' => (int) $row['question_char_count'],
                'answerchars' => (int) $row['answer_char_count'],
                'chunksretrieved' => (int) ($row['chunks_retrieved'] ?? 0),
                'hascontext' => empty($row['has_relevant_context']) ? 0 : 1,
                'multicourse' => empty($row['is_multicourse']) ? 0 : 1,
                'tokensprompt' => self::int_or_null($row['prompt_tokens'] ?? null),
                'tokenscompletion' => self::int_or_null($row['completion_tokens'] ?? null),
                'latencyms' => (float) ($row['latency_ms'] ?? 0),
                'endpoint' => (string) $row['endpoint'],
                'timecreated' => self::time($row['created_at']),
            ];
            $outcomes[] = 'imported';
        }
        if ($records) {
            $DB->insert_records('local_nexusai_interactions', $records);
        }
        return $outcomes;
    }

    /**
     * Whether an interaction was already imported. They have no uuid: the course,
     * the user's hash, the second and the size of question and answer identify one.
     *
     * @param array $row Backend row.
     * @return bool
     */
    private function has_interaction(array $row): bool {
        global $DB;
        $conditions = [
            'courseid' => (int) $row['course_id'],
            'timecreated' => self::time($row['created_at']),
            'questionchars' => (int) $row['question_char_count'],
            'answerchars' => (int) $row['answer_char_count'],
            'userhash' => $row['user_id_hash'] ?? null,
        ];
        return $DB->record_exists('local_nexusai_interactions', $conditions);
    }

    /**
     * Imports the votes on answers.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_message_feedback(array $rows): array {
        global $DB;
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $messages = $this->messages_with_user(array_column($rows, 'message_id'));
        $outcomes = [];
        foreach ($rows as $row) {
            if (!isset($courses[(int) $row['course_id']])) {
                $outcomes[] = 'nocourse';
                continue;
            }
            $message = $messages[$row['message_id'] ?? ''] ?? null;
            $userid = $this->user_from_hash($row['user_id_hash'] ?? null);
            $vote = ['messageid' => $message->id ?? null, 'userid' => $userid];
            $again = ['courseid' => (int) $row['course_id'], 'userhash' => $row['user_id_hash'] ?? null,
                'timecreated' => self::time($row['created_at'])];
            $voted = $message && $userid && $DB->record_exists('local_nexusai_msg_feedback', $vote);
            if ($voted || ($again['userhash'] !== null && $DB->record_exists('local_nexusai_msg_feedback', $again))) {
                $outcomes[] = 'existing';
                continue;
            }
            $DB->insert_record('local_nexusai_msg_feedback', (object) [
                'messageid' => $message->id ?? null,
                'courseid' => (int) $row['course_id'],
                'userid' => $userid,
                'userhash' => $row['user_id_hash'] ?? null,
                'ishelpful' => empty($row['is_helpful']) ? 0 : 1,
                'comment' => $row['comment'] ?? null,
                'timecreated' => self::time($row['created_at']),
                'timemodified' => self::time($row['updated_at'] ?? $row['created_at']),
            ]);
            $outcomes[] = 'imported';
        }
        return $outcomes;
    }

    /**
     * Imports the questions the material could not answer.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_unanswered_questions(array $rows): array {
        return $this->import_owned_rows('local_nexusai_gaps', $rows, static function (array $row): array {
            $question = (string) $row['question'];
            $embedding = $row['embedding'] ?? null;
            return [
                'question' => $question,
                'questionhash' => store_util::question_hash($question),
                'maxsimilarity' => isset($row['max_similarity']) ? (float) $row['max_similarity'] : null,
                'chunksretrieved' => (int) ($row['chunks_retrieved'] ?? 0),
                'embedding' => is_array($embedding) && $embedding ? json_encode($embedding) : null,
                'timearchived' => self::time_or_null($row['archived_at'] ?? null),
                'timestudentdismissed' => self::time_or_null($row['student_dismissed_at'] ?? null),
            ];
        });
    }

    /**
     * Imports quiz attempts.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_quiz_attempts(array $rows): array {
        return $this->import_owned_rows('local_nexusai_quiz_attempts', $rows, static function (array $row): array {
            return [
                'questiontype' => $row['question_type'] ?? null,
                'difficulty' => (string) ($row['difficulty'] ?? 'medium'),
                'topic' => $row['topic'] ?? null,
                'totalquestions' => (int) $row['total_questions'],
                'correctanswers' => (int) ($row['correct_answers'] ?? 0),
                'score' => (float) ($row['score'] ?? 0),
                'timedeleted' => self::time_or_null($row['deleted_at'] ?? null),
            ];
        });
    }

    /**
     * Imports the questions each student got wrong.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_quiz_errors(array $rows): array {
        return $this->import_owned_rows('local_nexusai_quiz_errors', $rows, static function (array $row): array {
            return [
                'questiontype' => (string) $row['question_type'],
                'question' => (string) $row['question'],
                'explanation' => (string) $row['explanation'],
                'sourcefilename' => $row['source_filename'] ?? null,
                'sourcedocumentid' => $row['source_document_id'] ?? null,
                'options' => isset($row['options']) ? json_encode($row['options']) : null,
                'correctindex' => (int) ($row['correct_index'] ?? -1),
                'userselectedindex' => self::int_or_null($row['user_selected_index'] ?? null),
                'useranswer' => $row['user_answer'] ?? null,
                'aifeedback' => $row['ai_feedback'] ?? null,
                'aiscore' => isset($row['ai_score']) ? (float) $row['ai_score'] : null,
                'timedismissed' => self::time_or_null($row['dismissed_at'] ?? null),
            ];
        });
    }

    /**
     * Imports the flashcards of each course, with the activity of their document.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_flashcards(array $rows): array {
        global $DB;
        $existing = $this->existing_uuids('local_nexusai_flashcards', $rows);
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $cmids = $this->existing_ids('course_modules', array_filter(array_column($rows, 'source_cmid')));
        $samecard = static function (array $row): array {
            return ['courseid' => (int) $row['course_id'], 'contenthash' => (string) $row['content_hash']];
        };
        $outcomes = [];
        foreach ($rows as $row) {
            if (!isset($courses[(int) $row['course_id']])) {
                $outcomes[] = 'nocourse';
            } else if (isset($existing[$row['id']])) {
                $outcomes[] = 'existing';
            } else if ($DB->record_exists('local_nexusai_flashcards', $samecard($row))) {
                // Moodle keeps one flashcard per course and content.
                $outcomes[] = 'duplicate';
            } else {
                $cmid = (int) ($row['source_cmid'] ?? 0);
                $DB->insert_record('local_nexusai_flashcards', (object) [
                    'uuid' => $row['id'],
                    'courseid' => (int) $row['course_id'],
                    'topic' => $row['topic'] ?? null,
                    'contenthash' => (string) $row['content_hash'],
                    'question' => (string) $row['question'],
                    'explanation' => (string) $row['explanation'],
                    'sourcefilename' => $row['source_filename'] ?? null,
                    'sourcedocumentid' => $row['source_document_id'] ?? null,
                    'sourcecmid' => isset($cmids[$cmid]) ? $cmid : null,
                    'timecreated' => self::time($row['created_at']),
                ]);
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Imports each student's spaced repetition of a flashcard.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_flashcard_reviews(array $rows): array {
        global $DB;
        $cards = $this->ids_by_uuid('local_nexusai_flashcards', array_column($rows, 'flashcard_id'));
        $users = $this->existing_ids('user', array_filter(array_column($rows, 'user_id')), 'deleted = 0');
        $outcomes = [];
        foreach ($rows as $row) {
            $userid = self::int_or_null($row['user_id'] ?? null);
            $cardid = $cards[$row['flashcard_id']] ?? null;
            if ($cardid === null) {
                $outcomes[] = 'noflashcard';
            } else if ($userid !== null && !isset($users[$userid])) {
                $outcomes[] = 'nouser';
            } else if ($userid !== null && $this->has_review($cardid, $userid)) {
                $outcomes[] = 'existing';
            } else {
                $DB->insert_record('local_nexusai_fc_reviews', (object) [
                    'flashcardid' => $cardid,
                    'userid' => $userid,
                    'easefactor' => (float) ($row['ease_factor'] ?? 2.5),
                    'intervaldays' => (int) ($row['interval_days'] ?? 0),
                    'repetitions' => (int) ($row['repetitions'] ?? 0),
                    'timelastreviewed' => self::time_or_null($row['last_reviewed_at'] ?? null),
                    'timenextreview' => self::time_or_null($row['next_review_at'] ?? null),
                    'timedeleted' => self::time_or_null($row['deleted_at'] ?? null),
                    'timecreated' => self::time($row['created_at']),
                    'timemodified' => self::time($row['updated_at'] ?? $row['created_at']),
                ]);
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Whether a student already has a review of a flashcard in Moodle.
     *
     * @param int $cardid Local flashcard id.
     * @param int $userid User.
     * @return bool
     */
    private function has_review(int $cardid, int $userid): bool {
        global $DB;
        return $DB->record_exists('local_nexusai_fc_reviews', ['flashcardid' => $cardid, 'userid' => $userid]);
    }

    /**
     * Imports calendar reminders.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_calendar_alerts(array $rows): array {
        global $DB;
        $fields = static function (array $row): array {
            return [
                'eventid' => (int) $row['event_id'],
                'eventname' => (string) $row['event_name'],
                'eventtimestamp' => (int) $row['event_timestamp'],
                'daysbefore' => (int) $row['days_before'],
                'notified' => empty($row['notified']) ? 0 : 1,
            ];
        };
        // Moodle keeps one reminder per user and event.
        $duplicate = static function (array $row) use ($DB): bool {
            $conditions = ['userid' => (int) $row['user_id'], 'eventid' => (int) $row['event_id']];
            return $DB->record_exists('local_nexusai_cal_alerts', $conditions);
        };
        return $this->import_owned_rows('local_nexusai_cal_alerts', $rows, $fields, $duplicate);
    }

    /**
     * Imports the forum webhook of each course; one already set in Moodle is kept.
     *
     * @param array $rows Backend rows.
     * @return string[] Outcome of each row.
     */
    private function import_forum_webhook_configs(array $rows): array {
        global $DB;
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $outcomes = [];
        foreach ($rows as $row) {
            $courseid = (int) $row['course_id'];
            if (!isset($courses[$courseid])) {
                $outcomes[] = 'nocourse';
            } else if ($DB->record_exists('local_nexusai_forum_webhooks', ['courseid' => $courseid])) {
                $outcomes[] = 'existing';
            } else {
                $DB->insert_record('local_nexusai_forum_webhooks', (object) [
                    'courseid' => $courseid,
                    'webhookurl' => (string) $row['webhook_url'],
                    'timecreated' => self::time($row['created_at']),
                    'timemodified' => self::time($row['updated_at'] ?? $row['created_at']),
                ]);
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Imports rows that have a uuid, a course and a user (the user may be null
     * in the backend, as in anonymous quiz attempts).
     *
     * @param string $local Local table.
     * @param array $rows Backend rows.
     * @param callable $fields Returns the table's own fields of a row.
     * @param callable|null $duplicate Whether Moodle already has an equivalent row.
     * @return string[] Outcome of each row.
     */
    private function import_owned_rows(string $local, array $rows, callable $fields, ?callable $duplicate = null): array {
        global $DB;
        $existing = $this->existing_uuids($local, $rows);
        $users = $this->existing_ids('user', array_filter(array_column($rows, 'user_id')), 'deleted = 0');
        $courses = $this->existing_ids('course', array_column($rows, 'course_id'));
        $outcomes = [];
        foreach ($rows as $row) {
            $skip = $this->missing($row, $users, $courses);
            if ($skip) {
                $outcomes[] = $skip;
            } else if (isset($existing[$row['id']])) {
                $outcomes[] = 'existing';
            } else if ($duplicate && $duplicate($row)) {
                $outcomes[] = 'duplicate';
            } else {
                $DB->insert_record($local, (object) ([
                    'uuid' => $row['id'],
                    'courseid' => (int) $row['course_id'],
                    'userid' => self::int_or_null($row['user_id'] ?? null),
                    'timecreated' => self::time($row['created_at']),
                ] + $fields($row)));
                $outcomes[] = 'imported';
            }
        }
        return $outcomes;
    }

    /**
     * Why a row cannot be imported: its user or its course is gone.
     *
     * @param array $row Backend row.
     * @param array $users Existing user ids as keys.
     * @param array $courses Existing course ids as keys.
     * @return string|null 'nouser', 'nocourse' or null.
     */
    private function missing(array $row, array $users, array $courses): ?string {
        if (isset($row['user_id']) && !isset($users[(int) $row['user_id']])) {
            return 'nouser';
        }
        if (!isset($courses[(int) $row['course_id']])) {
            return 'nocourse';
        }
        return null;
    }

    /**
     * Remembers the tokens of a skipped row, so the verification can account for them.
     *
     * @param string $table messages or interaction_logs.
     * @param int $courseid Course of the row in the backend.
     * @param array $row Backend row.
     * @param string $prompt Name of the prompt tokens column.
     * @param string $completion Name of the completion tokens column.
     */
    private function skip_tokens(string $table, int $courseid, array $row, string $prompt, string $completion): void {
        $key = $courseid . '|' . gmdate('Y-m', self::time($row['created_at']));
        $sums = $this->state['skippedtokens'][$table][$key] ?? [0, 0, 0];
        $this->state['skippedtokens'][$table][$key] = [
            $sums[0] + 1,
            $sums[1] + (int) ($row[$prompt] ?? 0),
            $sums[2] + (int) ($row[$completion] ?? 0),
        ];
    }

    /**
     * Rows of a page that are already in the local table.
     *
     * @param string $local Local table.
     * @param array $rows Backend rows.
     * @return array uuid => true.
     */
    private function existing_uuids(string $local, array $rows): array {
        return array_fill_keys(array_keys($this->ids_by_uuid($local, array_column($rows, 'id'))), true);
    }

    /**
     * Local ids of rows by their uuid.
     *
     * @param string $local Local table.
     * @param array $uuids Uuids, possibly with nulls and repeats.
     * @return array uuid => id.
     */
    private function ids_by_uuid(string $local, array $uuids): array {
        global $DB;
        $uuids = array_values(array_unique(array_filter($uuids)));
        if (!$uuids) {
            return [];
        }
        [$insql, $params] = $DB->get_in_or_equal($uuids);
        return array_map('intval', $DB->get_records_select_menu($local, "uuid {$insql}", $params, '', 'uuid, id'));
    }

    /**
     * Ids of a Moodle table that exist, among the given ones.
     *
     * @param string $table Table (user, course, course_modules).
     * @param array $ids Ids, possibly with nulls and repeats.
     * @param string $where Extra condition.
     * @return array id => true.
     */
    private function existing_ids(string $table, array $ids, string $where = ''): array {
        global $DB;
        $ids = array_values(array_unique(array_map('intval', array_filter($ids))));
        if (!$ids) {
            return [];
        }
        [$insql, $params] = $DB->get_in_or_equal($ids);
        $select = "id {$insql}" . ($where !== '' ? " AND {$where}" : '');
        return array_fill_keys(array_map('intval', $DB->get_fieldset_select($table, 'id', $select, $params)), true);
    }

    /**
     * Local messages by uuid, with the user of their conversation.
     *
     * @param array $uuids Message uuids, possibly with nulls.
     * @return array uuid => {id, userid}.
     */
    private function messages_with_user(array $uuids): array {
        global $DB;
        $uuids = array_values(array_unique(array_filter($uuids)));
        if (!$uuids) {
            return [];
        }
        [$insql, $params] = $DB->get_in_or_equal($uuids);
        $sql = "SELECT m.uuid, m.id, s.userid
                  FROM {local_nexusai_messages} m
                  JOIN {local_nexusai_chat_sessions} s ON s.id = m.sessionid
                 WHERE m.uuid {$insql}";
        return $DB->get_records_sql($sql, $params);
    }

    /**
     * The Moodle user behind the backend's hash of a user id.
     *
     * @param string|null $hash sha256 of the user id.
     * @return int|null
     */
    private function user_from_hash(?string $hash): ?int {
        global $DB;
        if ($hash === null || $hash === '') {
            return null;
        }
        if ($this->userhashes === null) {
            $this->userhashes = [];
            $rs = $DB->get_recordset('user', ['deleted' => 0], '', 'id');
            foreach ($rs as $user) {
                $this->userhashes[hash('sha256', (string) $user->id)] = (int) $user->id;
            }
            $rs->close();
        }
        return $this->userhashes[$hash] ?? null;
    }

    /**
     * Unix time of a backend date (ISO 8601; without zone it is UTC).
     *
     * @param string $iso Date.
     * @return int
     */
    public static function time(string $iso): int {
        return (new \DateTimeImmutable($iso, new \DateTimeZone('UTC')))->getTimestamp();
    }

    /**
     * Unix time of an optional backend date.
     *
     * @param string|null $iso Date or null.
     * @return int|null
     */
    private static function time_or_null(?string $iso): ?int {
        return $iso === null || $iso === '' ? null : self::time($iso);
    }

    /**
     * An optional integer.
     *
     * @param mixed $value Value or null.
     * @return int|null
     */
    private static function int_or_null($value): ?int {
        return $value === null ? null : (int) $value;
    }

    /**
     * Row counts and token sums per course and month of the local tables, in the
     * shape of the backend summary.
     *
     * @return array{counts:array, message_tokens:array, interaction_tokens:array}
     */
    public static function local_summary(): array {
        global $DB;
        $counts = [];
        foreach (self::TABLES as $backend => $local) {
            $counts[$backend] = $DB->count_records($local);
        }
        $messages = [];
        $rs = $DB->get_recordset_sql(
            "SELECT m.id, s.courseid, m.timecreated, m.tokensprompt, m.tokenscompletion
               FROM {local_nexusai_messages} m
               JOIN {local_nexusai_chat_sessions} s ON s.id = m.sessionid"
        );
        foreach ($rs as $row) {
            self::add_sums($messages, (int) $row->courseid, (int) $row->timecreated, $row->tokensprompt, $row->tokenscompletion);
        }
        $rs->close();
        $interactions = [];
        $columns = 'id, courseid, timecreated, tokensprompt, tokenscompletion';
        $rs = $DB->get_recordset('local_nexusai_interactions', null, '', $columns);
        foreach ($rs as $r) {
            self::add_sums($interactions, (int) $r->courseid, (int) $r->timecreated, $r->tokensprompt, $r->tokenscompletion);
        }
        $rs->close();
        return ['counts' => $counts, 'message_tokens' => $messages, 'interaction_tokens' => $interactions];
    }

    /**
     * Adds a row to the sums of its course and month.
     *
     * @param array $sums course|month => [rows, prompt tokens, completion tokens].
     * @param int $courseid Course.
     * @param int $time Unix time.
     * @param mixed $prompt Prompt tokens or null.
     * @param mixed $completion Completion tokens or null.
     */
    private static function add_sums(array &$sums, int $courseid, int $time, $prompt, $completion): void {
        $key = $courseid . '|' . gmdate('Y-m', $time);
        $sums[$key] = $sums[$key] ?? [0, 0, 0];
        $sums[$key][0]++;
        $sums[$key][1] += (int) $prompt;
        $sums[$key][2] += (int) $completion;
    }

    /**
     * Compares the backend summary with Moodle, counting what was skipped as moved.
     *
     * @param array $backend Backend summary (GET /migration/export/summary).
     * @param array $local Local summary (local_summary()).
     * @param array $state Migration progress (state()).
     * @return string[] Differences; empty when everything matches.
     */
    public static function compare(array $backend, array $local, array $state): array {
        $differences = [];
        foreach (array_keys(self::TABLES) as $table) {
            $expected = (int) ($backend['counts'][$table] ?? 0) - array_sum($state['tables'][$table]['skipped'] ?? []);
            $found = (int) ($local['counts'][$table] ?? 0);
            if ($expected !== $found) {
                $differences[] = "{$table}: expected {$expected} rows in Moodle, found {$found}";
            }
        }
        $groups = [
            'messages' => ['message_tokens', 'messages'],
            'interaction_logs' => ['interaction_tokens', 'interactions'],
        ];
        foreach ($groups as $table => [$key, $countcolumn]) {
            $expected = [];
            foreach ($backend[$key] ?? [] as $row) {
                $expected[$row['course_id'] . '|' . $row['month']] = [
                    (int) $row[$countcolumn],
                    (int) $row['prompt_tokens'],
                    (int) $row['completion_tokens'],
                ];
            }
            $found = $local[$key] ?? [];
            foreach ($state['skippedtokens'][$table] ?? [] as $group => $sums) {
                $found[$group] = $found[$group] ?? [0, 0, 0];
                foreach ($sums as $i => $value) {
                    $found[$group][$i] += $value;
                }
            }
            foreach (array_unique(array_merge(array_keys($expected), array_keys($found))) as $group) {
                $want = $expected[$group] ?? [0, 0, 0];
                $got = $found[$group] ?? [0, 0, 0];
                if ($want !== $got) {
                    [$courseid, $month] = explode('|', $group);
                    $differences[] = sprintf(
                        '%s, course %s, %s: backend %d rows / %d + %d tokens, Moodle %d rows / %d + %d tokens',
                        $table,
                        $courseid,
                        $month,
                        $want[0],
                        $want[1],
                        $want[2],
                        $got[0],
                        $got[1],
                        $got[2]
                    );
                }
            }
        }
        return $differences;
    }
}
