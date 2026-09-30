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
 * Quiz attempts, wrong answers, study streak and study plan data (DATA-05).
 *
 * Ported from services/api/app/quiz/router.py. Attempts and errors live in
 * Moodle; the backend only gets what it needs to call the LLM (study plan and
 * review suggestions) inside the request.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Reads and writes the quiz tables.
 */
class quiz_store {
    /** @var int Latest attempts used to suggest a difficulty. */
    const SUGGEST_ATTEMPT_LIMIT = 10;

    /** @var int Most errors sent to the backend for a study plan or review. */
    const MAX_ERRORS_FOR_LLM = 300;

    /** @var int Most unanswered questions sent to the backend for a study plan. */
    const MAX_GAPS_FOR_LLM = 500;

    /**
     * Saves the questions a student answered wrong.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param array[] $errors Errors as the quiz panel sends them.
     * @return int How many were saved.
     */
    public static function record_errors(int $courseid, int $userid, array $errors): int {
        global $DB;
        $now = time();
        foreach ($errors as $e) {
            $DB->insert_record('local_nexusai_quiz_errors', (object) [
                'uuid' => store_util::uuid(),
                'courseid' => $courseid,
                'userid' => $userid,
                'questiontype' => (string) ($e['question_type'] ?? 'multiple_choice'),
                'question' => (string) $e['question'],
                'explanation' => (string) ($e['explanation'] ?? ''),
                'sourcefilename' => $e['source_filename'] ?? null,
                'sourcedocumentid' => $e['source_document_id'] ?? null,
                'options' => json_encode(array_values($e['options'] ?? [])),
                'correctindex' => (int) ($e['correct_index'] ?? -1),
                'userselectedindex' => isset($e['user_selected_index']) ? (int) $e['user_selected_index'] : null,
                'useranswer' => $e['user_answer'] ?? null,
                'aifeedback' => $e['ai_feedback'] ?? null,
                'aiscore' => isset($e['ai_score']) ? (float) $e['ai_score'] : null,
                'timecreated' => $now,
            ]);
        }
        return count($errors);
    }

    /**
     * A page of the student's errors in the last days, newest first.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param int $days Days back.
     * @param int $limit Page size.
     * @param int $offset Page start.
     * @return array In the format of the quiz_errors_list web service.
     */
    public static function list_errors(int $courseid, int $userid, int $days, int $limit, int $offset): array {
        global $DB;
        $params = ['courseid' => $courseid, 'userid' => $userid, 'since' => time() - $days * DAYSECS];
        $where = 'courseid = :courseid AND userid = :userid AND timecreated >= :since';
        $total = $DB->count_records_select('local_nexusai_quiz_errors', $where, $params);
        $rows = $DB->get_records_select(
            'local_nexusai_quiz_errors',
            $where,
            $params,
            'timecreated DESC, id DESC',
            '*',
            $offset,
            $limit
        );
        return [
            'course_id' => $courseid,
            'total' => $total,
            'items' => array_values(array_map(static fn($r) => [
                'id' => $r->uuid,
                'created_at' => store_util::iso((int) $r->timecreated),
                'question_type' => $r->questiontype,
                'question' => $r->question,
                'explanation' => $r->explanation,
                'source_filename' => $r->sourcefilename,
                'source_document_id' => $r->sourcedocumentid,
                'options' => json_decode((string) $r->options, true) ?: [],
                'correct_index' => (int) $r->correctindex,
                'user_selected_index' => $r->userselectedindex !== null ? (int) $r->userselectedindex : null,
                'user_answer' => $r->useranswer,
                'ai_feedback' => $r->aifeedback,
                'ai_score' => $r->aiscore !== null ? (float) $r->aiscore : null,
            ], $rows)),
        ];
    }

    /**
     * Deletes all the student's errors in the course.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @return int How many were deleted.
     */
    public static function clear_errors(int $courseid, int $userid): int {
        global $DB;
        $conditions = ['courseid' => $courseid, 'userid' => $userid];
        $count = $DB->count_records('local_nexusai_quiz_errors', $conditions);
        $DB->delete_records('local_nexusai_quiz_errors', $conditions);
        return $count;
    }

