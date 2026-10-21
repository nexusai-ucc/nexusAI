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
 * Tests for the semantic search external function (TPC-05, #577).
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/external_testcase.php');

/**
 * Tests for search_query.
 *
 * @covers \local_nexusai\external\search_query
 */
final class search_query_test extends external_testcase {
    /**
     * Criterion: a valid query returns the backend's results mapped to the
     * declared structure, with the course name filled in.
     */
    public function test_returns_the_backend_results(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'query' => 'recursion',
            'total' => 1,
            'results' => [[
                'document_id' => 'doc-1',
                'document_filename' => 'unit1.pdf',
                'course_id' => (int) $data->course->id,
                'chunk_index' => 3,
                'content' => 'Recursion is...',
                'similarity' => 0.91,
                'has_file' => true,
                'mime_type' => 'application/pdf',
                'section' => 2,
            ]],
        ]);

        // Act.
        $result = $this->call(search_query::class, ['recursion', (int) $data->course->id]);

        // Assert.
        $this->assertSame(1, $result['total']);
        $this->assertSame('doc-1', $result['results'][0]['document_id']);
        $this->assertSame(3, $result['results'][0]['chunk_index']);
        $this->assertSame(2, $result['results'][0]['section']);
        $this->assertTrue($result['results'][0]['has_file']);
    }

    /**
     * Criterion: a global search spans every course where the user can use
     * NexusAI and names the course of each result.
     */
    public function test_global_search_names_the_course_of_each_result(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend([
            'total' => 1,
            'results' => [['document_id' => 'doc-2', 'course_id' => (int) $data->course->id]],
        ]);

        // Act.
        $result = $this->call(search_query::class, [
            'query' => 'graphs',
            'courseid' => (int) $data->course->id,
            'topk' => 50,
            'global' => true,
            'section' => 1,
        ]);

        // Assert.
        $this->assertSame('graphs', $result['query']);
        $this->assertSame($data->course->fullname, $result['results'][0]['course_name']);
        $this->assertNull($result['results'][0]['section']);
    }

    /**
     * Criterion (equivalence classes of the query): blank and longer than 500
     * characters are rejected before reaching the backend.
     */
    public function test_rejects_a_blank_or_too_long_query(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;

        // Act and assert.
        $this->assert_call_fails('errorqueryempty', search_query::class, ['   ', $courseid]);
        $this->assert_call_fails('errorquerytoolong', search_query::class, [str_repeat('a', 501), $courseid]);
    }

    /**
     * Criterion: an answer without results/total is reported as a backend error.
     */
    public function test_rejects_an_incomplete_backend_answer(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->mock_backend(['detail' => 'unexpected']);

        // Act and assert.
        $this->assert_call_fails('errorbackend', search_query::class, ['trees', (int) $data->course->id]);
    }

    /**
     * Criterion: a course with NexusAI off refuses the search.
     */
    public function test_refuses_a_course_that_is_off(): void {
        // Arrange.
        $data = $this->setup_course();
        $this->disable_course((int) $data->course->id);

        // Act and assert.
        $this->assert_call_fails('coursedisabled', search_query::class, ['trees', (int) $data->course->id]);
    }
}
