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
 * Flashcards of a course and each student's spaced repetition (DATA-05).
 *
 * Ported from services/api/app/quiz/router.py (_persist_flashcards and the
 * /flashcards endpoints). The backend now returns generated flashcards with a
 * content hash and Moodle stores them, without duplicates, per course.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Reads and writes flashcards and their reviews.
 */
class flashcard_store {
    /**
     * Content hash of a flashcard, the same the backend computes.
     *
     * @param string $question Front.
     * @param string $explanation Back.
     * @return string 64 hex characters.
     */
    public static function content_hash(string $question, string $explanation): string {
        return hash('sha256', trim($question) . "\n" . trim($explanation));
    }

    /**
     * Stores generated flashcards once per course and gives each question its stable id.
     *
     * @param int $courseid Course.
     * @param string|null $topic Topic asked for.
     * @param array[] $questions Questions as the backend returns them; `id` is filled in.
     * @return array[] The same questions with their flashcard id.
     */
    public static function save_generated(int $courseid, ?string $topic, array $questions): array {
        global $DB;
        foreach ($questions as $i => $q) {
            $hash = (string) ($q['content_hash'] ?? '');
            if (strlen($hash) !== 64) {
                $hash = self::content_hash((string) $q['question'], (string) ($q['explanation'] ?? ''));
            }
            $existing = $DB->get_record('local_nexusai_flashcards', ['courseid' => $courseid, 'contenthash' => $hash], 'uuid');
            if ($existing) {
                $questions[$i]['id'] = $existing->uuid;
                continue;
            }
            $uuid = store_util::uuid();
            try {
                $DB->insert_record('local_nexusai_flashcards', (object) [
                    'uuid' => $uuid,
                    'courseid' => $courseid,
                    'topic' => $topic !== null && trim($topic) !== '' ? \core_text::substr(trim($topic), 0, 200) : null,
                    'contenthash' => $hash,
                    'question' => (string) $q['question'],
                    'explanation' => (string) ($q['explanation'] ?? ''),
                    'sourcefilename' => !empty($q['source_filename']) ? (string) $q['source_filename'] : null,
                    'sourcedocumentid' => $q['source_document_id'] ?? null,
                    'sourcecmid' => isset($q['source_cmid']) ? (int) $q['source_cmid'] : null,
                    'timecreated' => time(),
                ]);
            } catch (\dml_write_exception $e) {
                // Another request stored the same card first: use that one.
                $uuid = $DB->get_field('local_nexusai_flashcards', 'uuid', ['courseid' => $courseid, 'contenthash' => $hash]);
            }
            $questions[$i]['id'] = $uuid;
        }
        return $questions;
    }

    /**
     * SQL pieces for "cards of the course the user can see that are due today".
     *
     * A card is due when the user never reviewed it or its next review is now or
     * earlier. A card whose source activity is hidden from the user is left out;
     * cards without a known activity (older ones) stay.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param string|null $topic Topic, or null for all.
     * @param int[]|null $visiblecmids Activities the user can see, or null to skip the check.
     * @return array{0:string, 1:string, 2:array} FROM, base WHERE and params.
     */
    private static function due_sql(int $courseid, int $userid, ?string $topic, ?array $visiblecmids): array {
        global $DB;
        $from = '{local_nexusai_flashcards} f
            LEFT JOIN {local_nexusai_fc_reviews} r
                   ON r.flashcardid = f.id AND r.userid = :userid AND r.timedeleted IS NULL';
        $where = 'f.courseid = :courseid';
        $params = ['userid' => $userid, 'courseid' => $courseid];
        if ($topic !== null && trim($topic) !== '') {
            $where .= ' AND ' . $DB->sql_equal('f.topic', ':topic', false);
            $params['topic'] = trim($topic);
        }
        if ($visiblecmids !== null) {
            if (empty($visiblecmids)) {
                $where .= ' AND f.sourcecmid IS NULL';
            } else {
                [$insql, $inparams] = $DB->get_in_or_equal($visiblecmids, SQL_PARAMS_NAMED, 'cm');
                $where .= " AND (f.sourcecmid IS NULL OR f.sourcecmid $insql)";
                $params += $inparams;
            }
        }
        return [$from, $where, $params];
    }

