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
 * Tests that external functions honour the per-course NexusAI switch (CURSO-01, issue #520).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\course_guard;

/**
 * External functions include externallib.php, which needs an isolated process in tests.
 *
 * @covers \local_nexusai\local\course_guard
 * @runTestsInSeparateProcesses
 */
final class course_guard_external_test extends \advanced_testcase {
    /**
     * An external function refuses a course that is off and works once it is on.
     */
    public function test_external_functions_refuse_a_course_that_is_off(): void {
        $this->resetAfterTest();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $teacher = $generator->create_user();
        $generator->enrol_user($teacher->id, $course->id, 'editingteacher');
        $this->setUser($teacher);

        try {
            \local_nexusai\external\document_list::execute((int) $course->id);
            $this->fail('An exception was expected for a course that is off.');
        } catch (\moodle_exception $e) {
            $this->assertSame('coursedisabled', $e->errorcode);
        }

        course_guard::set_enabled((int) $course->id, true);
        try {
            \local_nexusai\external\document_list::execute((int) $course->id);
        } catch (\moodle_exception $e) {
            // Past the guard it reaches the backend, which is not configured here.
            $this->assertNotSame('coursedisabled', $e->errorcode);
        }
    }
}
