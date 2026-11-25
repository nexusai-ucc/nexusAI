<?php
// This file is part of Moodle - https://moodle.org/
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
 * Tests for the upgrade helpers.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/local/nexusai/db/upgradelib.php');

/**
 * Tests for local_nexusai_raise_old_default_token_limits().
 *
 * @covers ::local_nexusai_raise_old_default_token_limits
 */
final class upgradelib_test extends \advanced_testcase {
    /**
     * A site that saved the settings page with the old defaults gets the new ones.
     */
    public function test_old_defaults_are_raised(): void {
        $this->resetAfterTest();
        set_config('token_limit_student_hourly', 8000, 'local_nexusai');
        set_config('token_limit_student_daily', 40000, 'local_nexusai');
        set_config('token_limit_teacher_hourly', 20000, 'local_nexusai');
        set_config('token_limit_teacher_daily', 100000, 'local_nexusai');

        $raised = local_nexusai_raise_old_default_token_limits();

        $this->assertCount(4, $raised);
        $this->assertSame(['hourly' => 20000, 'daily' => 80000], local\usage_store::limits('student'));
        $this->assertSame(['hourly' => 40000, 'daily' => 200000], local\usage_store::limits('teacher'));
    }

    /**
     * A limit the admin chose is kept, and the old defaults next to it are still raised.
     */
    public function test_custom_limits_are_kept(): void {
        $this->resetAfterTest();
        set_config('token_limit_student_hourly', 12345, 'local_nexusai');
        set_config('token_limit_student_daily', 40000, 'local_nexusai');

        $raised = local_nexusai_raise_old_default_token_limits();

        $this->assertSame(['token_limit_student_daily'], $raised);
        $this->assertSame(12345, (int) get_config('local_nexusai', 'token_limit_student_hourly'));
        $this->assertSame(80000, (int) get_config('local_nexusai', 'token_limit_student_daily'));
    }

    /**
     * A site that never saved the limits uses the new defaults without a stored value.
     */
    public function test_unset_limits_fall_back_to_new_defaults(): void {
        $this->resetAfterTest();
        unset_config('token_limit_student_hourly', 'local_nexusai');
        unset_config('token_limit_student_daily', 'local_nexusai');

        $this->assertSame([], array_intersect(
            ['token_limit_student_hourly', 'token_limit_student_daily'],
            local_nexusai_raise_old_default_token_limits()
        ));
        $this->assertSame(['hourly' => 20000, 'daily' => 80000], local\usage_store::limits('student'));
    }
}
