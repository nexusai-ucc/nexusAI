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
 * Helpers for the upgrade steps of local_nexusai.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Raises the token limits that still hold the defaults before 0.21.0.
 *
 * The chat now sends whole excerpts of the material, so a question costs about
 * 4,400 tokens instead of 2,800. Saving the settings page stores the defaults,
 * so a site still on the old ones would give a student about 2 questions an
 * hour. Only a value equal to the old default is raised: a limit the admin
 * chose is kept. The values are written out here, not read from usage_store,
 * so the step does the same thing whatever later versions change.
 *
 * @return string[] Names of the settings that were raised.
 */
function local_nexusai_raise_old_default_token_limits(): array {
    $raise = [
        'token_limit_student_hourly' => [8000, 20000],
        'token_limit_student_daily' => [40000, 80000],
        'token_limit_teacher_hourly' => [20000, 40000],
        'token_limit_teacher_daily' => [100000, 200000],
    ];
    $raised = [];
    foreach ($raise as $name => [$old, $new]) {
        if ((int) get_config('local_nexusai', $name) === $old) {
            set_config($name, $new, 'local_nexusai');
            $raised[] = $name;
        }
    }
    return $raised;
}
