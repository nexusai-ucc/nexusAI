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
 * The teacher's course dashboard and the questions of a period (DATA-05).
 *
 * Ported from services/api/app/admin/router.py (get_course_analytics) and
 * analytics/service.py. Questions are grouped by normalised text in PHP, which
 * works the same on every database Moodle supports.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Course metrics computed from the plugin tables.
 */
class course_analytics {
    /** @var int Most frequent questions shown in the dashboard. */
    const TOP_QUERIES = 10;

    /** @var int Most questions read to group a period. */
    const MAX_QUESTIONS = 10000;

    /** @var string[] Score ranges of the quiz histogram. */
    const SCORE_BUCKETS = ['0-20', '20-40', '40-60', '60-80', '80-100'];

    /** @var float[] Bounds of the ranges above. */
    const SCORE_BOUNDS = [0.0, 0.2, 0.4, 0.6, 0.8, 1.01];

    /**
     * Questions asked in the course since a time, grouped by normalised text, most asked first.
     *
     * @param int $courseid Course.
     * @param int $since Unix time.
     * @return array[] [{question, count}] with the normalised text.
     */
    public static function question_counts(int $courseid, int $since): array {
        global $DB;
        $rows = $DB->get_recordset_sql(
            "SELECT m.id, m.content
               FROM {local_nexusai_interactions} i
               JOIN {local_nexusai_messages} m ON m.id = i.messageid
              WHERE i.courseid = :courseid AND i.timecreated >= :since AND m.role = :role
           ORDER BY i.timecreated DESC",
            ['courseid' => $courseid, 'since' => $since, 'role' => 'user'],
            0,
            self::MAX_QUESTIONS
        );
        $counts = [];
        foreach ($rows as $row) {
            $key = store_util::normalise((string) $row->content);
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
        $rows->close();
        arsort($counts);
        $out = [];
        foreach ($counts as $question => $count) {
            $out[] = ['question' => (string) $question, 'count' => $count];
        }
        return $out;
    }

    /**
     * The dashboard, in the format of the analytics_dashboard web service.
     *
     * @param int $courseid Course.
     * @param int $days Days back.
     * @return array
     */
    public static function dashboard(int $courseid, int $days): array {
        global $DB;
        $since = time() - $days * DAYSECS;
        $params = ['courseid' => $courseid, 'since' => $since];

        $questions = self::question_counts($courseid, $since);

        $day = 'timecreated - ' . $DB->sql_modulo('timecreated', DAYSECS);
        $daily = $DB->get_records_sql(
            "SELECT $day AS daystart, COUNT(1) AS total
               FROM {local_nexusai_interactions}
              WHERE courseid = :courseid AND timecreated >= :since
           GROUP BY $day
           ORDER BY $day",
            $params
        );

        $bucketsql = [];
        foreach (self::SCORE_BUCKETS as $i => $unused) {
            $bucketsql[] = "SUM(CASE WHEN score >= :lo$i AND score < :hi$i THEN 1 ELSE 0 END) AS bucket$i";
            $params["lo$i"] = self::SCORE_BOUNDS[$i];
            $params["hi$i"] = self::SCORE_BOUNDS[$i + 1];
        }
        $quiz = $DB->get_record_sql(
            'SELECT COUNT(1) AS total, AVG(score) AS avgscore, ' . implode(', ', $bucketsql) . '
               FROM {local_nexusai_quiz_attempts}
              WHERE courseid = :courseid AND timecreated >= :since',
            $params
        );
        $total = (int) $quiz->total;

        $base = ['courseid' => $courseid, 'since' => $since];
        $where = 'courseid = :courseid AND timecreated >= :since';
        $gaps = $DB->count_records_select('local_nexusai_gaps', $where, $base);
        $answered = $DB->count_records_select('local_nexusai_interactions', $where, $base);
        $rated = $DB->count_records_select('local_nexusai_msg_feedback', $where, $base);
        $helpful = $DB->count_records_select('local_nexusai_msg_feedback', "$where AND ishelpful = 1", $base);

        return [
            'course_id' => $courseid,
            'period_days' => $days,
            'top_queries' => array_slice($questions, 0, self::TOP_QUERIES),
            'daily_message_counts' => array_values(array_map(static fn($d) => [
                'date' => gmdate('Y-m-d', (int) $d->daystart),
                'message_count' => (int) $d->total,
            ], $daily)),
            'quiz_score_distribution' => [
                'total_attempts' => $total,
                'average_score' => $total ? round((float) $quiz->avgscore, 4) : 0.0,
                'buckets' => array_map(static fn($i, $range) => [
                    'range' => $range,
                    'count' => (int) ($quiz->{"bucket$i"} ?? 0),
                ], array_keys(self::SCORE_BUCKETS), self::SCORE_BUCKETS),
            ],
            'gaps_ratio' => [
                'gaps_detected' => $gaps,
                'questions_answered' => $answered,
                'ratio' => $answered ? round($gaps / $answered, 4) : 0.0,
            ],
            'feedback_ratio' => [
                'helpful_count' => $helpful,
                'total_rated' => $rated,
                'useful_pct' => $rated ? round($helpful / $rated * 100, 1) : 0.0,
            ],
            'topics_consulted' => count($questions),
        ];
    }
}
