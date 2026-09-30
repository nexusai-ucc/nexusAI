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
 * Study rules ported from the backend (DATA-05): SM-2, study streak and suggested difficulty.
 *
 * Same numbers and thresholds as services/api/app/quiz/router.py
 * (_apply_sm2, _compute_streak, suggest_difficulty), so a student sees the same
 * behaviour after the data moves to Moodle.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Pure functions, without database access, so they can be tested alone.
 */
class study_logic {
    /** @var float Average score from which the suggested difficulty is hard. */
    const HARD_THRESHOLD = 0.8;

    /** @var float Average score up to which the suggested difficulty is easy. */
    const EASY_THRESHOLD = 0.4;

    /**
     * Simplified SM-2 (the algorithm behind Anki) for a two-button self-assessment.
     *
     * "Knew it" counts as quality 5 and "did not know" as 2, so one miss does not
     * ruin the ease factor. A miss sends the card back to a short interval.
     *
     * @param \stdClass $review Review state: easefactor, intervaldays, repetitions.
     * @param bool $knewit Whether the student knew the answer.
     * @param int $now Unix time of the review.
     * @return \stdClass The same object, updated, with timelastreviewed and timenextreview.
     */
    public static function sm2(\stdClass $review, bool $knewit, int $now): \stdClass {
        $quality = $knewit ? 5 : 2;
        if ($knewit) {
            if ((int) $review->repetitions === 0) {
                $review->intervaldays = 1;
            } else if ((int) $review->repetitions === 1) {
                $review->intervaldays = 6;
            } else {
                $review->intervaldays = max(1, (int) round($review->intervaldays * $review->easefactor));
            }
            $review->repetitions = (int) $review->repetitions + 1;
        } else {
            $review->repetitions = 0;
            $review->intervaldays = 1;
        }
        $ease = (float) $review->easefactor + (0.1 - (5 - $quality) * (0.08 + (5 - $quality) * 0.02));
        $review->easefactor = max(1.3, round($ease, 4));
        $review->timelastreviewed = $now;
        $review->timenextreview = $now + (int) $review->intervaldays * DAYSECS;
        return $review;
    }

    /**
     * Consecutive days with activity that end today or yesterday.
     *
     * A day with no activity breaks the streak; the student may not have
     * practised yet today and still keep yesterday's streak.
     *
     * @param string[] $activedays Active days as Y-m-d (UTC).
     * @param string $today Today as Y-m-d (UTC).
     * @return int
     */
    public static function streak(array $activedays, string $today): int {
        if (empty($activedays)) {
            return 0;
        }
        $days = array_flip($activedays);
        $latest = max($activedays);
        $gap = (strtotime($today . ' UTC') - strtotime($latest . ' UTC')) / DAYSECS;
        if ($gap > 1) {
            return 0;
        }
        $streak = 0;
        $cursor = strtotime($latest . ' UTC');
        while (isset($days[gmdate('Y-m-d', $cursor)])) {
            $streak++;
            $cursor -= DAYSECS;
        }
        return $streak;
    }

    /**
     * Difficulty to suggest from the scores of the latest attempts.
     *
     * @param float[] $scores Scores 0..1 of the latest attempts.
     * @return array{difficulty:?string, reason:?string, based_on_attempts:int, accuracy_pct:?int}
     */
    public static function suggested_difficulty(array $scores): array {
        if (empty($scores)) {
            return ['difficulty' => null, 'reason' => null, 'based_on_attempts' => 0, 'accuracy_pct' => null];
        }
        $average = array_sum($scores) / count($scores);
        if ($average >= self::HARD_THRESHOLD) {
            $difficulty = 'hard';
        } else if ($average <= self::EASY_THRESHOLD) {
            $difficulty = 'easy';
        } else {
            $difficulty = 'medium';
        }
        $pct = (int) round($average * 100);
        $label = ['easy' => 'fácil', 'medium' => 'media', 'hard' => 'difícil'][$difficulty];
        $count = count($scores);
        // The backend always wrote the reason in Spanish; the frontend builds the
        // English text from accuracy_pct, so it is kept as it was.
        $reason = "Basado en tus últimos {$count} intento" . ($count !== 1 ? 's' : '')
            . " ({$pct}% de aciertos), te sugerimos dificultad {$label}.";
        return ['difficulty' => $difficulty, 'reason' => $reason, 'based_on_attempts' => $count, 'accuracy_pct' => $pct];
    }
}
