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
 * Tests for the activity created behind each NexusAI upload (VIS-03, issue #538).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\material_activity;
use local_nexusai\local\visible_material;

/**
 * Covers material_activity and the observer guard.
 *
 * @covers \local_nexusai\local\material_activity
 * @covers \local_nexusai\observer
 */
final class material_activity_test extends \advanced_testcase {
    /**
     * Creates a course with 3 units, and a teacher and a student in it.
     *
     * @return array{0:\stdClass,1:\stdClass,2:\stdClass} Course, teacher, student.
     */
    private function setup_course(): array {
        $gen = $this->getDataGenerator();
        $course = $gen->create_course(['numsections' => 3]);
        $teacher = $gen->create_and_enrol($course, 'editingteacher');
        $student = $gen->create_and_enrol($course, 'student');
        return [$course, $teacher, $student];
    }

    /**
     * The activity is created in the chosen unit with the file inside.
     */
    public function test_creates_a_file_activity_in_the_chosen_unit(): void {
        $this->resetAfterTest();
        [$course, $teacher] = $this->setup_course();
        $this->setUser($teacher);

        $cmid = material_activity::create($course, 2, 'apunte.pdf', '%PDF-1.4 contenido', true);

        $cm = get_fast_modinfo($course->id)->get_cm($cmid);
        $this->assertSame('resource', $cm->modname);
        $this->assertSame('apunte.pdf', $cm->name);
        $this->assertSame(2, (int) $cm->sectionnum);
        $this->assertEquals(1, $cm->visible);

        $files = get_file_storage()->get_area_files(
            \context_module::instance($cmid)->id,
            'mod_resource',
            'content',
            false,
            'filename',
            false
        );
        $file = reset($files);
        $this->assertSame('apunte.pdf', $file->get_filename());
        $this->assertSame('%PDF-1.4 contenido', $file->get_content());
    }

    /**
     * With the switch off the activity is hidden, so students do not get it.
     */
    public function test_hidden_activity_is_not_visible_to_students(): void {
        $this->resetAfterTest();
        [$course, $teacher, $student] = $this->setup_course();
        $this->setUser($teacher);
        $shown = material_activity::create($course, 1, 'visible.pdf', '%PDF-1.4 a', true);
        $hidden = material_activity::create($course, 1, 'oculto.pdf', '%PDF-1.4 b', false);

        $this->setUser($student);
        $this->assertSame([$shown], visible_material::for_course((int) $course->id));
        $this->setUser($teacher);
        $this->assertEqualsCanonicalizing([$shown, $hidden], visible_material::for_course((int) $course->id));
    }

    /**
     * The observer does not queue a confirmation for what NexusAI created itself,
     * and still does for a file added the native way.
     *
     * Observers of non-internal events wait for the transaction PHPUnit wraps
     * every test in, so the observer is called directly with the event.
     */
    public function test_observer_skips_what_nexusai_created_but_not_native_uploads(): void {
        $this->resetAfterTest();
        [$course, $teacher] = $this->setup_course();
        $this->setUser($teacher);
        set_config('default_course_enabled', 1, 'local_nexusai');
        set_config('enabled', 1, 'local_nexusai');
        $this->assertFalse(material_activity::is_creating());

        $native = $this->getDataGenerator()->create_module('resource', [
            'course' => $course->id,
            'defaultfilename' => 'nativo.txt',
        ]);
        $event = static fn(int $cmid) => \core\event\course_module_created::create_from_cm(
            get_fast_modinfo($course->id, 0)->get_cm($cmid)
        );
        $pending = static fn() => json_decode(get_user_preferences(observer::PENDING_PREF, '{}'), true);

        // While NexusAI is creating an activity the observer leaves it alone.
        $flag = new \ReflectionProperty(material_activity::class, 'creating');
        $flag->setValue(null, true);
        observer::course_module_created($event((int) $native->cmid));
        $flag->setValue(null, false);
        $this->assertSame([], $pending());

        // A native upload is queued for the teacher to confirm.
        observer::course_module_created($event((int) $native->cmid));
        $this->assertArrayHasKey((string) $native->cmid, $pending());
    }

    /**
     * A user who cannot add activities is refused with a capability error.
     */
    public function test_a_user_without_permission_to_add_activities_is_refused(): void {
        $this->resetAfterTest();
        [$course, , $student] = $this->setup_course();
        $this->setUser($student);

        $this->expectException(\required_capability_exception::class);
        material_activity::require_can_create($course, 1, 100, true);
    }

    /**
     * A teacher may create in an existing unit, but not in one that does not exist.
     */
    public function test_the_unit_must_exist(): void {
        $this->resetAfterTest();
        [$course, $teacher] = $this->setup_course();
        $this->setUser($teacher);

        material_activity::require_can_create($course, 3, 100, true);
        $this->expectException(\moodle_exception::class);
        material_activity::require_can_create($course, 4, 100, true);
    }

    /**
     * Files over Moodle's maximum upload size are refused with a clear message.
     */
    public function test_a_file_over_the_maximum_size_is_refused(): void {
        global $CFG;
        $this->resetAfterTest();
        [$course, $teacher] = $this->setup_course();
        $this->setUser($teacher);
        $CFG->maxbytes = 1000;
        $course->maxbytes = 1000;

        material_activity::require_can_create($course, 1, 999, true);
        try {
            material_activity::require_can_create($course, 1, 1001, true);
            $this->fail('An oversized file was accepted');
        } catch (\moodle_exception $e) {
            $this->assertSame('materialtoolarge', $e->errorcode);
        }
    }

    /**
     * Removing the activity takes it out of the course.
     */
    public function test_remove_deletes_the_activity(): void {
        $this->resetAfterTest();
        [$course, $teacher] = $this->setup_course();
        $this->setUser($teacher);
        $cmid = material_activity::create($course, 1, 'apunte.pdf', '%PDF-1.4 a', true);

        material_activity::remove($cmid);

        rebuild_course_cache($course->id, true);
        $this->assertArrayNotHasKey($cmid, get_fast_modinfo($course->id)->cms);
    }
}
