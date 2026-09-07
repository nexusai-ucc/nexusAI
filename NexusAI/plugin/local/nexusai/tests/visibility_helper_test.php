<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests de `visibility_helper::onboarding_hint()` — modo revisión (ONB-04 / #427).
 *
 * Qué se verifica:
 *  1. Docente editando un curso existente (`course/edit.php?id=X`) → 'review-course'.
 *  2. Alumno (sin `local/nexusai:manage`) en la misma pantalla → null.
 *  3. `id` del query string que no matchea el curso real de $PAGE/$COURSE → null.
 *  4. La pantalla de crear curso (sin `id`) sigue devolviendo 'create-course' —
 *     ONB-04 no debe romper ONB-03.
 *  5. Curso dismisseado (ONB-05 / #428) → null aunque sea el propio docente
 *     editando su curso — no vuelve a aparecer solo.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

defined('MOODLE_INTERNAL') || die();

/**
 * @covers \local_nexusai\visibility_helper
 */
class visibility_helper_test extends \advanced_testcase {

    protected function tearDown(): void {
        unset($_GET['id']);
        parent::tearDown();
    }

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

        // $COURSE/$PAGE quedan en $course, pero el ?id= de la URL apunta a otro.
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
            'Un curso dismisseado no debe volver a mostrar el tutorial solo'
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
