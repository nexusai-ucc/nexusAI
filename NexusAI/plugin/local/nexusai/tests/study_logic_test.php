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
 * Tests for the study rules ported from the backend (DATA-05, issue #525).
 *
 * Same cases as services/api/tests/test_quiz_router.py, so both give the same results.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\gap_store;
use local_nexusai\local\study_logic;

/**
 * Covers SM-2, the streak, the suggested difficulty and gap clustering.
 *
 * @covers \local_nexusai\local\study_logic
 * @covers \local_nexusai\local\gap_store
 */
final class study_logic_test extends \basic_testcase {
    /**
     * New card: 1 day, then 6, then interval times ease; a miss goes back to 1 day.
     */
    public function test_sm2_intervals_and_reset(): void {
        $now = 1000000;
        $r = (object) ['easefactor' => 2.5, 'intervaldays' => 0, 'repetitions' => 0];
        study_logic::sm2($r, true, $now);
        $this->assertSame(1, $r->intervaldays);
        $this->assertSame(1, $r->repetitions);
        $this->assertEqualsWithDelta(2.6, $r->easefactor, 0.0001);
        study_logic::sm2($r, true, $now);
        $this->assertSame(6, $r->intervaldays);
        study_logic::sm2($r, true, $now);
        $this->assertSame((int) round(6 * 2.7), $r->intervaldays);
        $this->assertSame($now + $r->intervaldays * DAYSECS, $r->timenextreview);

        study_logic::sm2($r, false, $now);
        $this->assertSame(0, $r->repetitions);
        $this->assertSame(1, $r->intervaldays);
        $this->assertEqualsWithDelta(2.48, $r->easefactor, 0.0001);
    }

    /**
     * The ease factor never goes below 1.3.
     */
    public function test_sm2_ease_floor(): void {
        $r = (object) ['easefactor' => 1.3, 'intervaldays' => 1, 'repetitions' => 0];
        study_logic::sm2($r, false, 0);
        $this->assertSame(1.3, $r->easefactor);
    }

    /**
     * Streak: consecutive days ending today or yesterday; older means broken.
     */
    public function test_streak(): void {
        $this->assertSame(0, study_logic::streak([], '2026-10-01'));
        $this->assertSame(3, study_logic::streak(['2026-09-29', '2026-09-30', '2026-10-01'], '2026-10-01'));
        $this->assertSame(2, study_logic::streak(['2026-09-29', '2026-09-30'], '2026-10-01'));
        $this->assertSame(0, study_logic::streak(['2026-09-28', '2026-09-29'], '2026-10-01'));
        $this->assertSame(1, study_logic::streak(['2026-09-27', '2026-10-01'], '2026-10-01'));
    }

    /**
     * Difficulty thresholds: 80% or more is hard, 40% or less is easy.
     */
    public function test_suggested_difficulty(): void {
        $this->assertNull(study_logic::suggested_difficulty([])['difficulty']);
        $this->assertSame('hard', study_logic::suggested_difficulty([0.8, 0.9])['difficulty']);
        $this->assertSame('easy', study_logic::suggested_difficulty([0.4])['difficulty']);
        $medium = study_logic::suggested_difficulty([0.5, 0.7]);
        $this->assertSame('medium', $medium['difficulty']);
        $this->assertSame(60, $medium['accuracy_pct']);
        $this->assertSame(2, $medium['based_on_attempts']);
        $this->assertStringContainsString('2 intentos (60% de aciertos)', $medium['reason']);
    }

    /**
     * Same text groups together; close embeddings merge; far ones do not.
     */
    public function test_gap_clustering(): void {
        $row = static fn($id, $q, $t, $emb, $arch = null) => (object) [
            'uuid' => $id, 'question' => $q, 'timecreated' => $t, 'maxsimilarity' => 0.2,
            'embedding' => $emb === null ? null : json_encode($emb), 'timearchived' => $arch,
        ];
        $groups = gap_store::cluster([
            $row('a', 'Qué es Bayes', 300, [1, 0]),
            $row('b', 'qué es bayes ', 200, null),
            $row('c', 'Explicame Bayes', 150, [0.99, 0.05]),
            $row('d', 'Cuándo es el parcial', 100, [0, 1], 50),
        ]);
        $this->assertCount(2, $groups);
        $this->assertSame(3, $groups[0]['count']);
        $this->assertSame('Qué es Bayes', $groups[0]['question']);
        $this->assertEqualsCanonicalizing(['a', 'b', 'c'], $groups[0]['question_ids']);
        $this->assertFalse($groups[0]['is_archived']);
        $this->assertTrue($groups[1]['is_archived']);
        $this->assertEqualsWithDelta(0.2, $groups[0]['avg_similarity'], 0.0001);
    }
}
