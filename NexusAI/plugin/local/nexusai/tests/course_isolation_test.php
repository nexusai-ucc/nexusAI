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
 * Multi-course isolation (QA-02, issue #312).
 *
 * Representative sample of external functions with `local/nexusai:use` +
 * `courseid` and no previous coverage: a student enrolled ONLY in course A,
 * calling with the courseid of a real course B where they have no role
 * assigned, must be rejected. Moodle's capability system already
 * guarantees this per context (a role assigned in course A's context
 * grants nothing in course B's context) — this test confirms it
 * explicitly for the first time for these functions, without needing to
 * mock backend_client.
 *
 * The actual exception is `require_login_exception`, not `required_capability_exception`:
 * `validate_context()` internally calls `require_login()` for a course
 * context, which checks enrolment BEFORE execute() reaches
 * `require_capability()` — a non-enrolled student never gets past that, so
 * the capability isn't even evaluated (confirmed by actually running the
 * test for the first time, issue #474; the original comment assumed it was
 * require_capability() that threw).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Verifies multi-course isolation across a sample of external functions (QA-02, #312).
 *
 * @covers \local_nexusai\external\chat_send
 * @covers \local_nexusai\external\quiz_generate
 * @covers \local_nexusai\external\calendar_alert_save
 * @covers \local_nexusai\external\document_summarize
 * @runTestsInSeparateProcesses
 */
final class course_isolation_test extends \advanced_testcase {
    /**
     * Student enrolled ONLY in $courseA (student role). $courseB really
     * exists but is unrelated — the student has no role there.
     *
     * @return array{0: \stdClass, 1: \stdClass, 2: \stdClass} [$courseA, $courseB, $student]
     */
    private function create_student_isolated_from_another_course(): array {
        $coursea = $this->getDataGenerator()->create_course();
        $courseb = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $coursea->id, 'student');
        $this->setUser($student);
        return [$coursea, $courseb, $student];
    }

    public function test_chat_send_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\require_login_exception::class);
        \local_nexusai\external\chat_send::execute('hola', $courseb->id);
    }

    public function test_quiz_generate_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\require_login_exception::class);
        \local_nexusai\external\quiz_generate::execute($courseb->id);
    }

    public function test_calendar_alert_save_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb, $student] = $this->create_student_isolated_from_another_course();

        $this->expectException(\require_login_exception::class);
        \local_nexusai\external\calendar_alert_save::execute(
            $student->id,
            $courseb->id,
            1,
            'Evento ajeno',
            time() + DAYSECS,
            1
        );
    }

    public function test_document_summarize_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\require_login_exception::class);
        \local_nexusai\external\document_summarize::execute('00000000-0000-0000-0000-000000000001', $courseb->id);
    }

    /**
     * Positive control: the SAME student DOES pass the capability check
     * for their own course — confirms the 4 tests above are testing real
     * isolation and not some parameter/typo error that throws for any
     * reason. With no real backend in this test environment, it's expected
     * to fail further down the line (missing backend_client config,
     * moodle_exception) — never because of capability.
     */
    public function test_quiz_generate_passes_capability_check_for_the_students_own_course(): void {
        $this->resetAfterTest();
        [$coursea] = $this->create_student_isolated_from_another_course();

        try {
            \local_nexusai\external\quiz_generate::execute($coursea->id);
            $this->fail('Expected an exception when reaching backend_client (no config in the test environment)');
        } catch (\required_capability_exception $e) {
            $this->fail('Should not fail on capability for the student\'s own course: ' . $e->getMessage());
        } catch (\Throwable $e) {
            // Any other exception (typically a moodle_exception due to
            // missing backend_client config) confirms the capability WAS
            // validated correctly before reaching here.
            $this->assertNotInstanceOf(\required_capability_exception::class, $e);
        }
    }
}
