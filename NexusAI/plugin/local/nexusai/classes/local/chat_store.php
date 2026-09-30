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
 * Chat conversations, messages, votes, interaction metrics and unanswered questions (DATA-05).
 *
 * Ported from the backend (services/api/app/chat/router.py, analytics/logger.py
 * and gaps/recorder.py). The backend no longer stores any of this: it answers
 * and tells Moodle what to keep (DATA-04).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Reads and writes the chat tables.
 */
class chat_store {
    /** @var int Messages sent to the backend as history. */
    const HISTORY_LIMIT = 10;

    /** @var int Characters of the first question shown in the history list. */
    const PREVIEW_CHARS = 80;

    /**
     * The conversation to add a question to: the given one, or a new one.
     *
     * A multi-course conversation stays in the course where the chat was opened,
     * with the list of courses it searched.
     *
     * @param int $userid User who asks.
     * @param int $courseid Course where the chat is open.
     * @param string|null $uuid Existing conversation, or null for a new one.
     * @param int[] $courseids Courses searched when the chat is multi-course.
     * @return \stdClass Conversation record.
     * @throws \moodle_exception If the conversation does not exist or is someone else's.
     */
    public static function get_or_create_session(int $userid, int $courseid, ?string $uuid, array $courseids = []): \stdClass {
        global $DB;

        if ($uuid !== null && $uuid !== '') {
            return self::owned_session($userid, $uuid);
        }

        $now = time();
        $multicourse = count($courseids) > 1;
        $record = (object) [
            'uuid' => store_util::uuid(),
            'userid' => $userid,
            'courseid' => $courseid,
            'multicourse' => $multicourse ? 1 : 0,
            'courseids' => $multicourse ? json_encode(array_values(array_map('intval', $courseids))) : null,
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $record->id = $DB->insert_record('local_nexusai_chat_sessions', $record);
        return $record;
    }

    /**
     * A conversation of the user, by its public id.
     *
     * @param int $userid User.
     * @param string $uuid Conversation id.
     * @return \stdClass
     * @throws \moodle_exception If it does not exist or belongs to someone else.
     */
    public static function owned_session(int $userid, string $uuid): \stdClass {
        global $DB;
        $session = $DB->get_record('local_nexusai_chat_sessions', ['uuid' => $uuid]);
        if (!$session || (int) $session->userid !== $userid) {
            // Same answer for "missing" and "not yours": do not reveal other users' conversations.
            throw new \moodle_exception('errorsessionnotfound', 'local_nexusai');
        }
        return $session;
    }

    /**
     * Adds a message to a conversation and marks the conversation as active.
     *
     * @param \stdClass $session Conversation.
     * @param string $role user or assistant.
     * @param string $content Text.
     * @param int|null $tokensprompt Prompt tokens (answers only).
     * @param int|null $tokenscompletion Completion tokens (answers only).
     * @param int|null $time When it was written; now by default.
     * @return \stdClass The message record, with its uuid.
     */
    public static function add_message(
        \stdClass $session,
        string $role,
        string $content,
        ?int $tokensprompt = null,
        ?int $tokenscompletion = null,
        ?int $time = null
    ): \stdClass {
        global $DB;
        $time = $time ?? time();
        $record = (object) [
            'uuid' => store_util::uuid(),
            'sessionid' => $session->id,
            'role' => $role,
            'content' => $content,
            'tokensprompt' => $tokensprompt,
            'tokenscompletion' => $tokenscompletion,
            'timecreated' => $time,
        ];
        $record->id = $DB->insert_record('local_nexusai_messages', $record);
        $DB->set_field('local_nexusai_chat_sessions', 'timemodified', $time, ['id' => $session->id]);
        return $record;
    }

    /**
     * The last messages of a conversation, oldest first, in the backend's history format.
     *
     * @param int $sessionid Conversation id.
     * @param int|null $excludeid Message to leave out (the question just stored).
     * @return array[] [{role, content}]
     */
    public static function history(int $sessionid, ?int $excludeid = null): array {
        global $DB;
        $params = ['sessionid' => $sessionid];
        $where = 'sessionid = :sessionid';
        if ($excludeid !== null) {
            $where .= ' AND id <> :excludeid';
            $params['excludeid'] = $excludeid;
        }
        $rows = $DB->get_records_select(
            'local_nexusai_messages',
            $where,
            $params,
            'timecreated DESC, id DESC',
            'id, role, content',
            0,
            self::HISTORY_LIMIT
        );
        $history = [];
        foreach (array_reverse($rows) as $row) {
            if ($row->role === 'user' || $row->role === 'assistant') {
                $history[] = ['role' => $row->role, 'content' => $row->content];
            }
        }
        return $history;
    }

    /**
     * The user's conversations, most recently active first.
     *
     * @param int $userid User.
     * @param int|null $courseid Only this course, or null for all.
     * @param int $limit Maximum.
     * @return array[] In the format of the chat_sessions_list web service.
     */
    public static function list_sessions(int $userid, ?int $courseid, int $limit): array {
        global $DB;
        $conditions = ['userid' => $userid];
        if ($courseid !== null && $courseid > 0) {
            $conditions['courseid'] = $courseid;
        }
        $sessions = $DB->get_records('local_nexusai_chat_sessions', $conditions, 'timemodified DESC, id DESC', '*', 0, $limit);
        $out = [];
        foreach ($sessions as $session) {
            $first = $DB->get_records(
                'local_nexusai_messages',
                ['sessionid' => $session->id, 'role' => 'user'],
                'timecreated ASC, id ASC',
                'id, content',
                0,
                1
            );
            $first = reset($first);
            $preview = null;
            if ($first) {
                $preview = \core_text::strlen($first->content) > self::PREVIEW_CHARS
                    ? trim(\core_text::substr($first->content, 0, self::PREVIEW_CHARS)) . '…'
                    : $first->content;
            }
            $out[] = [
                'id' => $session->uuid,
                'course_id' => (int) $session->courseid,
                'created_at' => store_util::iso((int) $session->timecreated),
                'updated_at' => store_util::iso((int) $session->timemodified),
                'last_message_preview' => $preview,
                'message_count' => $DB->count_records('local_nexusai_messages', ['sessionid' => $session->id]),
            ];
        }
        return $out;
    }

    /**
     * All the messages of one of the user's conversations, in order.
     *
     * @param int $userid User.
     * @param string $uuid Conversation id.
     * @return array In the format of the chat_session_messages web service.
     */
    public static function session_messages(int $userid, string $uuid): array {
        global $DB;
        $session = self::owned_session($userid, $uuid);
        $messages = $DB->get_records('local_nexusai_messages', ['sessionid' => $session->id], 'timecreated ASC, id ASC');
        return [
            'session_id' => $session->uuid,
            'messages' => array_values(array_map(static fn($m) => [
                'id' => $m->uuid,
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => store_util::iso((int) $m->timecreated),
            ], $messages)),
        ];
    }

    /**
     * Deletes one of the user's conversations with its messages.
     *
     * Moodle has no foreign keys: the votes and metrics that pointed at those
     * messages stay, detached from them.
     *
     * @param int $userid User.
     * @param string $uuid Conversation id.
     */
    public static function delete_session(int $userid, string $uuid): void {
        global $DB;
        $session = self::owned_session($userid, $uuid);
        self::delete_sessions([(int) $session->id]);
    }

    /**
     * Deletes conversations by id, with their messages.
     *
     * @param int[] $sessionids Conversation ids.
     * @return int Messages deleted.
     */
    public static function delete_sessions(array $sessionids): int {
        global $DB;
        if (empty($sessionids)) {
            return 0;
        }
        [$sessql, $sesparams] = $DB->get_in_or_equal($sessionids, SQL_PARAMS_NAMED, 's');
        $messageids = $DB->get_fieldset_select('local_nexusai_messages', 'id', "sessionid $sessql", $sesparams);
        if ($messageids) {
            [$msgsql, $msgparams] = $DB->get_in_or_equal($messageids, SQL_PARAMS_NAMED, 'm');
            $DB->set_field_select('local_nexusai_interactions', 'messageid', null, "messageid $msgsql", $msgparams);
            $DB->set_field_select('local_nexusai_msg_feedback', 'messageid', null, "messageid $msgsql", $msgparams);
            $DB->delete_records_select('local_nexusai_messages', "id $msgsql", $msgparams);
        }
        $DB->delete_records_select('local_nexusai_chat_sessions', "id $sessql", $sesparams);
        return count($messageids);
    }

    /**
     * Saves (or changes) the user's vote on an answer.
     *
     * @param int $userid User.
     * @param int $courseid Course.
     * @param string $messageuuid Answer voted.
     * @param bool $ishelpful Whether it helped.
     * @param string|null $comment Optional comment.
     * @return \stdClass|null The message voted, or null if it does not exist.
     */
    public static function record_feedback(
        int $userid,
        int $courseid,
        string $messageuuid,
        bool $ishelpful,
        ?string $comment
    ): ?\stdClass {
        global $DB;
        $message = $DB->get_record('local_nexusai_messages', ['uuid' => $messageuuid]);
        if (!$message) {
            return null;
        }
        $now = time();
        $existing = $DB->get_record('local_nexusai_msg_feedback', ['messageid' => $message->id, 'userid' => $userid]);
        if ($existing) {
            $existing->ishelpful = $ishelpful ? 1 : 0;
            $existing->comment = $comment;
            $existing->timemodified = $now;
            $DB->update_record('local_nexusai_msg_feedback', $existing);
        } else {
            $DB->insert_record('local_nexusai_msg_feedback', (object) [
                'messageid' => $message->id,
                'courseid' => $courseid,
                'userid' => $userid,
                'ishelpful' => $ishelpful ? 1 : 0,
                'comment' => $comment,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        return $message;
    }

    /**
     * Saves the metrics of an answer, without the text of the question.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param \stdClass|null $question Question message.
     * @param string $answer Answer text.
     * @param array $metrics Metrics the backend returned (DATA-04).
     * @param string $endpoint messages or stream.
     */
    public static function record_interaction(
        int $courseid,
        int $userid,
        ?\stdClass $question,
        string $answer,
        array $metrics,
        string $endpoint
    ): void {
        global $DB;
        $DB->insert_record('local_nexusai_interactions', (object) [
            'courseid' => $courseid,
            'userid' => $userid,
            'messageid' => $question->id ?? null,
            'questionchars' => $question ? \core_text::strlen($question->content) : 0,
            'answerchars' => \core_text::strlen($answer),
            'chunksretrieved' => (int) ($metrics['chunks_retrieved'] ?? 0),
            'hascontext' => !empty($metrics['grounded']) ? 1 : 0,
            'multicourse' => !empty($metrics['multicourse']) ? 1 : 0,
            'tokensprompt' => isset($metrics['prompt_tokens']) ? (int) $metrics['prompt_tokens'] : null,
            'tokenscompletion' => isset($metrics['completion_tokens']) ? (int) $metrics['completion_tokens'] : null,
            'latencyms' => (float) ($metrics['latency_ms'] ?? 0),
            'endpoint' => $endpoint,
            'timecreated' => time(),
        ]);
    }

    /**
     * Saves a question the material could not answer, when the backend says it is one.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param string $question Question text.
     * @param array $gap Gap signal the backend returned (DATA-04).
     * @return bool Whether a gap was saved.
     */
    public static function record_gap(int $courseid, int $userid, string $question, array $gap): bool {
        global $DB;
        if (empty($gap['is_gap'])) {
            return false;
        }
        $text = \core_text::substr(trim($question), 0, 2000);
        $DB->insert_record('local_nexusai_gaps', (object) [
            'uuid' => store_util::uuid(),
            'courseid' => $courseid,
            'userid' => $userid,
            'question' => $text,
            'questionhash' => store_util::question_hash($text),
            'maxsimilarity' => isset($gap['max_similarity']) ? (float) $gap['max_similarity'] : null,
            'chunksretrieved' => (int) ($gap['chunks_retrieved'] ?? 0),
            'embedding' => !empty($gap['embedding']) && is_array($gap['embedding']) ? json_encode($gap['embedding']) : null,
            'timecreated' => time(),
        ]);
        return true;
    }
}
