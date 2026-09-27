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
 * Tests for the activity info in the Materials list (VIS-03, issue #538).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\local\material_activity;

/**
 * Covers where each listed document lives in the classroom.
 *
 * Runs in a separate process because it loads the external function class,
 * which requires externallib.php.
 *
 * @runTestsInSeparateProcesses
 * @covers \local_nexusai\external\document_list
 */
final class document_list_activity_test extends \advanced_testcase {
    /**
     * The document list tells where each document lives: visible, hidden, gone or none.
     */
    public function test_document_list_reports_the_state_of_each_activity(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course(['numsections' => 3]);
        $teacher = $this->getDataGenerator()->create_and_enrol($course, 'editingteacher');
        $this->setUser($teacher);
        $shown = material_activity::create($course, 1, 'a.pdf', '%PDF-1.4 a', true);
        $hidden = material_activity::create($course, 2, 'b.pdf', '%PDF-1.4 b', false);
        $gone = material_activity::create($course, 1, 'c.pdf', '%PDF-1.4 c', true);
        material_activity::remove($gone);
        rebuild_course_cache($course->id, true);
        $modinfo = get_fast_modinfo($course->id);

        $method = new \ReflectionMethod(external\document_list::class, 'activity_fields');
        $method->setAccessible(true);
        $status = static fn(?int $cmid) => $method->invoke(null, ['cmid' => $cmid, 'section' => 1], $modinfo);

        $this->assertSame('visible', $status($shown)['activity_status']);
        $this->assertStringContainsString('/mod/resource/view.php?id=' . $shown, $status($shown)['activity_url']);
        $this->assertSame('hidden', $status($hidden)['activity_status']);
        $this->assertSame(2, $status($hidden)['section']);
        $this->assertSame('missing', $status($gone)['activity_status']);
        $this->assertSame('none', $status(null)['activity_status']);
    }
}
