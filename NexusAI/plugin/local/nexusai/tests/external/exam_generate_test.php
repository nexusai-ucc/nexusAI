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
 * Tests for the teacher exam generator external function (TPC-05, #577).
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
 * Tests for exam_generate.
 *
 * @covers \local_nexusai\external\exam_generate
 */
final class exam_generate_test extends external_testcase {
    /**
     * Criterion: a teacher gets the generated questions mapped, with an empty
     * source topic turned into null.
     */
    public function test_teacher_gets_the_generated_questions(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $this->mock_backend([
            'course_id' => (int) $data->course->id,
            'topic' => 'Sorting',
            'questions' => [
                [
                    'question_type' => 'multiple_choice',
                    'question' => 'Which sort is stable?',
                    'options' => ['Merge sort', 'Heap sort'],
                    'correct_index' => 0,
                    'explanation' => 'Merge sort keeps the order of equal keys.',
                    'source_filename' => 'sorting.pdf',
                    'source_document_id' => 'doc-9',
                    'source_topic' => '',
                ],
                ['question_type' => 'open', 'question' => 'Explain quicksort.', 'source_topic' => 'Quicksort'],
            ],
        ]);

        // Act.
        $result = $this->call(exam_generate::class, [
            'courseid' => (int) $data->course->id,
            'documentids' => ['doc-9'],
            'topic' => '  Sorting ',
            'numquestions' => 99,
            'questiontype' => 'essay',
            'difficulty' => 'extreme',
            'topics' => [
                ['label' => 'Stability', 'source' => 'gap'],
                ['label' => '   ', 'source' => 'faq'],
                ['label' => 'Pivots', 'source' => 'other'],
            ],
        ]);

        // Assert.
        $this->assertSame('Sorting', $result['topic']);
        $this->assertCount(2, $result['questions']);
        $this->assertSame(['Merge sort', 'Heap sort'], $result['questions'][0]['options']);
        $this->assertNull($result['questions'][0]['source_topic']);
        $this->assertSame('Quicksort', $result['questions'][1]['source_topic']);
        $this->assertSame(-1, $result['questions'][1]['correct_index']);
    }

    /**
     * Criterion: without documents, or with a topic over 200 characters, the
     * request is refused before reaching the backend.
     */
    public function test_rejects_missing_documents_and_a_long_topic(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;

        // Act and assert.
        $this->assert_call_fails('errornodocuments', exam_generate::class, [$courseid, []]);
        $this->assert_call_fails('errortopictoolong', exam_generate::class, [$courseid, ['doc-1'], str_repeat('x', 201)]);
    }

    /**
     * Criterion: an answer without a questions list is a backend error.
     */
    public function test_rejects_an_answer_without_questions(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $this->mock_backend(['course_id' => (int) $data->course->id]);

        // Act and assert.
        $this->assert_call_fails('errorbackend', exam_generate::class, [(int) $data->course->id, ['doc-1']]);
    }

    /**
     * Criterion: a student cannot generate exams (local/nexusai:manage).
     */
    public function test_student_cannot_generate_exams(): void {
        // Arrange.
        $data = $this->setup_course('student');

        // Act and assert.
        $this->assert_call_fails('nopermissions', exam_generate::class, [(int) $data->course->id, ['doc-1']]);
    }
}
