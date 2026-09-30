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
 * Questions the course material could not answer, grouped for the teacher (DATA-05).
 *
 * Ported from services/api/app/gaps/router.py: first an exact grouping by
 * normalised text, then groups whose question embeddings are close enough
 * (cosine >= 0.75) are merged, over at most 2,000 rows. The embedding comes from
 * the backend when the gap is detected and is stored as JSON text.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Reads, groups and archives unanswered questions.
 */
class gap_store {
    /** @var float Cosine similarity from which two groups are the same gap. */
    const SIMILARITY_THRESHOLD = 0.75;

    /** @var int Most rows grouped at once. */
    const MAX_ROWS = 2000;

    /**
     * Cosine similarity of two vectors; 0 when either is empty.
     *
     * @param float[] $a Vector.
     * @param float[] $b Vector.
     * @return float
     */
    public static function cosine(array $a, array $b): float {
        $dot = 0.0;
        $na = 0.0;
        $nb = 0.0;
        $n = min(count($a), count($b));
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }
        if ($na == 0.0 || $nb == 0.0) {
            return 0.0;
        }
        return $dot / (sqrt($na) * sqrt($nb));
    }

    /**
     * Groups gap rows, newest first, into the list the teacher sees.
     *
     * @param \stdClass[] $rows Rows with uuid, question, timecreated, maxsimilarity, embedding, timearchived; newest first.
     * @return array[] Groups: question, count, last_asked_at, avg_similarity, question_ids, is_archived; most asked first.
     */
    public static function cluster(array $rows): array {
        $groups = [];
        foreach ($rows as $row) {
            $key = store_util::normalise($row->question);
            $embedding = !empty($row->embedding) ? json_decode($row->embedding, true) : null;
            $archived = $row->timearchived !== null;
            if (!isset($groups[$key])) {
                $groups[$key] = [
                    'question' => $row->question,
                    'count' => 0,
                    'last' => (int) $row->timecreated,
                    'sims' => [],
                    'embedding' => is_array($embedding) ? $embedding : null,
                    'ids' => [],
                    'allarchived' => true,
                ];
            }
            $g = &$groups[$key];
            $g['count']++;
            if ((int) $row->timecreated > $g['last']) {
                $g['last'] = (int) $row->timecreated;
                $g['question'] = $row->question;
            }
            if ($row->maxsimilarity !== null) {
                $g['sims'][] = (float) $row->maxsimilarity;
            }
            if ($g['embedding'] === null && is_array($embedding)) {
                $g['embedding'] = $embedding;
            }
            $g['ids'][] = $row->uuid;
            $g['allarchived'] = $g['allarchived'] && $archived;
            unset($g);
        }

        $merged = [];
        foreach ($groups as $group) {
            $best = null;
            if ($group['embedding'] !== null) {
                $bestsim = -1.0;
                foreach ($merged as $i => $existing) {
                    if ($existing['embedding'] === null) {
                        continue;
                    }
                    $sim = self::cosine($group['embedding'], $existing['embedding']);
                    if ($sim > $bestsim) {
                        $bestsim = $sim;
                        $best = $i;
                    }
                }
                if ($best !== null && $bestsim < self::SIMILARITY_THRESHOLD) {
                    $best = null;
                }
            }
            if ($best === null) {
                $merged[] = $group;
                continue;
            }
            $target = &$merged[$best];
            $target['count'] += $group['count'];
            if ($group['last'] > $target['last']) {
                $target['last'] = $group['last'];
                $target['question'] = $group['question'];
            }
            $target['sims'] = array_merge($target['sims'], $group['sims']);
            if ($target['embedding'] === null) {
                $target['embedding'] = $group['embedding'];
            }
            $target['ids'] = array_merge($target['ids'], $group['ids']);
            $target['allarchived'] = $target['allarchived'] && $group['allarchived'];
            unset($target);
        }

        usort($merged, static fn($x, $y) => [$y['count'], $y['last']] <=> [$x['count'], $x['last']]);
        return array_map(static fn($g) => [
            'question' => $g['question'],
            'count' => $g['count'],
            'last_asked_at' => store_util::iso($g['last']),
            'avg_similarity' => $g['sims'] ? array_sum($g['sims']) / count($g['sims']) : null,
            'question_ids' => $g['ids'],
            'is_archived' => $g['allarchived'],
        ], $merged);
    }

    /**
     * The course's gaps in the last days, grouped, one page.
     *
     * @param int $courseid Course.
     * @param int $days Days back.
     * @param int $limit Page size.
     * @param int $offset Page start.
     * @param bool $includearchived Also archived gaps.
     * @return array In the format of the gaps_list web service.
     */
    public static function list(int $courseid, int $days, int $limit, int $offset, bool $includearchived): array {
        global $DB;
        $where = 'courseid = :courseid AND timecreated >= :since';
        if (!$includearchived) {
            $where .= ' AND timearchived IS NULL';
        }
        $rows = $DB->get_records_select(
            'local_nexusai_gaps',
            $where,
            ['courseid' => $courseid, 'since' => time() - $days * DAYSECS],
            'timecreated DESC, id DESC',
            'id, uuid, question, timecreated, maxsimilarity, embedding, timearchived',
            0,
            self::MAX_ROWS
        );
        $groups = self::cluster(array_values($rows));
        return [
            'course_id' => $courseid,
            'days' => $days,
            'total' => count($groups),
            'items' => array_slice($groups, $offset, $limit),
        ];
    }

    /**
     * Archives or unarchives the rows of a gap for the teacher.
     *
     * @param int $courseid Course.
     * @param string[] $uuids Rows of the gap.
     * @param bool $archived New state.
     * @return int Rows affected.
     */
    public static function archive(int $courseid, array $uuids, bool $archived): int {
        global $DB;
        if (empty($uuids)) {
            return 0;
        }
        [$insql, $params] = $DB->get_in_or_equal(array_values($uuids), SQL_PARAMS_NAMED);
        $params['courseid'] = $courseid;
        $where = "courseid = :courseid AND uuid $insql";
        $affected = $DB->count_records_select('local_nexusai_gaps', $where, $params);
        $DB->set_field_select('local_nexusai_gaps', 'timearchived', $archived ? time() : null, $where, $params);
        return $affected;
    }
}