    /**
     * How many cards are due today and how many there are in total.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param string|null $topic Topic.
     * @param int[]|null $visiblecmids Activities the user can see.
     * @return array{due_count:int, total_count:int}
     */
    public static function summary(int $courseid, int $userid, ?string $topic, ?array $visiblecmids): array {
        global $DB;
        [$from, $where, $params] = self::due_sql($courseid, $userid, $topic, $visiblecmids);
        $total = $DB->count_records_sql("SELECT COUNT(1) FROM $from WHERE $where", $params);
        $due = $DB->count_records_sql(
            "SELECT COUNT(1) FROM $from WHERE $where AND (r.id IS NULL OR r.timenextreview IS NULL OR r.timenextreview <= :now)",
            $params + ['now' => time()]
        );
        return ['due_count' => $due, 'total_count' => $total];
    }

    /**
     * Cards due today, most overdue first; never-reviewed cards last.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param string|null $topic Topic.
     * @param int $limit Maximum.
     * @param int[]|null $visiblecmids Activities the user can see.
     * @return array[] Questions in the quiz format.
     */
    public static function due(int $courseid, int $userid, ?string $topic, int $limit, ?array $visiblecmids): array {
        global $DB;
        [$from, $where, $params] = self::due_sql($courseid, $userid, $topic, $visiblecmids);
        $rows = $DB->get_records_sql(
            "SELECT f.id, f.uuid, f.question, f.explanation, f.sourcefilename, f.sourcedocumentid,
                    CASE WHEN r.timenextreview IS NULL THEN 1 ELSE 0 END AS neverreviewed, r.timenextreview
               FROM $from
              WHERE $where AND (r.id IS NULL OR r.timenextreview IS NULL OR r.timenextreview <= :now)
           ORDER BY neverreviewed ASC, r.timenextreview ASC, f.id ASC",
            $params + ['now' => time()],
            0,
            $limit
        );
        return array_values(array_map(static fn($f) => [
            'id' => $f->uuid,
            'question_type' => 'flashcard',
            'question' => $f->question,
            'options' => [],
            'correct_index' => -1,
            'explanation' => $f->explanation,
            'source_filename' => (string) ($f->sourcefilename ?? ''),
            'source_document_id' => $f->sourcedocumentid,
        ], $rows));
    }

    /**
     * Applies SM-2 to a self-assessed session of flashcards.
     *
     * @param int $courseid Course.
     * @param int $userid User.
     * @param array[] $reviews [{flashcard_id, knew_it}].
     * @return int Cards updated.
     */
    public static function review_batch(int $courseid, int $userid, array $reviews): int {
        global $DB;
        $uuids = array_values(array_unique(array_map(static fn($r) => (string) $r['flashcard_id'], $reviews)));
        if (empty($uuids)) {
            return 0;
        }
        [$insql, $params] = $DB->get_in_or_equal($uuids, SQL_PARAMS_NAMED);
        $cards = $DB->get_records_select_menu(
            'local_nexusai_flashcards',
            "courseid = :courseid AND uuid $insql",
            $params + ['courseid' => $courseid],
            '',
            'uuid, id'
        );
        $now = time();
        $updated = 0;
        foreach ($reviews as $item) {
            $cardid = $cards[(string) $item['flashcard_id']] ?? null;
            if ($cardid === null) {
                continue;
            }
            $review = $DB->get_record('local_nexusai_fc_reviews', ['flashcardid' => $cardid, 'userid' => $userid]);
            $isnew = !$review;
            if ($isnew) {
                $review = (object) [
                    'flashcardid' => $cardid,
                    'userid' => $userid,
                    'easefactor' => 2.5,
                    'intervaldays' => 0,
                    'repetitions' => 0,
                    'timecreated' => $now,
                ];
            }
            study_logic::sm2($review, !empty($item['knew_it']), $now);
            $review->timedeleted = null;
            $review->timemodified = $now;
            if ($isnew) {
                $DB->insert_record('local_nexusai_fc_reviews', $review);
            } else {
                $DB->update_record('local_nexusai_fc_reviews', $review);
            }
            $updated++;
        }
        return $updated;
    }
}
