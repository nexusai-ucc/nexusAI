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
 * Tests for the document external functions (TPC-05, #577).
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
 * Tests for document_upload, document_reindex and document_pre_exam_summary.
 *
 * @covers \local_nexusai\external\document_upload
 * @covers \local_nexusai\external\document_reindex
 * @covers \local_nexusai\external\document_pre_exam_summary
 */
final class document_functions_test extends external_testcase {
    /**
     * Criterion: a teacher uploads a PDF, it becomes a course activity and the
     * backend's answer comes back with the new cmid.
     */
    public function test_upload_creates_the_activity_and_returns_the_document(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $sink = $this->redirectMessages();
        $courseid = (int) $data->course->id;
        $this->mock_backend([
            'id' => 'doc-10',
            'course_id' => $courseid,
            'uploader_id' => (int) $data->user->id,
            'filename' => 'apunte.pdf',
            'mime_type' => 'application/pdf',
            'section' => 1,
            'status' => 'pending',
        ]);

        // Act.
        $result = $this->call(document_upload::class, [
            $courseid,
            'apunte.pdf',
            'application/pdf',
            base64_encode("%PDF-1.4\nunidad 1"),
            1,
        ]);

        // Assert.
        $this->assertSame('doc-10', $result['id']);
        $this->assertSame('pending', $result['status']);
        $this->assertGreaterThan(0, $result['cmid']);
        $this->assertTrue(get_coursemodule_from_id('', $result['cmid'], $courseid) !== false);
        $sink->close();
    }

    /**
     * Criterion: if the backend answer is incomplete, the activity just created
     * is removed again (no orphan material in the course).
     */
    public function test_upload_removes_the_activity_when_the_backend_fails(): void {
        global $DB;
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $before = $DB->count_records('course_modules', ['course' => $courseid]);
        $this->mock_backend(['detail' => 'error']);

        // Act.
        $this->assert_call_fails('errorbackend', document_upload::class, [
            $courseid,
            'apunte.pdf',
            'application/pdf',
            base64_encode('%PDF-1.4 x'),
            1,
        ]);

        // Assert.
        $this->assertSame($before, $DB->count_records('course_modules', ['course' => $courseid]));
    }

    /**
     * Criterion (equivalence classes of the file): unsupported type, content
     * that does not match the type and empty content are rejected.
     */
    public function test_upload_rejects_invalid_files(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;

        // Act and assert.
        $this->assert_call_fails('errorunsupportedfiletype', document_upload::class, [
            $courseid, 'virus.exe', 'application/x-msdownload', base64_encode('MZ'),
        ]);
        $this->assert_call_fails('errorfilecontent', document_upload::class, [
            $courseid, 'falso.pdf', 'application/pdf', base64_encode('no soy un pdf'),
        ]);
        $this->assert_call_fails('errorfilecontent', document_upload::class, [
            $courseid, 'falso.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            base64_encode('texto'),
        ]);
        $this->assert_call_fails('errorinvalidparams', document_upload::class, [
            $courseid, 'vacio.txt', 'text/plain', '',
        ]);
    }

    /**
     * Criterion: a student cannot upload material (local/nexusai:manage).
     */
    public function test_student_cannot_upload(): void {
        // Arrange.
        $data = $this->setup_course('student');

        // Act and assert.
        $this->assert_call_fails('nopermissions', document_upload::class, [
            (int) $data->course->id, 'a.txt', 'text/plain', base64_encode('hola'),
        ]);
    }

    /**
     * Criterion: reindexing a document of the course returns its new state.
     */
    public function test_reindex_returns_the_document(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $courseid = (int) $data->course->id;
        $this->mock_backend(
            ['id' => 'doc-1', 'course_id' => $courseid],
            ['id' => 'doc-1', 'course_id' => $courseid, 'filename' => 'u1.pdf', 'status' => 'processing']
        );

        // Act.
        $result = $this->call(document_reindex::class, [$courseid, 'doc-1']);

        // Assert.
        $this->assertSame('processing', $result['status']);
        $this->assertSame('u1.pdf', $result['filename']);
        $this->assertNull($result['created_at']);
    }

    /**
     * Criterion: a document of another course cannot be reindexed from this one.
     */
    public function test_reindex_refuses_a_document_of_another_course(): void {
        // Arrange.
        $data = $this->setup_course('editingteacher');
        $this->mock_backend(['id' => 'doc-1', 'course_id' => 999999]);

        // Act and assert.
        $this->assert_call_fails('errorbackend', document_reindex::class, [(int) $data->course->id, 'doc-1']);
    }

    /**
     * Criterion: the pre-exam summary maps the documents it was built from.
     */
    public function test_pre_exam_summary_maps_the_documents_used(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'summary' => 'Repaso de la unidad 2.',
            'documents_used' => [['document_id' => 'doc-2', 'filename' => 'u2.pdf']],
            'total_documents' => 3,
        ]);

        // Act.
        $result = $this->call(document_pre_exam_summary::class, [(int) $data->course->id, 2]);

        // Assert.
        $this->assertSame('Repaso de la unidad 2.', $result['summary']);
        $this->assertSame('u2.pdf', $result['documents_used'][0]['filename']);
        $this->assertSame(3, $result['total_documents']);
    }
}
