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
 * Tests for `onboarding_state_get`/`onboarding_state_set` (ONB-05 / #428).
 *
 * What's verified:
 *  1. With no previous preference → { dismissed: false, skipped: [] }.
 *  2. write_state() + read_state() → reflects what was saved (round-trip).
 *  3. write_state() caps `skipped` to MAX_SKIPPED and drops duplicates.
 *  4. Both execute_returns() declare the expected shape.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Tests for the onboarding_state_get/onboarding_state_set external functions (ONB-05, #428).
 *
 * @covers \local_nexusai\external\onboarding_state_get
 * @covers \local_nexusai\external\onboarding_state_set
 * @runTestsInSeparateProcesses
 */
final class onboarding_state_test extends \advanced_testcase {
    public function test_read_state_defaults_when_no_preference_set(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();

        $state = \local_nexusai\external\onboarding_state_get::read_state($course->id);

        // assertEquals is used, not assertSame: $course->id as returned by the test
        // generator comes as a numeric string; read_state() types it to int via its
        // signature (int $courseid) -- it's the same course, the exact PHP
        // representation isn't what this test is meant to check.
        $this->assertEquals($course->id, $state['courseid']);
        $this->assertFalse($state['dismissed']);
        $this->assertSame([], $state['skipped']);
    }

    public function test_write_then_read_round_trip(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();

        \local_nexusai\external\onboarding_state_set::write_state($course->id, true, ['groups', 'forums']);
        $state = \local_nexusai\external\onboarding_state_get::read_state($course->id);

        $this->assertTrue($state['dismissed']);
        $this->assertSame(['groups', 'forums'], $state['skipped']);
    }

    public function test_write_state_is_scoped_per_course(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course1 = $this->getDataGenerator()->create_course();
        $course2 = $this->getDataGenerator()->create_course();

        \local_nexusai\external\onboarding_state_set::write_state($course1->id, true, ['groups']);

        $state1 = \local_nexusai\external\onboarding_state_get::read_state($course1->id);
        $state2 = \local_nexusai\external\onboarding_state_get::read_state($course2->id);

        $this->assertTrue($state1['dismissed']);
        $this->assertFalse($state2['dismissed'], 'One course\'s dismissal must not affect another');
        $this->assertSame([], $state2['skipped']);
    }

    public function test_write_state_dedupes_and_caps_skipped(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();

        $many = array_map(fn ($i) => "step$i", range(1, 30));
        $withdupes = array_merge($many, ['step1', 'step2']);

        \local_nexusai\external\onboarding_state_set::write_state($course->id, false, $withdupes);
        $state = \local_nexusai\external\onboarding_state_get::read_state($course->id);

        $this->assertCount(20, $state['skipped'], 'skipped must not exceed MAX_SKIPPED (20)');
        $this->assertSame(array_slice($many, 0, 20), $state['skipped']);
    }

    public function test_get_execute_returns_shape(): void {
        $returns = \local_nexusai\external\onboarding_state_get::execute_returns();
        $keys = $returns->keys;

        $this->assertArrayHasKey('courseid', $keys);
        $this->assertArrayHasKey('dismissed', $keys);
        $this->assertArrayHasKey('skipped', $keys);
        $this->assertInstanceOf(\external_multiple_structure::class, $keys['skipped']);
    }

    public function test_set_execute_returns_shape(): void {
        $returns = \local_nexusai\external\onboarding_state_set::execute_returns();
        $this->assertArrayHasKey('success', $returns->keys);
    }
}
