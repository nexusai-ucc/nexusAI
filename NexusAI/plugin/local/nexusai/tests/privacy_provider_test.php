<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests del privacy\provider — `plugin\provider` y `core_userlist_provider`
 * agregados sobre PRIV-01 (issue #310) para el flujo admin de Data requests.
 *
 * `backend_client` no es mockeable/inyectable (`new backend_client()`
 * hardcodeado, ver docstring de manage_capability_test.php) — así que, como
 * el resto de la suite, este archivo cubre lo que SÍ es testable sin tocar
 * HTTP real: la resolución local de contextos/usuarios
 * (get_contexts_for_userid, get_users_in_context) y los short-circuits que
 * evitan llegar a backend_client (contextos vacíos, contexto no-curso).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

defined('MOODLE_INTERNAL') || die();

use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\userlist;
use local_nexusai\privacy\provider;

/**
 * @covers \local_nexusai\privacy\provider
 */
class privacy_provider_test extends \advanced_testcase {

    // ============================================================
    // get_contexts_for_userid
    // ============================================================

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

    // ============================================================
    // get_users_in_context
    // ============================================================

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

    // ============================================================
    // Short-circuits que evitan llegar a backend_client (sin HTTP real)
    // ============================================================

    public function test_delete_data_for_all_users_in_context_ignores_non_course_context(): void {
        $this->resetAfterTest();
        $systemcontext = \context_system::instance();

        // Contexto no-curso: retorna antes de llamar a backend_client, así
        // que no hay HTTP real involucrado — no debería tirar excepción.
        provider::delete_data_for_all_users_in_context($systemcontext);
        $this->assertTrue(true);
    }

    public function test_export_user_data_with_no_contexts_does_not_reach_backend(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();

        // Sin contextos aprobados: el foreach nunca ejecuta, así que nunca
        // se instancia una llamada HTTP real a backend_client.
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

    // ============================================================
    // Helper
    // ============================================================

    /**
     * @return int ID del rol archetype 'student'.
     */
    private function get_student_role_id(): int {
        global $DB;
        return (int) $DB->get_field('role', 'id', ['shortname' => 'student']);
    }
}
