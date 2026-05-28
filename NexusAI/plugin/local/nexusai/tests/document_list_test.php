<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests de la External Function `local_nexusai_document_list`.
 *
 * Qué se verifica:
 *  1. Que execute_returns() declare todos los campos esperados,
 *     incluyendo los nuevos created_at / updated_at (CONT-05).
 *  2. Que el mapeo del array produzca los campos correctos cuando
 *     el backend devuelve timestamps.
 *  3. Que el mapeo maneje correctamente la ausencia de timestamps
 *     (compatibilidad con backends anteriores a CONT-05).
 *
 * Estos tests no requieren DB ni contexto Moodle: verifican lógica pura.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

defined('MOODLE_INTERNAL') || die();

/**
 * Tests de document_list external function.
 *
 * @covers \local_nexusai\external\document_list
 */
class document_list_test extends \advanced_testcase {

    // ============================================================
    // Test 1: estructura de execute_returns()
    // ============================================================

    /**
     * execute_returns() debe declarar todos los campos requeridos,
     * incluidos los de CONT-05 (created_at, updated_at).
     */
    public function test_execute_returns_declares_required_fields(): void {
        $returns = \local_nexusai\external\document_list::execute_returns();

        $this->assertInstanceOf(
            \external_multiple_structure::class,
            $returns,
            'execute_returns() debe retornar external_multiple_structure'
        );

        $inner = $returns->content;
        $this->assertInstanceOf(
            \external_single_structure::class,
            $inner,
            'El contenido debe ser external_single_structure'
        );

        $keys = $inner->keys;

        // Campos base.
        $this->assertArrayHasKey('id', $keys);
        $this->assertArrayHasKey('course_id', $keys);
        $this->assertArrayHasKey('uploader_id', $keys);
        $this->assertArrayHasKey('filename', $keys);
        $this->assertArrayHasKey('mime_type', $keys);
        $this->assertArrayHasKey('status', $keys);
        $this->assertArrayHasKey('error_message', $keys);

        // CONT-05: campos de timestamps.
        $this->assertArrayHasKey(
            'created_at', $keys,
            'created_at debe estar declarado en execute_returns() (CONT-05)'
        );
        $this->assertArrayHasKey(
            'updated_at', $keys,
            'updated_at debe estar declarado en execute_returns() (CONT-05)'
        );
    }

    // ============================================================
    // Test 2: mapeo con timestamps presentes
    // ============================================================

    /**
     * Cuando el backend devuelve created_at y updated_at, el array
     * mapeado debe incluirlos correctamente.
     */
    public function test_mapping_includes_timestamps_when_present(): void {
        $raw = [
            'id'            => '550e8400-e29b-41d4-a716-446655440000',
            'course_id'     => 5,
            'uploader_id'   => 10,
            'filename'      => 'lecture.pdf',
            'mime_type'     => 'application/pdf',
            'status'        => 'indexed',
            'error_message' => null,
            'created_at'    => '2026-05-25T10:00:00+00:00',
            'updated_at'    => '2026-05-25T10:05:30+00:00',
        ];

        $mapped = $this->apply_mapping($raw);

        $this->assertEquals('550e8400-e29b-41d4-a716-446655440000', $mapped['id']);
        $this->assertEquals(5, $mapped['course_id']);
        $this->assertEquals(10, $mapped['uploader_id']);
        $this->assertEquals('lecture.pdf', $mapped['filename']);
        $this->assertEquals('indexed', $mapped['status']);
        $this->assertNull($mapped['error_message']);
        $this->assertEquals(
            '2026-05-25T10:00:00+00:00',
            $mapped['created_at'],
            'created_at debe mapearse desde la respuesta del backend'
        );
        $this->assertEquals(
            '2026-05-25T10:05:30+00:00',
            $mapped['updated_at'],
            'updated_at debe mapearse desde la respuesta del backend'
        );
    }

    // ============================================================
    // Test 3: mapeo sin timestamps (backward compat)
    // ============================================================

    /**
     * Si el backend no devuelve created_at / updated_at (versiones
     * anteriores a la migración 004), el mapeo debe producir null
     * en esos campos sin error.
     */
    public function test_mapping_returns_null_when_timestamps_absent(): void {
        $raw = [
            'id'          => 'abc-123',
            'course_id'   => 1,
            'uploader_id' => 7,
            'filename'    => 'doc.pdf',
            'mime_type'   => 'application/pdf',
            'status'      => 'pending',
        ];

        $mapped = $this->apply_mapping($raw);

        $this->assertNull(
            $mapped['created_at'],
            'created_at debe ser null si no viene en la respuesta del backend'
        );
        $this->assertNull(
            $mapped['updated_at'],
            'updated_at debe ser null si no viene en la respuesta del backend'
        );
        $this->assertEquals('pending', $mapped['status']);
    }

    /**
     * Lista vacía del backend → resultado vacío sin error.
     */
    public function test_mapping_empty_list_returns_empty_array(): void {
        $documents = [];
        $result = array_map(
            fn(array $d) => $this->apply_mapping($d),
            $documents
        );

        $this->assertIsArray($result);
        $this->assertCount(0, $result);
    }

    // ============================================================
    // Helper: réplica del closure de mapeo de execute()
    // ============================================================

    /**
     * Réplica del closure array_map en execute() de document_list.php.
     * Permite testear la transformación de datos sin necesitar contexto Moodle.
     */
    private function apply_mapping(array $d): array {
        return [
            'id'            => (string) ($d['id'] ?? ''),
            'course_id'     => (int) ($d['course_id'] ?? 0),
            'uploader_id'   => (int) ($d['uploader_id'] ?? 0),
            'filename'      => (string) ($d['filename'] ?? ''),
            'mime_type'     => (string) ($d['mime_type'] ?? ''),
            'status'        => (string) ($d['status'] ?? ''),
            'error_message' => $d['error_message'] ?? null,
            'created_at'    => isset($d['created_at']) ? (string) $d['created_at'] : null,
            'updated_at'    => isset($d['updated_at']) ? (string) $d['updated_at'] : null,
        ];
    }
}
