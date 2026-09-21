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
 * Tests for privacy\provider — `plugin\provider` and `core_userlist_provider`
 * added on top of PRIV-01 (issue #310) for the admin Data requests flow.
 *
 * `backend_client` isn't mockable/injectable (`new backend_client()` is
 * hardcoded, see manage_capability_test.php's docstring) — so, like the
 * rest of the suite, this file covers what IS testable without touching
 * real HTTP: local context/user resolution (get_contexts_for_userid,
 * get_users_in_context) and the short-circuits that avoid reaching
 * backend_client (empty contexts, non-course context).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use local_nexusai\privacy\provider;

/**
 * Tests for local_nexusai's privacy\provider.
 *
 * @covers \local_nexusai\privacy\provider
 */
final class privacy_provider_test extends \advanced_testcase {
    // Tests for get_contexts_for_userid().

    public function test_get_contexts_for_userid_empty_when_not_enrolled(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();

        $contextlist = provider::get_contexts_for_userid($user->id);

        $this->assertCount(0, $contextlist->get_contextids());
    }

    public function test_get_contexts_for_userid_includes_enrolled_course_with_capability(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');

        $contextlist = provider::get_contexts_for_userid($student->id);
        $coursecontext = \context_course::instance($course->id);

        $this->assertContains((int) $coursecontext->id, array_map('intval', $contextlist->get_contextids()));
    }

    public function test_get_contexts_for_userid_excludes_course_without_capability(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');

        $coursecontext = \context_course::instance($course->id);
        assign_capability('local/nexusai:use', CAP_PROHIBIT, $this->get_student_role_id(), $coursecontext, true);
        $coursecontext->mark_dirty();

        $contextlist = provider::get_contexts_for_userid($student->id);

        $this->assertCount(0, $contextlist->get_contextids());
    }

    // Tests for get_users_in_context().

    public function test_get_users_in_context_returns_enrolled_users_with_capability(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');
        $coursecontext = \context_course::instance($course->id);

        $userlist = new userlist($coursecontext, 'local_nexusai');
        provider::get_users_in_context($userlist);

        $this->assertContains((int) $student->id, array_map('intval', $userlist->get_userids()));
    }

    public function test_get_users_in_context_ignores_non_course_context(): void {
        $this->resetAfterTest();
        $systemcontext = \context_system::instance();

        $userlist = new userlist($systemcontext, 'local_nexusai');
        provider::get_users_in_context($userlist);

        $this->assertCount(0, $userlist->get_userids());
    }

    // Short-circuits that avoid reaching backend_client (no real HTTP).

    public function test_delete_data_for_all_users_in_context_ignores_non_course_context(): void {
        $this->resetAfterTest();
        $systemcontext = \context_system::instance();

        // Non-course context: returns before calling backend_client, so
        // there's no real HTTP involved — it shouldn't throw an exception.
        provider::delete_data_for_all_users_in_context($systemcontext);
        $this->assertTrue(true);
    }

    public function test_export_user_data_with_no_contexts_does_not_reach_backend(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();

        // With no approved contexts: the foreach never runs, so a real
        // HTTP call to backend_client is never instantiated.
        $approvedlist = new approved_contextlist($user, 'local_nexusai', []);
        provider::export_user_data($approvedlist);
        $this->assertTrue(true);
    }

    public function test_delete_data_for_user_with_no_contexts_does_not_reach_backend(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();

        $approvedlist = new approved_contextlist($user, 'local_nexusai', []);
        provider::delete_data_for_user($approvedlist);
        $this->assertTrue(true);
    }

    public function test_delete_data_for_users_with_no_userids_does_not_reach_backend(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $coursecontext = \context_course::instance($course->id);

        $approvedlist = new approved_userlist($coursecontext, 'local_nexusai', []);
        provider::delete_data_for_users($approvedlist);
        $this->assertTrue(true);
    }

    // Helper.

    /**
     * ID of the 'student' archetype role.
     *
     * @return int ID of the 'student' archetype role.
     */
    private function get_student_role_id(): int {
        global $DB;
        return (int) $DB->get_field('role', 'id', ['shortname' => 'student']);
    }
}
