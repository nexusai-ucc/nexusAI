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
 * Tests for the practice quiz external functions (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for quiz_generate, quiz_attempt_save, quiz_attempt_list,
 * quiz_errors_record, quiz_errors_list and quiz_flashcards_due.
 *
 * @covers \local_nexusai\external\quiz_generate
 * @covers \local_nexusai\external\quiz_attempt_save
 * @covers \local_nexusai\external\quiz_attempt_list
 * @covers \local_nexusai\external\quiz_errors_record
 * @covers \local_nexusai\external\quiz_errors_list
 * @covers \local_nexusai\external\quiz_flashcards_due
 */
final class quiz_functions_test extends external_testcase {
    /**
     * Criterion: a student gets the generated quiz; unknown type and
     * difficulty fall back to the defaults instead of failing.
     */
    public function test_generate_returns_the_questions(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'course_id' => (int) $data->course->id,
            'questions' => [[
                'id' => 'q-1',
                'question' => '¿Qué es una pila?',
                'options' => ['LIFO', 'FIFO'],
                'correct_index' => 0,
                'source_document_id' => 'doc-3',
            ]],
        ]);

        // Act.
        $result = $this->call(quiz_generate::class, [(int) $data->course->id, '', 50, 'crossword', 'impossible']);

        // Assert.
        $this->assertNull($result['topic']);
        $this->assertSame('q-1', $result['questions'][0]['id']);
        $this->assertSame('multiple_choice', $result['questions'][0]['question_type']);
        $this->assertSame('doc-3', $result['questions'][0]['source_document_id']);
    }

    /**
     * Criterion: a topic over 200 characters and an answer without questions
     * are both refused.
     */
    public function test_generate_rejects_a_long_topic_and_a_broken_answer(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $this->mock_backend(['course_id' => $courseid]);

        // Act and assert.
        $this->assert_call_fails('errortopictoolong', quiz_generate::class, [$courseid, str_repeat('t', 201)]);
        $this->assert_call_fails('errorbackend', quiz_generate::class, [$courseid, 'Pilas']);
    }

    /**
     * Criterion: a saved attempt shows up in the attempt list with its score
     * (correct / total), and out-of-range counts are clamped (boundary values).
     */
    public function test_saved_attempt_appears_in_the_list(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;

        // Act.
        $saved = $this->call(quiz_attempt_save::class, [$courseid, 'true_false', 'hard', 'Grafos', 4, 3]);
        $clamped = $this->call(quiz_attempt_save::class, [$courseid, 'unknown', 'odd', '', 50, 99]);
        $list = $this->call(quiz_attempt_list::class, [$courseid, 0, 0]);

        // Assert.
        $this->assertEqualsWithDelta(0.75, $saved['score'], 0.0001);
        $this->assertEqualsWithDelta(1.0, $clamped['score'], 0.0001);
        $this->assertSame(1, $list['total']);
        $this->assertCount(1, $list['items']);
    }

    /**
     * Criterion: errors recorded after a quiz come back in the error history,
     * at most 10 per call, with their options as strings.
     */
    public function test_recorded_errors_come_back_in_the_history(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $error = [
            'question_type' => 'multiple_choice',
            'question' => '¿Qué estructura es FIFO?',
            'explanation' => 'La cola.',
            'options' => ['Pila', 'Cola'],
            'correct_index' => 1,
            'user_selected_index' => 0,
        ];

        // Act.
        $stored = $this->call(quiz_errors_record::class, [$courseid, array_fill(0, 12, $error)]);
        $nothing = $this->call(quiz_errors_record::class, [$courseid, []]);
        $history = $this->call(quiz_errors_list::class, [$courseid, 999, 999, -5]);

        // Assert.
        $this->assertSame(10, $stored['stored']);
        $this->assertSame(0, $nothing['stored']);
        $this->assertSame(10, $history['total']);
        $this->assertSame(['Pila', 'Cola'], $history['items'][0]['options']);
        $this->assertSame(0, $history['items'][0]['user_selected_index']);
    }

    /**
     * Criterion: with no flashcards due the list is empty but well formed.
     */
    public function test_flashcards_due_is_empty_for_a_new_student(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act.
        $result = $this->call(quiz_flashcards_due::class, [(int) $data->course->id, '  ', 500]);

        // Assert.
        $this->assertSame((int) $data->course->id, $result['course_id']);
        $this->assertSame([], $result['questions']);
    }

    /**
     * Criterion: none of the quiz functions work in a course with NexusAI off.
     */
    public function test_quiz_functions_refuse_a_course_that_is_off(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $this->disable_course($courseid);

        // Act and assert.
        $this->assert_call_fails('coursedisabled', quiz_generate::class, [$courseid]);
        $this->assert_call_fails('coursedisabled', quiz_attempt_list::class, [$courseid]);
        $this->assert_call_fails('coursedisabled', quiz_errors_list::class, [$courseid]);
        $this->assert_call_fails('coursedisabled', quiz_flashcards_due::class, [$courseid]);
    }
}
