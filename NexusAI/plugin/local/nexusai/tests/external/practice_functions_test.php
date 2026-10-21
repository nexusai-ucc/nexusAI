<?php
// This file is part of Moodle - https://moodle.org/
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
 * Tests for the practice helpers: evaluation, difficulty, streak, error
 * clearing, study plan dismissal and token budget (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

use local_nexusai\local\quiz_store;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for quiz_evaluate, quiz_suggest_difficulty, quiz_streak,
 * quiz_errors_clear, quiz_study_plan_dismiss and budget_status.
 *
 * @covers \local_nexusai\external\quiz_evaluate
 * @covers \local_nexusai\external\quiz_suggest_difficulty
 * @covers \local_nexusai\external\quiz_streak
 * @covers \local_nexusai\external\quiz_errors_clear
 * @covers \local_nexusai\external\quiz_study_plan_dismiss
 * @covers \local_nexusai\external\budget_status
 */
final class practice_functions_test extends external_testcase {
    /**
     * A wrong answer, in the shape quiz_store::record_errors() takes.
     *
     * @return array
     */
    private function wrong_answer(): array {
        return [
            'question_type' => 'multiple_choice',
            'question' => '¿Qué recorrido visita la raíz primero?',
            'explanation' => 'Preorden.',
            'source_filename' => null,
            'source_document_id' => null,
            'options' => ['Inorden', 'Preorden'],
            'correct_index' => 1,
            'user_selected_index' => 0,
            'user_answer' => null,
            'ai_feedback' => null,
            'ai_score' => null,
        ];
    }

    /**
     * Criterion: an open answer is graded by the backend and its verdict mapped.
     */
    public function test_evaluate_returns_the_verdict(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend(['correct' => true, 'score' => 0.8, 'feedback' => 'Bien, faltó un ejemplo.']);

        // Act.
        $result = $this->call(quiz_evaluate::class, [
            (int) $data->course->id,
            'Definí recursión.',
            'Una función que se llama a sí misma.',
            'Es cuando una función se invoca a sí misma.',
        ]);

        // Assert.
        $this->assertTrue($result['correct']);
        $this->assertEqualsWithDelta(0.8, $result['score'], 0.001);
        $this->assertSame('Bien, faltó un ejemplo.', $result['feedback']);
    }

    /**
     * Criterion: after practising today the streak is 1 and the difficulty
     * suggestion is based on that attempt.
     */
    public function test_streak_and_difficulty_follow_the_attempts(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        quiz_store::save_attempt($courseid, (int) $data->user->id, 'multiple_choice', 'medium', null, 5, 5);

        // Act.
        $streak = $this->call(quiz_streak::class, [$courseid]);
        $difficulty = $this->call(quiz_suggest_difficulty::class, [$courseid, '  ']);

        // Assert.
        $this->assertSame(1, $streak['currentstreak']);
        $this->assertTrue($streak['practicedtoday']);
        $this->assertSame(1, $difficulty['basedonattempts']);
    }

    /**
     * Criterion: a new student has no streak and no difficulty suggestion yet.
     */
    public function test_new_student_has_no_streak(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act.
        $streak = $this->call(quiz_streak::class, [(int) $data->course->id]);
        $difficulty = $this->call(quiz_suggest_difficulty::class, [(int) $data->course->id]);

        // Assert.
        $this->assertSame(0, $streak['currentstreak']);
        $this->assertFalse($streak['practicedtoday']);
        $this->assertSame(0, $difficulty['basedonattempts']);
    }

    /**
     * Criterion: clearing the error history deletes exactly the user's errors.
     */
    public function test_clear_errors_deletes_the_history(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        quiz_store::record_errors($courseid, (int) $data->user->id, [$this->wrong_answer(), $this->wrong_answer()]);

        // Act.
        $result = $this->call(quiz_errors_clear::class, [$courseid]);

        // Assert.
        $this->assertSame(2, $result['deleted']);
        $this->assertSame(0, quiz_store::list_errors($courseid, (int) $data->user->id, 30, 10, 0)['total']);
    }

    /**
     * Criterion: dismissing study plan items marks the given errors; an empty
     * request is invalid.
     */
    public function test_dismiss_study_plan_marks_the_errors(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        quiz_store::record_errors($courseid, (int) $data->user->id, [$this->wrong_answer()]);
        $errorid = quiz_store::list_errors($courseid, (int) $data->user->id, 30, 10, 0)['items'][0]['id'];

        // Act.
        $result = $this->call(quiz_study_plan_dismiss::class, [$courseid, [$errorid], []]);

        // Assert.
        $this->assertSame(1, $result['affected']);
        $this->assert_call_fails('errorinvalidparams', quiz_study_plan_dismiss::class, [$courseid, [], []]);
    }

    /**
     * Criterion: the budget reports both windows and the role, teacher or student.
     */
    public function test_budget_status_reports_both_windows(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');

        // Act.
        $result = $this->call(budget_status::class, [(int) $data->course->id]);

        // Assert.
        $this->assertSame('teacher', $result['role']);
        $this->assertArrayHasKey('hourly', $result);
        $this->assertSame(0, $result['daily']['used']);
        $this->assertGreaterThanOrEqual(0, $result['daily']['questionsleft']);
    }
}
