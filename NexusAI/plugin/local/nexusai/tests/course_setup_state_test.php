<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests de la External Function `local_nexusai_course_setup_state` (ONB-02 / #425).
 *
 * Qué se verifica:
 *  1. execute_returns() declara las 6 señales con la forma { present, count }.
 *  2. signal() marca present según el conteo (incluye borde: 0 y negativos).
 *  3. material_signal() traduce la respuesta del backend y degrada a null
 *     cuando el backend no respondió.
 *  4. gather_moodle_signals() sobre un curso recién creado → todo en false.
 *  5. gather_moodle_signals() detecta sección con contenido, foro, grupo,
 *     alumno matriculado y evento de calendario cuando existen.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

defined('MOODLE_INTERNAL') || die();

/**
 * @covers \local_nexusai\external\course_setup_state
 */
class course_setup_state_test extends \advanced_testcase {

    // ============================================================
    // Test 1: estructura de execute_returns()
    // ============================================================

    public function test_execute_returns_declares_all_signals(): void {
        $returns = \local_nexusai\external\course_setup_state::execute_returns();

        $this->assertInstanceOf(\external_single_structure::class, $returns);

        $keys = $returns->keys;
        foreach (['courseid', 'sections', 'groups', 'students', 'forums', 'calendar', 'material'] as $key) {
            $this->assertArrayHasKey($key, $keys, "execute_returns() debe declarar '$key'");
        }

        foreach (['sections', 'groups', 'students', 'forums', 'calendar', 'material'] as $signal) {
            $this->assertInstanceOf(
                \external_single_structure::class,
                $keys[$signal],
                "'$signal' debe ser una estructura { present, count }"
            );
            $this->assertArrayHasKey('present', $keys[$signal]->keys);
            $this->assertArrayHasKey('count', $keys[$signal]->keys);
        }
    }

    // ============================================================
    // Test 2: signal() — present según el conteo
    // ============================================================

    public function test_signal_present_reflects_count(): void {
        $cls = \local_nexusai\external\course_setup_state::class;

        $this->assertSame(['present' => false, 'count' => 0], $cls::signal(0));
        $this->assertSame(['present' => true, 'count' => 1], $cls::signal(1));
        $this->assertSame(['present' => true, 'count' => 42], $cls::signal(42));
        // Un conteo negativo (no debería pasar) se normaliza a 0 / false.
        $this->assertSame(['present' => false, 'count' => 0], $cls::signal(-3));
    }

    // ============================================================
    // Test 3: material_signal() — traducción y degradación
    // ============================================================

    public function test_material_signal_null_when_backend_absent(): void {
        $result = \local_nexusai\external\course_setup_state::material_signal(null);
        $this->assertNull($result['present'], 'Backend caído → present desconocido (null)');
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

        // Sin la clave has_indexed_content: se infiere del conteo.
        $inferred = $cls::material_signal(['document_count' => 3]);
        $this->assertTrue($inferred['present']);
        $this->assertSame(3, $inferred['count']);
    }

    // ============================================================
    // Test 4: curso vacío → todas las señales de Moodle en false
    // ============================================================

    public function test_gather_moodle_signals_empty_course(): void {
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course();
        $context = \context_course::instance($course->id);

        $signals = \local_nexusai\external\course_setup_state::gather_moodle_signals($course->id, $context);

        foreach (['sections', 'groups', 'students', 'forums', 'calendar'] as $key) {
            $this->assertFalse($signals[$key]['present'], "Curso vacío: '$key' no debería estar presente");
            $this->assertSame(0, $signals[$key]['count']);
        }
    }

    // ============================================================
    // Test 5: curso armado → señales detectadas
    // ============================================================

    public function test_gather_moodle_signals_detects_content(): void {
        global $DB;
        $this->resetAfterTest();

        $course = $this->getDataGenerator()->create_course(['numsections' => 3]);
        $context = \context_course::instance($course->id);

        // Foro en la sección 1 → activa 'forums' y 'sections'.
        $this->getDataGenerator()->create_module('forum', ['course' => $course->id], ['section' => 1]);

        // Grupo.
        $this->getDataGenerator()->create_group(['courseid' => $course->id]);

        // Alumno matriculado (rol student por defecto).
        $student = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($student->id, $course->id);

        // Evento de calendario propio del curso.
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

        $this->assertTrue($signals['sections']['present'], 'La sección con el foro debería contar');
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
