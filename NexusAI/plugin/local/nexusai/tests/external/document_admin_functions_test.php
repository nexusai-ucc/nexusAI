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
 * Tests for the document management, sections, FAQ and flashcard external
 * functions (TPC-05, #577).
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
 * Tests for document_status, document_preview, document_delete,
 * document_summarize, course_sections_list, get_pending_uploads,
 * analytics_faq_topics and the flashcard summary and review.
 *
 * @covers \local_nexusai\external\document_status
 * @covers \local_nexusai\external\document_preview
 * @covers \local_nexusai\external\document_delete
 * @covers \local_nexusai\external\document_summarize
 * @covers \local_nexusai\external\course_sections_list
 * @covers \local_nexusai\external\get_pending_uploads
 * @covers \local_nexusai\external\analytics_faq_topics
 * @covers \local_nexusai\external\quiz_flashcards_summary
 * @covers \local_nexusai\external\quiz_flashcards_review_batch
 */
final class document_admin_functions_test extends external_testcase {
    /**
     * Criterion: status and preview of a document of the course are returned.
     */
    public function test_status_and_preview_of_a_course_document(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $this->mock_backend(
            ['id' => 'doc-5', 'course_id' => $courseid, 'filename' => 'u5.pdf', 'status' => 'ready'],
            ['document_id' => 'doc-5', 'course_id' => $courseid, 'preview' => 'Unidad 5...', 'char_count' => 11]
        );

        // Act.
        $status = $this->call(document_status::class, [$courseid, 'doc-5']);
        $preview = $this->call(document_preview::class, [$courseid, 'doc-5']);

        // Assert.
        $this->assertSame('ready', $status['status']);
        $this->assertSame('Unidad 5...', $preview['preview']);
        $this->assertFalse($preview['truncated']);
    }

    /**
     * Criterion: status, preview and delete refuse a document of another course.
     */
    public function test_document_of_another_course_is_refused(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $other = ['id' => 'doc-x', 'document_id' => 'doc-x', 'course_id' => 999999];
        $this->mock_backend($other, $other, $other);

        // Act and assert.
        $this->assert_call_fails('errorbackend', document_status::class, [$courseid, 'doc-x']);
        $this->assert_call_fails('errorbackend', document_preview::class, [$courseid, 'doc-x']);
        $this->assert_call_fails('errorbackend', document_delete::class, [$courseid, 'doc-x']);
    }

    /**
     * Criterion: deleting a document of the course succeeds.
     */
    public function test_delete_a_course_document(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $this->mock_backend(['id' => 'doc-6', 'course_id' => $courseid], '');

        // Act.
        $result = $this->call(document_delete::class, [$courseid, 'doc-6']);

        // Assert.
        $this->assertTrue($result['success']);
    }

    /**
     * Criterion: a student gets the summary of a document; a blank id and an
     * incomplete answer are refused.
     */
    public function test_summarize_a_document(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $this->mock_backend(
            ['document_filename' => 'u1.pdf', 'summary' => 'Resumen de la unidad 1.', 'chunks_used' => 4, 'total_chunks' => 9],
            ['summary' => 'sin nombre de archivo']
        );

        // Act.
        $result = $this->call(document_summarize::class, ['doc-1', $courseid]);

        // Assert.
        $this->assertSame('doc-1', $result['document_id']);
        $this->assertSame(4, $result['chunks_used']);
        $this->assert_call_fails('errorbackend', document_summarize::class, ['doc-1', $courseid]);
        $this->assert_call_fails('errorinvalidparams', document_summarize::class, ['   ', $courseid]);
    }

    /**
     * Criterion: the course sections are listed with their names, starting at 0.
     */
    public function test_sections_are_listed(): void {
        // Arrange.
        $data = $this->setup_course();

        // Act.
        $result = $this->call(course_sections_list::class, [(int) $data->course->id]);

        // Assert.
        $this->assertNotEmpty($result);
        $this->assertSame(0, $result[0]['section']);
        $this->assertNotSame('', $result[0]['name']);
    }

    /**
     * Criterion: only the pending uploads of this course are returned.
     */
    public function test_pending_uploads_are_filtered_by_course(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        set_user_preference(\local_nexusai\observer::PENDING_PREF, json_encode([
            '11' => ['courseid' => $courseid, 'filename' => 'a.pdf', 'mimetype' => 'application/pdf'],
            '12' => ['courseid' => $courseid + 1, 'filename' => 'b.pdf', 'mimetype' => 'application/pdf'],
        ]));

        // Act.
        $result = $this->call(get_pending_uploads::class, [$courseid]);

        // Assert.
        $this->assertCount(1, $result);
        $this->assertSame(11, $result[0]['cmid']);
    }

    /**
     * Criterion: the FAQ topics keep their example questions as strings.
     */
    public function test_faq_topics_are_mapped(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $this->mock_backend([
            'total_questions' => 5,
            'topics' => [['topic' => 'Parcial', 'count' => 5, 'example_questions' => ['¿Cuándo es?', 7]]],
        ]);

        // Act.
        $result = $this->call(analytics_faq_topics::class, [(int) $data->course->id, 0]);

        // Assert.
        $this->assertSame(5, $result['total_questions']);
        $this->assertSame(1, $result['days']);
        $this->assertSame(['¿Cuándo es?', '7'], $result['topics'][0]['example_questions']);
    }

    /**
     * Criterion: with no flashcards the summary is zero and an empty review
     * updates nothing.
     */
    public function test_flashcards_without_cards(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;

        // Act.
        $summary = $this->call(quiz_flashcards_summary::class, [$courseid]);
        $review = $this->call(quiz_flashcards_review_batch::class, [$courseid, []]);
        $unknown = $this->call(quiz_flashcards_review_batch::class, [$courseid, [['flashcardid' => 'nope', 'knewit' => true]]]);

        // Assert.
        $this->assertSame(0, $summary['totalcount']);
        $this->assertSame(0, $review['updated']);
        $this->assertSame(0, $unknown['updated']);
    }
}
