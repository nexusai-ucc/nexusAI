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
 * Enforcement de `local/nexusai:manage` en las external functions que
 * todavía no tenían test (QA-02, issue #312).
 *
 * De las 47 external functions registradas en db/services.php, 43 no
 * tenían ningún test antes de este archivo — ninguno de los 5 tests
 * preexistentes invoca execute() de punta a punta ni mockea
 * backend_client (no es mockeable/inyectable: `new backend_client()` está
 * hardcodeado inline en cada clase, sin factory ni service locator —
 * refactorizar eso es un cambio mucho más grande que esta issue).
 *
 * Lo que SÍ es 100% testable sin tocar backend_client, porque corre ANTES
 * en execute(): validate_parameters(), validate_context() y
 * require_capability(). Este archivo cubre exactamente eso — que un
 * alumno (sin :manage) no pueda invocar ninguna de las funciones
 * reservadas a docentes — que es lo que el issue pide priorizar primero
 * ("enforcement de capability").
 *
 * dismiss_pending_upload es la única función `:manage`-adyacente que se
 * excluye a propósito de la lista de abajo: no tiene courseid ni
 * capability check — opera solo sobre la user preference del propio
 * caller (ver comentario en el archivo), así que el test correspondiente
 * (más abajo) confirma lo contrario: que CUALQUIER usuario logueado puede
 * llamarla sin excepción, y que está aislada por usuario.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

/**
 * Enforcement de local/nexusai:manage en external functions que todavía no tenían test (QA-02, #312).
 *
 * @covers \local_nexusai\external\exam_generate
 * @covers \local_nexusai\external\analytics_dashboard
 * @covers \local_nexusai\external\analytics_faq_topics
 * @covers \local_nexusai\external\gaps_list
 * @covers \local_nexusai\external\gaps_archive
 * @covers \local_nexusai\external\document_upload
 * @covers \local_nexusai\external\document_status
 * @covers \local_nexusai\external\document_delete
 * @covers \local_nexusai\external\document_preview
 * @covers \local_nexusai\external\document_replace
 * @covers \local_nexusai\external\get_pending_uploads
 * @covers \local_nexusai\external\confirm_pending_upload
 * @covers \local_nexusai\external\dismiss_pending_upload
 */
class manage_capability_test extends \advanced_testcase {
    /**
     * Curso + alumno matriculado (rol student, SIN local/nexusai:manage).
     *
     * @return array{0: \stdClass, 1: \stdClass} [$course, $student]
     */
    private function create_student_in_course(): array {
        $course = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id, 'student');
        $this->setUser($student);
        return [$course, $student];
    }

    /**
     * Curso + docente matriculado (rol editingteacher, CON local/nexusai:manage).
     *
     * @return array{0: \stdClass, 1: \stdClass} [$course, $teacher]
     */
    private function create_teacher_in_course(): array {
        $course = $this->getDataGenerator()->create_course();
        $teacher = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($teacher->id, $course->id, 'editingteacher');
        $this->setUser($teacher);
        return [$course, $teacher];
    }

    // Un test por clase :manage sin cobertura previa.

    public function test_exam_generate_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\exam_generate::execute($course->id, ['00000000-0000-0000-0000-000000000001']);
    }

    /**
     * exam_generate valida "al menos un documento" ANTES de llegar a
     * backend_client (línea ~98 de exam_generate.php) — 100% testable sin
     * mockear nada, siempre que el usuario SÍ tenga :manage (si no,
     * require_capability tira primero — ver test de arriba).
     */
    public function test_exam_generate_rejects_empty_document_ids_before_reaching_backend(): void {
        $this->resetAfterTest();
        [$course] = $this->create_teacher_in_course();

        $this->expectException(\invalid_parameter_exception::class);
        \local_nexusai\external\exam_generate::execute($course->id, []);
    }

    public function test_analytics_dashboard_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\analytics_dashboard::execute($course->id);
    }

    public function test_analytics_faq_topics_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\analytics_faq_topics::execute($course->id);
    }

    public function test_gaps_list_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\gaps_list::execute($course->id);
    }

    public function test_gaps_archive_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\gaps_archive::execute($course->id, [], true);
    }

    public function test_document_upload_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_upload::execute($course->id, 'a.pdf', 'application/pdf', '');
    }

    public function test_document_status_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_status::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_delete_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_delete::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_preview_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_preview::execute($course->id, '00000000-0000-0000-0000-000000000001');
    }

    public function test_document_replace_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_replace::execute(
            $course->id,
            '00000000-0000-0000-0000-000000000001',
            'a.pdf',
            'application/pdf',
            ''
        );
    }

    public function test_get_pending_uploads_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\get_pending_uploads::execute($course->id);
    }

    public function test_confirm_pending_upload_requires_manage(): void {
        $this->resetAfterTest();
        [$course] = $this->create_student_in_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\confirm_pending_upload::execute($course->id, 1);
    }

    // La función dismiss_pending_upload es diseño deliberado, sin capability check.

    /**
     * Confirma el diseño documentado en dismiss_pending_upload.php: opera
     * únicamente sobre la user preference del usuario LOGUEADO ($USER
     * actual, nunca un parámetro), así que (a) no requiere ninguna
     * capability puntual — cualquier alumno logueado puede llamarla sin
     * excepción — y (b) está aislada por usuario: dos alumnos con
     * entradas "pendientes" bajo el mismo cmid no se pisan entre sí.
     */
    public function test_dismiss_pending_upload_does_not_require_manage_and_is_scoped_per_user(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $owner = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($owner->id, $course->id, 'student');
        $this->getDataGenerator()->enrol_user($other->id, $course->id, 'student');

        $pending = json_encode([
            '55' => [
                'courseid'   => $course->id,
                'filename'   => 'a.pdf',
                'mimetype'   => 'application/pdf',
                'context_id' => 1,
            ],
        ]);
        set_user_preference(\local_nexusai\observer::PENDING_PREF, $pending, $owner->id);

        // El usuario "other" no tiene ningún rol especial y llama dismiss para el
        // MISMO cmid que "owner" tiene pendiente — no debería tirar
        // ninguna excepción de capability (ni de ningún tipo).
        $this->setUser($other);
        $result = \local_nexusai\external\dismiss_pending_upload::execute(55);
        $this->assertTrue($result['success']);

        // La preference de "owner" no se tocó — dismiss_pending_upload solo
        // opera sobre la preference del usuario logueado ($USER actual),
        // nunca sobre la de otro usuario aunque comparta el mismo cmid.
        $ownerpref = json_decode(
            get_user_preferences(\local_nexusai\observer::PENDING_PREF, '{}', $owner->id),
            true
        );
        $this->assertArrayHasKey(
            '55',
            $ownerpref,
            'dismiss_pending_upload no debe afectar la preference de otro usuario'
        );
    }
}