    /**
     * Saves a finished quiz. The score is worked out here, never taken from the client.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param string|null $questiontype Question type.
     * @param string $difficulty Difficulty.
     * @param string|null $topic Topic.
     * @param int $total Questions.
     * @param int $correct Correct answers.
     * @return array{id:string, score:float}
     */
    public static function save_attempt(
        int $courseid,
        int $userid,
        ?string $questiontype,
        string $difficulty,
        ?string $topic,
        int $total,
        int $correct
    ): array {
        global $DB;
        $score = round($correct / $total, 4);
        $uuid = store_util::uuid();
        $DB->insert_record('local_nexusai_quiz_attempts', (object) [
            'uuid' => $uuid,
            'courseid' => $courseid,
            'userid' => $userid,
            'questiontype' => $questiontype,
            'difficulty' => $difficulty,
            'topic' => $topic,
            'totalquestions' => $total,
            'correctanswers' => $correct,
            'score' => $score,
            'timecreated' => time(),
        ]);
        return ['id' => $uuid, 'score' => $score];
    }

    /**
     * The student's latest attempts in the last days.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param int $days Days back.
     * @param int $limit Maximum.
     * @return array In the format of the quiz_attempt_list web service.
     */
    public static function list_attempts(int $courseid, int $userid, int $days, int $limit): array {
        global $DB;
        $rows = $DB->get_records_select(
            'local_nexusai_quiz_attempts',
            'courseid = :courseid AND userid = :userid AND timecreated >= :since',
            ['courseid' => $courseid, 'userid' => $userid, 'since' => time() - $days * DAYSECS],
            'timecreated DESC, id DESC',
            '*',
            0,
            $limit
        );
        $items = array_values(array_map(static fn($r) => [
            'id' => $r->uuid,
            'question_type' => $r->questiontype,
            'difficulty' => $r->difficulty,
            'topic' => $r->topic,
            'total_questions' => (int) $r->totalquestions,
            'correct_answers' => (int) $r->correctanswers,
            'score' => (float) $r->score,
            'created_at' => store_util::iso((int) $r->timecreated),
        ], $rows));
        return ['course_id' => $courseid, 'total' => count($items), 'items' => $items];
    }

    /**
     * Difficulty to suggest from the latest attempts, for a topic or overall.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param string|null $topic Topic, or null for all.
     * @return array See study_logic::suggested_difficulty().
     */
    public static function suggest_difficulty(int $courseid, int $userid, ?string $topic): array {
        global $DB;
        $params = ['courseid' => $courseid, 'userid' => $userid];
        $where = 'courseid = :courseid AND userid = :userid';
        if ($topic !== null && trim($topic) !== '') {
            $where .= ' AND ' . $DB->sql_equal('topic', ':topic', false);
            $params['topic'] = trim($topic);
        }
        $scores = $DB->get_fieldset_sql(
            "SELECT score FROM {local_nexusai_quiz_attempts} WHERE $where ORDER BY timecreated DESC, id DESC",
            $params,
            0,
            self::SUGGEST_ATTEMPT_LIMIT
        );
        return study_logic::suggested_difficulty(array_map('floatval', $scores));
    }

    /**
     * Hides study plan evidence the student dismissed. It does not touch what the teacher sees.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param string[] $erroruuids Quiz errors.
     * @param string[] $gapuuids Unanswered questions.
     * @return int Rows affected.
     */
    public static function dismiss_study_plan(int $courseid, int $userid, array $erroruuids, array $gapuuids): int {
        global $DB;
        $now = time();
        $affected = 0;
        $targets = [
            ['local_nexusai_quiz_errors', 'timedismissed', $erroruuids],
            ['local_nexusai_gaps', 'timestudentdismissed', $gapuuids],
        ];
        foreach ($targets as [$table, $field, $uuids]) {
            if (empty($uuids)) {
                continue;
            }
            [$insql, $params] = $DB->get_in_or_equal(array_values($uuids), SQL_PARAMS_NAMED);
            $params += ['courseid' => $courseid, 'userid' => $userid];
            $where = "courseid = :courseid AND userid = :userid AND uuid $insql";
            $affected += $DB->count_records_select($table, $where, $params);
            $DB->set_field_select($table, $field, $now, $where, $params);
        }
        return $affected;
    }

