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
 * Tests for the `local_nexusai_document_list` External Function.
 *
 * What's verified:
 *  1. That execute_returns() declares all expected fields,
 *     including the new created_at / updated_at (CONT-05).
 *  2. That the array mapping produces the correct fields when
 *     the backend returns timestamps.
 *  3. That the mapping correctly handles the absence of timestamps
 *     (compat with pre-CONT-05 backends).
 *
 * These tests need no DB or Moodle context: they verify pure logic.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

/**
 * Tests for the document_list external function.
 *
 * @covers \local_nexusai\external\document_list
 * @runTestsInSeparateProcesses
 */
final class document_list_test extends \advanced_testcase {
    // Test 1: execute_returns() structure.

    /**
     * execute_returns() must declare all required fields, including the
     * CONT-05 ones (created_at, updated_at).
     *
     * The contract is {total, items[]} (pagination, UX-17/#387), not a
     * bare list -- this test assumed the old, pre-pagination shape, and
     * was never actually run until now (issue #474) for anyone to notice.
     */
    public function test_execute_returns_declares_required_fields(): void {
        $returns = \local_nexusai\external\document_list::execute_returns();

        $this->assertInstanceOf(
            \external_single_structure::class,
            $returns,
            'execute_returns() must return external_single_structure with {total, items}'
        );

        $topkeys = $returns->keys;
        $this->assertArrayHasKey('total', $topkeys);
        $this->assertArrayHasKey('items', $topkeys);

        $items = $topkeys['items'];
        $this->assertInstanceOf(
            \external_multiple_structure::class,
            $items,
            'items must be external_multiple_structure'
        );

        $inner = $items->content;
        $this->assertInstanceOf(
            \external_single_structure::class,
            $inner,
            'items\' content must be external_single_structure'
        );

        $keys = $inner->keys;

        // Base fields.
        $this->assertArrayHasKey('id', $keys);
        $this->assertArrayHasKey('course_id', $keys);
        $this->assertArrayHasKey('uploader_id', $keys);
        $this->assertArrayHasKey('filename', $keys);
        $this->assertArrayHasKey('mime_type', $keys);
        $this->assertArrayHasKey('status', $keys);
        $this->assertArrayHasKey('error_message', $keys);

        // CONT-05: timestamp fields.
        $this->assertArrayHasKey(
            'created_at',
            $keys,
            'created_at must be declared in execute_returns() (CONT-05)'
        );
        $this->assertArrayHasKey(
            'updated_at',
            $keys,
            'updated_at must be declared in execute_returns() (CONT-05)'
        );
    }

    // Test 2: mapping with timestamps present.

    /**
     * When the backend returns created_at and updated_at, the mapped
     * array must include them correctly.
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
            'created_at must be mapped from the backend response'
        );
        $this->assertEquals(
            '2026-05-25T10:05:30+00:00',
            $mapped['updated_at'],
            'updated_at must be mapped from the backend response'
        );
    }

    // Test 3: mapping without timestamps (backward compat).

    /**
     * If the backend doesn't return created_at / updated_at (versions
     * predating migration 004), the mapping must produce null
     * in those fields with no error.
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
            'created_at must be null if it\'s not in the backend response'
        );
        $this->assertNull(
            $mapped['updated_at'],
            'updated_at must be null if it\'s not in the backend response'
        );
        $this->assertEquals('pending', $mapped['status']);
    }

    /**
     * Empty list from the backend → empty result with no error.
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

    // Helper: replica of execute()'s mapping closure.

    /**
     * Replica of the array_map closure in document_list.php's execute().
     * Lets the data transformation be tested without needing a Moodle context.
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
