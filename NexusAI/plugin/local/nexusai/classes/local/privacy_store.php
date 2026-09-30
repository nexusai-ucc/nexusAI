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
 * The student's own export and deletion of their NexusAI history in a course (DATA-05).
 *
 * Backs the local_nexusai_privacy_export and local_nexusai_privacy_delete web
 * services (PRIV-01). Same rules the backend applied: messages and quiz errors
 * are deleted; quiz attempts stay for the course statistics, without the student.
 * The admin's data requests go through classes/privacy/provider.php instead.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Self-service export and deletion for one user in one course.
 */
class privacy_store {
    /**
     * The user's messages, quiz attempts and quiz errors in a course.
     *
     * @param int $userid User.
     * @param int $courseid Course.
     * @return array In the format of the privacy_export web service.
     */
    public static function export(int $userid, int $courseid): array {
        global $DB;
        $messages = $DB->get_records_sql(
            "SELECT m.id, s.uuid AS sessionuuid, m.role, m.content, m.timecreated
               FROM {local_nexusai_messages} m
               JOIN {local_nexusai_chat_sessions} s ON s.id = m.sessionid
              WHERE s.userid = :userid AND s.courseid = :courseid
           ORDER BY m.timecreated, m.id",
            ['userid' => $userid, 'courseid' => $courseid]
        );
        $attempts = $DB->get_records(
            'local_nexusai_quiz_attempts',
            ['userid' => $userid, 'courseid' => $courseid],
            'timecreated, id'
        );
        $errors = $DB->get_records(
            'local_nexusai_quiz_errors',
            ['userid' => $userid, 'courseid' => $courseid],
            'timecreated, id'
        );
        return [
            'user_id' => $userid,
            'course_id' => $courseid,
            'messages' => array_values(array_map(static fn($m) => [
                'session_id' => $m->sessionuuid,
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => store_util::iso((int) $m->timecreated),
            ], $messages)),
            'quiz_attempts' => array_values(array_map(static fn($a) => [
                'id' => $a->uuid,
                'question_type' => $a->questiontype,
                'difficulty' => $a->difficulty,
                'topic' => $a->topic,
                'total_questions' => (int) $a->totalquestions,
                'correct_answers' => (int) $a->correctanswers,
                'score' => (float) $a->score,
                'created_at' => store_util::iso((int) $a->timecreated),
            ], $attempts)),
            'quiz_errors' => array_values(array_map(static fn($e) => [
                'id' => $e->uuid,
                'question_type' => $e->questiontype,
                'question' => $e->question,
                'explanation' => $e->explanation,
                'user_answer' => $e->useranswer,
                'ai_feedback' => $e->aifeedback,
                'ai_score' => $e->aiscore !== null ? (float) $e->aiscore : null,
                'created_at' => store_util::iso((int) $e->timecreated),
            ], $errors)),
        ];
    }

    /**
     * Deletes the user's conversations and quiz errors in a course; keeps the
     * attempts and flashcard reviews without the user.
     *
     * @param int $userid User.
     * @param int $courseid Course.
     * @return array In the format of the privacy_delete web service.
     */
    public static function delete(int $userid, int $courseid): array {
        global $DB;
        $transaction = $DB->start_delegated_transaction();

        $sessionids = $DB->get_fieldset_select(
            'local_nexusai_chat_sessions',
            'id',
            'userid = :userid AND courseid = :courseid',
            ['userid' => $userid, 'courseid' => $courseid]
        );
        $messages = chat_store::delete_sessions(array_map('intval', $sessionids));

        $conditions = ['userid' => $userid, 'courseid' => $courseid];
        $errors = $DB->count_records('local_nexusai_quiz_errors', $conditions);
        $DB->delete_records('local_nexusai_quiz_errors', $conditions);

        $now = time();
        $attempts = $DB->count_records_select(
            'local_nexusai_quiz_attempts',
            'userid = :userid AND courseid = :courseid AND timedeleted IS NULL',
            $conditions
        );
        $DB->execute(
            'UPDATE {local_nexusai_quiz_attempts} SET userid = NULL, timedeleted = :now
              WHERE userid = :userid AND courseid = :courseid AND timedeleted IS NULL',
            $conditions + ['now' => $now]
        );
        $DB->execute(
            'UPDATE {local_nexusai_fc_reviews} SET userid = NULL, timedeleted = :now
              WHERE userid = :userid AND timedeleted IS NULL
                AND flashcardid IN (SELECT id FROM {local_nexusai_flashcards} WHERE courseid = :courseid)',
            $conditions + ['now' => $now]
        );

        $transaction->allow_commit();
        return [
            'messages_deleted' => $messages,
            'quiz_errors_deleted' => $errors,
            'quiz_attempts_anonymized' => $attempts,
        ];
    }
}