    /**
     * Consecutive days with quiz or chat activity in the course.
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @return array{current_streak:int, practiced_today:bool}
     */
    public static function streak(int $courseid, int $userid): array {
        global $DB;
        $times = $DB->get_fieldset_select(
            'local_nexusai_quiz_attempts',
            'timecreated',
            'courseid = :courseid AND userid = :userid',
            ['courseid' => $courseid, 'userid' => $userid]
        );
        $chat = $DB->get_fieldset_sql(
            "SELECT m.timecreated
               FROM {local_nexusai_messages} m
               JOIN {local_nexusai_chat_sessions} s ON s.id = m.sessionid
              WHERE s.userid = :userid AND s.courseid = :courseid AND s.multicourse = 0 AND m.role = :role",
            ['userid' => $userid, 'courseid' => $courseid, 'role' => 'user']
        );
        $days = array_values(array_unique(array_map(static fn($t) => gmdate('Y-m-d', (int) $t), array_merge($times, $chat))));
        $today = gmdate('Y-m-d');
        return [
            'current_streak' => study_logic::streak($days, $today),
            'practiced_today' => in_array($today, $days, true),
        ];
    }

    /**
     * The student's recent errors, in the format the backend's LLM endpoints expect (DATA-04).
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param int $days Days back.
     * @param bool $undismissedonly Leave out what the student dismissed from the study plan.
     * @return array[]
     */
    public static function errors_for_backend(int $courseid, int $userid, int $days, bool $undismissedonly): array {
        global $DB;
        $where = 'courseid = :courseid AND userid = :userid AND timecreated >= :since';
        if ($undismissedonly) {
            $where .= ' AND timedismissed IS NULL';
        }
        $rows = $DB->get_records_select(
            'local_nexusai_quiz_errors',
            $where,
            ['courseid' => $courseid, 'userid' => $userid, 'since' => time() - $days * DAYSECS],
            'timecreated DESC, id DESC',
            'id, uuid, question, explanation, sourcefilename, sourcedocumentid, timecreated',
            0,
            self::MAX_ERRORS_FOR_LLM
        );
        return array_values(array_map(static fn($r) => [
            'id' => $r->uuid,
            'question' => \core_text::substr((string) $r->question, 0, 1000),
            'explanation' => \core_text::substr((string) $r->explanation, 0, 3000),
            'source_filename' => $r->sourcefilename,
            'source_document_id' => $r->sourcedocumentid,
            'created_at' => store_util::iso((int) $r->timecreated),
        ], $rows));
    }

    /**
     * The student's recent unanswered questions not dismissed, for the study plan (DATA-04).
     *
     * @param int $courseid Course.
     * @param int $userid Student.
     * @param int $days Days back.
     * @return array[]
     */
    public static function gaps_for_backend(int $courseid, int $userid, int $days): array {
        global $DB;
        $rows = $DB->get_records_select(
            'local_nexusai_gaps',
            'courseid = :courseid AND userid = :userid AND timecreated >= :since AND timestudentdismissed IS NULL',
            ['courseid' => $courseid, 'userid' => $userid, 'since' => time() - $days * DAYSECS],
            'timecreated DESC, id DESC',
            'id, uuid, question, timecreated',
            0,
            self::MAX_GAPS_FOR_LLM
        );
        return array_values(array_map(static fn($r) => [
            'id' => $r->uuid,
            'question' => \core_text::substr((string) $r->question, 0, 2000),
            'created_at' => store_util::iso((int) $r->timecreated),
        ], $rows));
    }
}
