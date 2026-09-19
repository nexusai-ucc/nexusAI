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
 * Tests for `visibility_helper::onboarding_hint()` — review mode (ONB-04 / #427).
 *
 * What's verified:
 *  1. Teacher editing an existing course (`course/edit.php?id=X`) → 'review-course'.
 *  2. Student (without `local/nexusai:manage`) on the same screen → null.
 *  3. Query-string `id` that doesn't match $PAGE/$COURSE's real course → null.
 *  4. The create-course screen (no `id`) still returns 'create-course' —
 *     ONB-04 must not break ONB-03.
 *  5. Dismissed course (ONB-05 / #428) → null even for the teacher
 *     themselves editing their own course — it doesn't auto-reappear.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Tests for visibility_helper::onboarding_hint() in review mode (ONB-04, #427).
 *
 * @covers \local_nexusai\visibility_helper
 * @runTestsInSeparateProcesses
 */
final class visibility_helper_test extends \advanced_testcase {
    protected function tearDown(): void {
        unset($_GET['id']);
        parent::tearDown();
    }

    /**
     * Simulates standing on course/edit.php?id=$editid with $course as the current course.
     *
     * @param \stdClass $course Current course ($COURSE/$PAGE->course).
     * @param int $editid ID that appears in the simulated URL's query string.
     */
    private function set_course_edit_page(\stdClass $course, int $editid): void {
        global $PAGE;
        $PAGE->set_course($course);
        $PAGE->set_pagetype('course-edit');
        $_GET['id'] = $editid;
    }

    public function test_review_course_hint_for_teacher(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        $this->set_course_edit_page($course, $course->id);

        $this->assertSame(
            'review-course',
            \local_nexusai\visibility_helper::onboarding_hint()
        );
    }

    public function test_null_for_student_without_manage(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');
        $this->setUser($student);

        $this->set_course_edit_page($course, $course->id);

        $this->assertNull(\local_nexusai\visibility_helper::onboarding_hint());
    }

    public function test_null_when_id_does_not_match_course(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        $othercourse = $this->getDataGenerator()->create_course();

        // The current $COURSE/$PAGE stays at $course, but the URL's ?id= points to another one.
        $this->set_course_edit_page($course, $othercourse->id);

        $this->assertNull(\local_nexusai\visibility_helper::onboarding_hint());
    }

    public function test_null_when_course_dismissed(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        set_user_preference('local_nexusai_onb_dismissed_' . $course->id, '1');

        $this->set_course_edit_page($course, $course->id);

        $this->assertNull(
            \local_nexusai\visibility_helper::onboarding_hint(),
            'A dismissed course must not auto-show the tutorial again'
        );
    }

    public function test_create_course_hint_unaffected(): void {
        global $PAGE;
        $this->resetAfterTest();
        $this->setAdminUser();

        $PAGE->set_pagetype('course-edit');
        unset($_GET['id']);

        $this->assertSame(
            'create-course',
            \local_nexusai\visibility_helper::onboarding_hint()
        );
    }
}
