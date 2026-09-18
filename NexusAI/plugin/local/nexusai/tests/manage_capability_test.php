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
 * Enforcement of `local/nexusai:manage` on the external functions that
 * still had no test (QA-02, issue #312).
 *
 * Of the 47 external functions registered in db/services.php, 43 had no
 * test at all before this file — none of the 5 pre-existing tests invoke
 * execute() end-to-end or mock backend_client (it's not mockable/injectable:
 * `new backend_client()` is hardcoded inline in every class, with no
 * factory or service locator — refactoring that is a much bigger change
 * than this issue).
 *
 * What IS 100% testable without touching backend_client, because it runs
 * BEFORE it in execute(): validate_parameters(), validate_context() and
 * require_capability(). This file covers exactly that — that a student
 * (without :manage) can't invoke any of the teacher-reserved functions —
 * which is what the issue asks to prioritize first ("capability enforcement").
 *
 * dismiss_pending_upload is the only `:manage`-adjacent function
 * deliberately excluded from the list below: it has no courseid or
 * capability check — it only operates on the caller's own user preference
 * (see the comment in that file), so the corresponding test (further down)
 * confirms the opposite: that ANY logged-in user can call it without
 * exception, and that it's scoped per user.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Enforcement of local/nexusai:manage on external functions that still had no test (QA-02, #312).
 *
 * @covers \local_nexusai\external\exam_generate
 * @covers \local_nexusai\external\analytics_dashboard
 * @covers \local_nexusai\external\analytics_faq_topics
 * @covers \local_nexusai\external\gaps_list
 * @covers \local_nexusai\external\gaps_archive
 * @covers \local_nexusai\external\document_upload
 * @covers \local_nexusai\external\document_status
 * @covers \local_nexusai\external\document_delete
 * @covers \local_nexusai\external\document_preview
 * @covers \local_nexusai\external\document_replace
 * @covers \local_nexusai\external\get_pending_uploads
 * @covers \local_nexusai\external\confirm_pending_upload
 * @covers \local_nexusai\external\dismiss_pending_upload
 * @runTestsInSeparateProcesses
 */
final class manage_capability_test extends \advanced_testcase {
    /**
     * Course + enrolled student (student role, WITHOUT local/nexusai:manage).
     *
     * @return array{0: \stdClass, 1: \stdClass} [$course, $student]
     */
    private function create_student_in_course(): array {
        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');
        $this->setUser($student);
        return [$course, $student];
    }

    /**
     * Course + enrolled teacher (editingteacher role, WITH local/nexusai:manage).
     *
     * @return array{0: \stdClass, 1: \stdClass} [$course, $teacher]
     */
    private function create_teacher_in_course(): array {
        $course = $this->getDataGenerator()->create_course();
        $teacher = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($teacher->id, $course->id, 'editingteacher');
        $this->setUser($teacher);
        return [$course, $teacher];
    }

    // One test per :manage class with no prior coverage.

    public function test_exam_generate_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\exam_generate::execute($course->id, ['00000000-0000-0000-0000-000000000001']);
    }

    /**
     * exam_generate validates "at least one document" BEFORE reaching
     * backend_client (line ~98 of exam_generate.php) — 100% testable
     * without mocking anything, as long as the user DOES have :manage (if
     * not, require_capability throws first — see the test above).
     */
    public function test_exam_generate_rejects_empty_document_ids_before_reaching_backend(): void {
        $this->resetAfterTest();
        [$course] = $this->create_teacher_in_course();

        $this->expectException(\invalid_parameter_exception::class);
        \local_nexusai\external\exam_generate::execute($course->id, []);
    }

    public function test_analytics_dashboard_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\analytics_dashboard::execute($course->id);
    }

    public function test_analytics_faq_topics_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\analytics_faq_topics::execute($course->id);
    }

    public function test_gaps_list_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\gaps_list::execute($course->id);
    }

    public function test_gaps_archive_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\gaps_archive::execute($course->id, [], true);
    }

    public function test_document_upload_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_upload::execute($course->id, 'a.pdf', 'application/pdf', '');
    }

    public function test_document_status_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_status::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_delete_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_delete::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_preview_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_preview::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_replace_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_replace::execute(
            $course->id,
            '00000000-0000-0000-0000-000000000001',
            'a.pdf',
            'application/pdf',
            ''
        );
    }

    public function test_get_pending_uploads_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\get_pending_uploads::execute($course->id);
    }

    public function test_confirm_pending_upload_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\confirm_pending_upload::execute($course->id, 1);
    }

    // The dismiss_pending_upload function is deliberately designed with no capability check.

    /**
     * Confirms the design documented in dismiss_pending_upload.php: it
     * operates solely on the LOGGED-IN user's preference (the current
     * $USER, never a parameter), so (a) it requires no specific capability
     * — any logged-in student can call it without exception — and (b)
     * it's scoped per user: two students with "pending" entries under the
     * same cmid don't step on each other.
     */
    public function test_dismiss_pending_upload_does_not_require_manage_and_is_scoped_per_user(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $owner = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($owner->id, $course->id, 'student');
        $this->getDataGenerator()->enrol_user($other->id, $course->id, 'student');

        $pending = json_encode([
            '55' => [
                'courseid'   => $course->id,
                'filename'   => 'a.pdf',
                'mimetype'   => 'application/pdf',
                'context_id' => 1,
            ],
        ]);
        set_user_preference(\local_nexusai\observer::PENDING_PREF, $pending, $owner->id);

        // The "other" user has no special role and calls dismiss for the
        // SAME cmid "owner" has pending — it shouldn't throw any capability
        // exception (or any exception at all).
        $this->setUser($other);
        $result = \local_nexusai\external\dismiss_pending_upload::execute(55);
        $this->assertTrue($result['success']);

        // "owner"'s preference wasn't touched — dismiss_pending_upload only
        // operates on the logged-in user's preference (the current $USER),
        // never on another user's even if they share the same cmid.
        $ownerpref = json_decode(
            get_user_preferences(\local_nexusai\observer::PENDING_PREF, '{}', $owner->id),
            true
        );
        $this->assertArrayHasKey(
            '55',
            $ownerpref,
            'dismiss_pending_upload must not affect another user\'s preference'
        );
    }
}
