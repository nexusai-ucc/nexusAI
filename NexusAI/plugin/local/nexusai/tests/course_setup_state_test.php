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
 * Tests for the `local_nexusai_course_setup_state` External Function (ONB-02 / #425).
 *
 * What's verified:
 *  1. execute_returns() declares the 6 signals with the { present, count } shape.
 *  2. signal() sets present based on the count (including edge cases: 0 and negatives).
 *  3. material_signal() translates the backend response and degrades to null
 *     when the backend didn't respond.
 *  4. gather_moodle_signals() on a freshly created course → everything false.
 *  5. gather_moodle_signals() detects a section with content, forum, group,
 *     enrolled student and calendar event when they exist.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Tests for the course_setup_state external function (ONB-02, #425).
 *
 * @covers \local_nexusai\external\course_setup_state
 * @runTestsInSeparateProcesses
 */
final class course_setup_state_test extends \advanced_testcase {
    // Test 1: execute_returns() structure.

    public function test_execute_returns_declares_all_signals(): void {
        $returns = \local_nexusai\external\course_setup_state::execute_returns();

        $this->assertInstanceOf(\external_single_structure::class, $returns);

        $keys = $returns->keys;
        foreach (['courseid', 'sections', 'groups', 'students', 'forums', 'calendar', 'material'] as $key) {
            $this->assertArrayHasKey($key, $keys, "execute_returns() must declare '$key'");
        }

        foreach (['sections', 'groups', 'students', 'forums', 'calendar', 'material'] as $signal) {
            $this->assertInstanceOf(
                \external_single_structure::class,
                $keys[$signal],
                "'$signal' must be a { present, count } structure"
            );
            $this->assertArrayHasKey('present', $keys[$signal]->keys);
            $this->assertArrayHasKey('count', $keys[$signal]->keys);
        }
    }

    // Test 2: signal() — present based on the count.

    public function test_signal_present_reflects_count(): void {
        $cls = \local_nexusai\external\course_setup_state::class;

        $this->assertSame(['present' => false, 'count' => 0], $cls::signal(0));
        $this->assertSame(['present' => true, 'count' => 1], $cls::signal(1));
        $this->assertSame(['present' => true, 'count' => 42], $cls::signal(42));
        // A negative count (shouldn't happen) is normalized to 0 / false.
        $this->assertSame(['present' => false, 'count' => 0], $cls::signal(-3));
    }

    // Test 3: material_signal() — translation and degradation.

    public function test_material_signal_null_when_backend_absent(): void {
        $result = \local_nexusai\external\course_setup_state::material_signal(null);
        $this->assertNull($result['present'], 'Backend down → present unknown (null)');
        $this->assertSame(0, $result['count']);
    }

    public function test_material_signal_from_backend_stats(): void {
        $cls = \local_nexusai\external\course_setup_state::class;

        $withcontent = $cls::material_signal([
            'document_count' => 5,
            'has_indexed_content' => true,
        ]);
        $this->assertTrue($withcontent['present']);
        $this->assertSame(5, $withcontent['count']);

        $empty = $cls::material_signal([
            'document_count' => 0,
            'has_indexed_content' => false,
        ]);
        $this->assertFalse($empty['present']);
        $this->assertSame(0, $empty['count']);

        // Without the has_indexed_content key: it's inferred from the count.
        $inferred = $cls::material_signal(['document_count' => 3]);
        $this->assertTrue($inferred['present']);
        $this->assertSame(3, $inferred['count']);
    }

    // Test 4: empty course → all Moodle signals false.

    public function test_gather_moodle_signals_empty_course(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);

        $signals = \local_nexusai\external\course_setup_state::gather_moodle_signals($course->id, $context);

        foreach (['sections', 'groups', 'students', 'forums', 'calendar'] as $key) {
            $this->assertFalse($signals[$key]['present'], "Empty course: '$key' shouldn't be present");
            $this->assertSame(0, $signals[$key]['count']);
        }
    }

    // Test 5: set-up course → signals detected.

    public function test_gather_moodle_signals_detects_content(): void {
        global $DB;
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course(['numsections' => 3]);
        $context = \context_course::instance($course->id);

        // Forum in section 1 → activates 'forums' and 'sections'.
        $this->getDataGenerator()->create_module('forum', ['course' => $course->id], ['section' => 1]);

        // Group.
        $this->getDataGenerator()->create_group(['courseid' => $course->id]);

        // Enrolled student (default student role).
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id);

        // Calendar event of the course's own.
        $DB->insert_record('event', (object) [
            'name'         => 'Parcial 1',
            'description'  => '',
            'format'       => FORMAT_HTML,
            'courseid'     => $course->id,
            'groupid'      => 0,
            'userid'       => 0,
            'eventtype'    => 'course',
            'timestart'    => time() + DAYSECS,
            'timeduration' => 0,
            'visible'      => 1,
            'timemodified' => time(),
        ]);

        $signals = \local_nexusai\external\course_setup_state::gather_moodle_signals($course->id, $context);

        $this->assertTrue($signals['sections']['present'], 'The section with the forum should count');
        $this->assertTrue($signals['forums']['present']);
        $this->assertSame(1, $signals['forums']['count']);
        $this->assertTrue($signals['groups']['present']);
        $this->assertSame(1, $signals['groups']['count']);
        $this->assertTrue($signals['students']['present']);
        $this->assertSame(1, $signals['students']['count']);
        $this->assertTrue($signals['calendar']['present']);
        $this->assertSame(1, $signals['calendar']['count']);
    }
}
