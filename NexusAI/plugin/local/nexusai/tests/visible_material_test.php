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
 * Tests for the material visible to each user (VIS-02, issue #537).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\visible_material;

/**
 * Covers which activities each user gets in `visible_cmids`.
 *
 * @covers \local_nexusai\local\visible_material
 */
final class visible_material_test extends \advanced_testcase {
    /**
     * Creates a course with a student and a teacher.
     *
     * @return array{0:\stdClass,1:\stdClass,2:\stdClass} Course, student, teacher.
     */
    private function setup_course(): array {
        $this->setAdminUser();
        $gen = $this->getDataGenerator();
        $course = $gen->create_course(['numsections' => 3]);
        $student = $gen->create_and_enrol($course, 'student');
        $teacher = $gen->create_and_enrol($course, 'editingteacher');
        return [$course, $student, $teacher];
    }

    /**
     * A student sees visible activities and not hidden ones; a teacher sees both.
     */
    public function test_hidden_activities_are_left_out_for_students_only(): void {
        $this->resetAfterTest();
        [$course, $student, $teacher] = $this->setup_course();
        $gen = $this->getDataGenerator();
        $shown = $gen->create_module('resource', ['course' => $course->id]);
        $hidden = $gen->create_module('resource', ['course' => $course->id, 'visible' => 0]);

        $this->setUser($student);
        $this->assertSame([(int) $shown->cmid], visible_material::for_course((int) $course->id));

        $this->setUser($teacher);
        $this->assertEqualsCanonicalizing(
            [(int) $shown->cmid, (int) $hidden->cmid],
            visible_material::for_course((int) $course->id)
        );
    }

    /**
     * An activity in a hidden section is not visible to a student.
     */
    public function test_activities_in_a_hidden_section_are_left_out(): void {
        $this->resetAfterTest();
        [$course, $student] = $this->setup_course();
        $gen = $this->getDataGenerator();
        $inhidden = $gen->create_module('resource', ['course' => $course->id, 'section' => 2]);
        $shown = $gen->create_module('resource', ['course' => $course->id, 'section' => 1]);
        set_section_visible($course->id, 2, 0);

        $this->setUser($student);
        $this->assertSame([(int) $shown->cmid], visible_material::for_course((int) $course->id));
        $this->assertNotContains((int) $inhidden->cmid, visible_material::for_course((int) $course->id));
    }

    /**
     * An availability restriction that the student does not meet hides the activity.
     */
    public function test_activities_restricted_by_date_are_left_out_until_they_open(): void {
        global $CFG;
        $this->resetAfterTest();
        $CFG->enableavailability = 1;
        [$course, $student] = $this->setup_course();
        $future = json_encode(\core_availability\tree::get_root_json([
            \availability_date\condition::get_json(\availability_date\condition::DIRECTION_FROM, time() + DAYSECS),
        ], \core_availability\tree::OP_AND));
        $restricted = $this->getDataGenerator()->create_module('resource', [
            'course' => $course->id,
            'availability' => $future,
        ]);

        $this->setUser($student);
        $this->assertNotContains((int) $restricted->cmid, visible_material::for_course((int) $course->id));
    }

    /**
     * A teacher who switches to the student role sees what a student sees.
     */
    public function test_role_switch_to_student_hides_hidden_activities(): void {
        global $DB;
        $this->resetAfterTest();
        [$course, , $teacher] = $this->setup_course();
        $hidden = $this->getDataGenerator()->create_module('resource', ['course' => $course->id, 'visible' => 0]);

        $this->setUser($teacher);
        $this->assertContains((int) $hidden->cmid, visible_material::for_course((int) $course->id));

        $studentrole = $DB->get_record('role', ['shortname' => 'student'], '*', MUST_EXIST);
        role_switch($studentrole->id, \context_course::instance($course->id));
        get_fast_modinfo($course->id, 0, true);
        $this->assertNotContains((int) $hidden->cmid, visible_material::for_course((int) $course->id));
    }

    /**
     * A course with no activities gives an empty list, not an error.
     */
    public function test_a_course_without_activities_gives_an_empty_list(): void {
        $this->resetAfterTest();
        [$course, $student] = $this->setup_course();

        $this->setUser($student);
        $this->assertSame([], visible_material::for_course((int) $course->id));
    }

    /**
     * Several courses give one flat list, and the site course is ignored.
     */
    public function test_several_courses_give_one_flat_list(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $gen = $this->getDataGenerator();
        $one = $gen->create_course();
        $two = $gen->create_course();
        $user = $gen->create_user();
        $gen->enrol_user($user->id, $one->id, 'student');
        $gen->enrol_user($user->id, $two->id, 'student');
        $a = $gen->create_module('resource', ['course' => $one->id]);
        $b = $gen->create_module('resource', ['course' => $two->id]);

        $this->setUser($user);
        $this->assertSame(
            [(int) $a->cmid, (int) $b->cmid],
            visible_material::for_courses([(int) $one->id, (int) $two->id, SITEID])
        );
    }

    /**
     * The body gets the list for the course it names, replacing any value sent in it.
     */
    public function test_add_to_body_uses_the_course_in_the_body(): void {
        $this->resetAfterTest();
        [$course, $student] = $this->setup_course();
        $this->setAdminUser();
        $other = $this->getDataGenerator()->create_course();
        $mine = $this->getDataGenerator()->create_module('resource', ['course' => $course->id]);
        $this->getDataGenerator()->create_module('resource', ['course' => $other->id]);

        $this->setUser($student);
        $body = visible_material::add_to_body(json_encode([
            'course_id' => (int) $course->id,
            'question' => 'hola',
            'visible_cmids' => [99999],
        ]));

        $decoded = json_decode($body, true);
        $this->assertSame([(int) $mine->cmid], $decoded['visible_cmids']);
        $this->assertSame('hola', $decoded['question']);
    }

    /**
     * With several courses in the body, the list covers all of them.
     */
    public function test_add_to_body_uses_course_ids_when_present(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $gen = $this->getDataGenerator();
        $one = $gen->create_course();
        $two = $gen->create_course();
        $user = $gen->create_user();
        $gen->enrol_user($user->id, $one->id, 'student');
        $gen->enrol_user($user->id, $two->id, 'student');
        $a = $gen->create_module('resource', ['course' => $one->id]);
        $b = $gen->create_module('resource', ['course' => $two->id]);

        $this->setUser($user);
        $decoded = json_decode(visible_material::add_to_body(json_encode([
            'course_id' => (int) $one->id,
            'course_ids' => [(int) $one->id, (int) $two->id],
        ])), true);

        $this->assertSame([(int) $a->cmid, (int) $b->cmid], $decoded['visible_cmids']);
    }

    /**
     * A body that is not a JSON object is refused.
     */
    public function test_add_to_body_refuses_a_broken_body(): void {
        $this->expectException(\moodle_exception::class);
        visible_material::add_to_body('not json');
    }
}
