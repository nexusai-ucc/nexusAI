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
 * Tests for the per-course NexusAI switch (CURSO-01, issue #520).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\course_guard;

/**
 * Covers course_guard, the widget visibility rule, the entry points it protects and the upgrade.
 *
 * @covers \local_nexusai\local\course_guard
 * @covers \local_nexusai\visibility_helper
 */
final class course_guard_test extends \advanced_testcase {
    /**
     * A course with no setting of its own is off, because the admin default ships off.
     */
    public function test_courses_are_off_by_default(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();

        $this->assertFalse(course_guard::is_enabled((int) $course->id));
    }

    /**
     * The admin can flip the default, and it applies to courses without their own setting.
     */
    public function test_admin_default_applies_to_courses_without_a_setting(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        set_config('default_course_enabled', 1, 'local_nexusai');

        $this->assertTrue(course_guard::is_enabled((int) $course->id));
    }

    /**
     * Turning a course on and off works, and the course setting beats the default.
     */
    public function test_set_enabled_turns_a_course_on_and_off(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $other = $this->getDataGenerator()->create_course();

        course_guard::set_enabled((int) $course->id, true);
        $this->assertTrue(course_guard::is_enabled((int) $course->id));
        $this->assertFalse(course_guard::is_enabled((int) $other->id), 'Other courses are not affected.');

        set_config('default_course_enabled', 1, 'local_nexusai');
        course_guard::set_enabled((int) $course->id, false);
        $this->assertFalse(course_guard::is_enabled((int) $course->id), 'The course setting beats the default.');
        $this->assertTrue(course_guard::is_enabled((int) $other->id));
    }

    /**
     * Changing the setting twice keeps a single row and records who changed it.
     */
    public function test_set_enabled_keeps_one_row_and_records_the_user(): void {
        global $DB;
        $this->resetAfterTest();
        $teacher = $this->getDataGenerator()->create_user();
        $this->setUser($teacher);
        $course = $this->getDataGenerator()->create_course();

        course_guard::set_enabled((int) $course->id, true);
        course_guard::set_enabled((int) $course->id, false);

        $this->assertSame(1, $DB->count_records('local_nexusai_course', ['courseid' => $course->id]));
        $this->assertEquals($teacher->id, $DB->get_field('local_nexusai_course', 'usermodified', ['courseid' => $course->id]));
    }

    /**
     * The site-wide switch beats everything, and the site page is never a course.
     */
    public function test_site_switch_and_site_course_always_win(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        course_guard::set_enabled((int) $course->id, true);

        set_config('enabled', 0, 'local_nexusai');
        $this->assertFalse(course_guard::is_enabled((int) $course->id));

        set_config('enabled', 1, 'local_nexusai');
        $this->assertFalse(course_guard::is_enabled(SITEID));
    }

    /**
     * Turning it off keeps everything else: only the switch changes.
     */
    public function test_require_enabled_throws_when_off_and_passes_when_on(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();

        try {
            course_guard::require_enabled((int) $course->id);
            $this->fail('An exception was expected for a course that is off.');
        } catch (\moodle_exception $e) {
            $this->assertSame('coursedisabled', $e->errorcode);
        }

        course_guard::set_enabled((int) $course->id, true);
        course_guard::require_enabled((int) $course->id);
        $this->addToAssertionCount(1);
    }

    /**
     * Changing the setting logs an event.
     */
    public function test_set_enabled_triggers_an_event(): void {
        $this->resetAfterTest();
        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $sink = $this->redirectEvents();

        course_guard::set_enabled((int) $course->id, true);

        $events = array_values(array_filter(
            $sink->get_events(),
            fn($event) => $event instanceof \local_nexusai\event\course_settings_updated
        ));
        $this->assertCount(1, $events);
        $this->assertEquals($course->id, $events[0]->courseid);
        $this->assertEquals(1, $events[0]->other['enabled']);
    }

    /**
     * Data and privacy functions of the student stay reachable: only the assistant is switched off.
     */
    public function test_privacy_functions_do_not_depend_on_the_course_switch(): void {
        $source = file_get_contents(__DIR__ . '/../classes/external/privacy_export.php')
            . file_get_contents(__DIR__ . '/../classes/external/privacy_delete.php');

        $this->assertStringNotContainsString('course_guard', $source);
    }

    /**
     * Every external function that takes a course checks the switch, except the privacy ones.
     */
    public function test_every_course_function_checks_the_switch(): void {
        $exempt = ['backend_client', 'dismiss_pending_upload', 'privacy_export', 'privacy_delete'];
        $missing = [];
        foreach (glob(__DIR__ . '/../classes/external/*.php') as $file) {
            $name = basename($file, '.php');
            if (in_array($name, $exempt, true)) {
                continue;
            }
            if (strpos(file_get_contents($file), 'course_guard::require_enabled') === false) {
                $missing[] = $name;
            }
        }
        $this->assertSame([], $missing, 'These external functions do not check the course switch.');
    }

    /**
     * The widget and icon show only in courses that are on.
     */
    public function test_widget_is_visible_only_in_courses_that_are_on(): void {
        global $COURSE;
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $student = $generator->create_user();
        $generator->enrol_user($student->id, $course->id, 'student');
        $this->setUser($student);
        $COURSE = get_course($course->id);

        $this->assertNull(visibility_helper::resolve(), 'Off by default.');

        $this->setAdminUser();
        course_guard::set_enabled((int) $course->id, true);
        $this->setUser($student);
        $resolved = visibility_helper::resolve();
        $this->assertSame((int) $course->id, $resolved['courseid']);
        $this->assertFalse($resolved['isteacher']);

        $this->setAdminUser();
        set_config('enabled', 0, 'local_nexusai');
        $this->setUser($student);
        $this->assertNull(visibility_helper::resolve(), 'The site-wide switch hides it everywhere.');
    }

    /**
     * Outside a course nothing shows unless the admin allows it.
     */
    public function test_nothing_shows_outside_a_course_unless_the_admin_allows_it(): void {
        global $COURSE, $SITE;
        $this->resetAfterTest();
        $this->setUser($this->getDataGenerator()->create_user());
        $COURSE = $SITE;

        $this->assertNull(visibility_helper::resolve());

        set_config('show_outside_course', 1, 'local_nexusai');
        $resolved = visibility_helper::resolve();
        $this->assertSame(0, $resolved['courseid']);
    }

    /**
     * The table exists after the install or the upgrade, and the placeholder is gone.
     */
    public function test_schema_has_the_course_table_and_no_placeholder(): void {
        global $DB;
        $dbman = $DB->get_manager();

        $this->assertTrue($dbman->table_exists('local_nexusai_course'));
        $this->assertFalse($dbman->table_exists('local_nexusai_placeholder'));
    }

    /**
     * Deleting a user detaches them from the settings without touching the setting itself.
     */
    public function test_privacy_deletion_keeps_the_setting_and_detaches_the_user(): void {
        global $DB;
        $this->resetAfterTest();
        $teacher = $this->getDataGenerator()->create_user();
        $this->setUser($teacher);
        $course = $this->getDataGenerator()->create_course();
        course_guard::set_enabled((int) $course->id, true);

        $method = new \ReflectionMethod(\local_nexusai\privacy\provider::class, 'anonymise_course_settings');
        $method->setAccessible(true);
        $method->invoke(null, [(int) $teacher->id]);

        $record = $DB->get_record('local_nexusai_course', ['courseid' => $course->id]);
        $this->assertEquals(1, $record->enabled);
        $this->assertEquals(0, $record->usermodified);
    }
}
