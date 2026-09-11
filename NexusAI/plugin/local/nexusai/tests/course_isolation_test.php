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
 * Aislamiento multi-curso (QA-02, issue #312).
 *
 * Muestra representativa de external functions `local/nexusai:use` +
 * `courseid` sin cobertura previa: un alumno matriculado SOLO en el curso
 * A, llamando con el courseid de un curso B real donde no tiene ningún rol
 * asignado, debe ser rechazado. El sistema de capabilities de Moodle ya lo
 * garantiza por contexto (un rol asignado en el contexto del curso A no
 * otorga nada en el contexto del curso B) — este test lo confirma
 * explícitamente por primera vez para estas funciones, sin necesitar
 * mockear backend_client: require_capability() tira ANTES de llegar a
 * `new backend_client()` en las 4 clases cubiertas acá (mismo esqueleto
 * validate_parameters → context_course::instance → validate_context →
 * require_capability → backend_client que usa el resto del plugin).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Verifica aislamiento multi-curso en una muestra de external functions (QA-02, #312).
 *
 * @covers \local_nexusai\external\chat_send
 * @covers \local_nexusai\external\quiz_generate
 * @covers \local_nexusai\external\calendar_alert_save
 * @covers \local_nexusai\external\document_summarize
 */
final class course_isolation_test extends \advanced_testcase {
    /**
     * Alumno matriculado SOLO en $courseA (rol student). $courseB existe
     * de verdad pero es ajeno — el alumno no tiene ningún rol ahí.
     *
     * @return array{0: \stdClass, 1: \stdClass, 2: \stdClass} [$courseA, $courseB, $student]
     */
    private function create_student_isolated_from_another_course(): array {
        $coursea = $this->getDataGenerator()->create_course();
        $courseb = $this->getDataGenerator()->create_course();
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $coursea->id, 'student');
        $this->setUser($student);
        return [$coursea, $courseb, $student];
    }

    public function test_chat_send_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\chat_send::execute('hola', $courseb->id);
    }

    public function test_quiz_generate_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\quiz_generate::execute($courseb->id);
    }

    public function test_calendar_alert_save_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb, $student] = $this->create_student_isolated_from_another_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\calendar_alert_save::execute(
            $student->id,
            $courseb->id,
            1,
            'Evento ajeno',
            time() + DAYSECS,
            1
        );
    }

    public function test_document_summarize_blocks_courseid_of_a_course_the_student_is_not_enrolled_in(): void {
        $this->resetAfterTest();
        [, $courseb] = $this->create_student_isolated_from_another_course();

        $this->expectException(\required_capability_exception::class);
        \local_nexusai\external\document_summarize::execute('00000000-0000-0000-0000-000000000001', $courseb->id);
    }

    /**
     * Control positivo: el MISMO alumno sí pasa la validación de capability
     * para su propio curso — confirma que los 4 tests de arriba prueban
     * aislamiento real y no un error de parámetros/typo que tira por
     * cualquier motivo. Sin backend real en este entorno de test, se
     * espera que falle más adelante (config de backend_client ausente,
     * moodle_exception) — nunca por capability.
     */
    public function test_quiz_generate_passes_capability_check_for_the_students_own_course(): void {
        $this->resetAfterTest();
        [$coursea] = $this->create_student_isolated_from_another_course();

        try {
            \local_nexusai\external\quiz_generate::execute($coursea->id);
            $this->fail('Se esperaba una excepción al llegar a backend_client (sin config en el entorno de test)');
        } catch (\required_capability_exception $e) {
            $this->fail('No debería fallar por capability en el curso propio del alumno: ' . $e->getMessage());
        } catch (\Throwable $e) {
            // Cualquier otra excepción (típicamente moodle_exception por
            // falta de config de backend_client) confirma que la
            // capability SÍ se validó correctamente antes de llegar acá.
            $this->assertNotInstanceOf(\required_capability_exception::class, $e);
        }
    }
}
