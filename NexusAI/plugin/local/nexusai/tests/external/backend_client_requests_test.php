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
 * Tests for the backend client requests and their error handling (TPC-05, #577).
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
 * Tests for backend_client's endpoints that no external function covers.
 *
 * @covers \local_nexusai\external\backend_client
 */
final class backend_client_requests_test extends external_testcase {
    /**
     * Criterion: each endpoint returns the decoded JSON body of the backend.
     */
    public function test_endpoints_return_the_decoded_answer(): void {
        // Arrange.
        $data = $this->setup_course();
        $courseid = (int) $data->course->id;
        $userid = (int) $data->user->id;
        $client = new backend_client();
        $this->mock_backend(
            ['text' => 'hola'],
            ['id' => 'doc-1', 'status' => 'pending'],
            ['indexed' => true],
            ['documents' => 3],
            ['rows' => [], 'next' => null],
            ['tables' => ['messages' => 10]],
            ['topics' => []],
            ['course_id' => $courseid, 'questions' => []]
        );

        // Act.
        $transcript = $client->transcribe_audio($courseid, $userid, 'audio/webm', 'bytes');
        $replaced = $client->replace_document('doc-1', 'u1.pdf', 'application/pdf', '%PDF-1.4');
        $indexed = $client->index_forum_post(1, 2, $courseid, 'texto', 3, 4);
        $stats = $client->get_course_stats($courseid);
        $export = $client->migration_export('messages', 'abc', 100);
        $summary = $client->migration_summary();
        $faq = $client->faq_topics($courseid, 30);
        $quiz = $client->generate_quiz($courseid, $userid, 'Pilas', 3, 'mix', 'easy');

        // Assert.
        $this->assertSame('hola', $transcript['text']);
        $this->assertSame('doc-1', $replaced['id']);
        $this->assertTrue($indexed['indexed']);
        $this->assertSame(3, $stats['documents']);
        $this->assertNull($export['next']);
        $this->assertSame(10, $summary['tables']['messages']);
        $this->assertSame([], $faq['topics']);
        $this->assertSame($courseid, $quiz['course_id']);
    }

    /**
     * Criterion: deleting a forum post from the index expects no body back.
     */
    public function test_delete_forum_post_ignores_the_body(): void {
        // Arrange.
        $this->setup_course();
        $client = new backend_client();
        $this->mock_backend('');

        // Act.
        $client->delete_forum_post(5);

        // Assert: reaching this point means the empty answer was accepted.
        $this->assertTrue(true);
    }

    /**
     * Criterion: a body that is not JSON is reported as a backend error.
     */
    public function test_invalid_json_is_a_backend_error(): void {
        // Arrange.
        $data = $this->setup_course();
        $client = new backend_client();
        $this->mock_backend('<html>Bad gateway</html>');

        // Act and assert.
        $this->expectException(\moodle_exception::class);
        $client->get_course_stats((int) $data->course->id);
    }

    /**
     * Criterion (equivalence classes of the config): each missing setting stops
     * the client with errorconfigmissing.
     */
    public function test_missing_config_stops_the_client(): void {
        // Arrange.
        $this->setup_course();
        $settings = ['api_endpoint', 'api_key', 'shared_secret'];

        foreach ($settings as $setting) {
            $saved = get_config('local_nexusai', $setting);
            set_config($setting, '  ', 'local_nexusai');
            try {
                // Act.
                new backend_client();
                $this->fail("Expected errorconfigmissing without $setting.");
            } catch (\moodle_exception $e) {
                // Assert.
                $this->assertSame('errorconfigmissing', $e->errorcode);
            }
            set_config($setting, $saved, 'local_nexusai');
        }
    }
}
