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
 * Contract tests with the backend (TPC-07, #579).
 *
 * NexusAI/contracts/ is the single source both sides read: the backend checks
 * that its real verify_hmac accepts the signature vectors and that the sample
 * responses validate against its Pydantic models; this side checks that
 * backend_client signs the same way and that each external function processes
 * those exact responses. The contracts live in the repository, not in the
 * installed plugin, so outside a repository checkout these tests are skipped.
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
 * Contract tests for the HMAC signature and the backend responses.
 *
 * @covers \local_nexusai\external\backend_client
 * @covers \local_nexusai\external\chat_send
 * @covers \local_nexusai\external\search_query
 * @covers \local_nexusai\external\quiz_generate
 * @covers \local_nexusai\external\document_status
 */
final class contract_test extends external_testcase {
    /**
     * Where the contracts are: next to the plugin in the repository, or in the
     * repository checkout of the CI (moodle-plugin-ci copies only the plugin).
     *
     * @return string|null Directory, or null if this is not a repository checkout.
     */
    private function contracts_dir(): ?string {
        $workspace = (string) getenv('GITHUB_WORKSPACE');
        $candidates = [
            __DIR__ . '/../../../../../contracts',
            $workspace . '/plugin/NexusAI/contracts',
            $workspace . '/NexusAI/contracts',
        ];
        foreach ($candidates as $dir) {
            if (is_file($dir . '/hmac_vectors.json')) {
                return realpath($dir);
            }
        }
        return null;
    }

    /**
     * Reads a contract file, without its metadata keys (the ones starting with _).
     *
     * @param string $name File name relative to contracts/.
     * @return array Decoded contract.
     */
    private function contract(string $name): array {
        $dir = $this->contracts_dir();
        if ($dir === null) {
            $this->markTestSkipped('contracts/ is not in this checkout.');
        }
        $data = json_decode(file_get_contents($dir . '/' . $name), true);
        return array_filter($data, static fn($key) => !str_starts_with((string) $key, '_'), ARRAY_FILTER_USE_KEY);
    }

    /**
     * Criterion: backend_client produces exactly the contract signature for
     * every vector (same concatenation, encoding and lowercase hex).
     */
    public function test_signature_matches_the_contract(): void {
        // Arrange.
        $contract = $this->contract('hmac_vectors.json');
        $sign = new \ReflectionMethod(backend_client::class, 'compute_signature');
        $sign->setAccessible(true);

        foreach ($contract['vectors'] as $vector) {
            // Act.
            $signature = $sign->invoke(null, $contract['secret'], $vector['timestamp'], $vector['nonce'], $vector['body']);

            // Assert.
            $this->assertSame($vector['signature'], $signature, $vector['name']);
        }
    }

    /**
     * Criterion: chat_send turns the contract chat answer into the student's
     * conversation.
     */
    public function test_chat_send_processes_the_contract_answer(): void {
        // Arrange.
        $data = $this->setup_course();
        $answer = $this->contract('responses/chat_messages.json');
        $this->mock_backend($answer);

        // Act.
        $result = $this->call(chat_send::class, ['¿Qué es una pila?', (int) $data->course->id]);

        // Assert.
        $this->assertSame($answer['answer'], $result['answer']);
        $this->assertSame(['user', 'assistant'], array_column($result['messages'], 'role'));
    }

    /**
     * Criterion: search_query maps every field of the contract search response.
     */
    public function test_search_query_processes_the_contract_results(): void {
        // Arrange.
        $data = $this->setup_course();
        $response = $this->contract('responses/search.json');
        $this->mock_backend($response);

        // Act.
        $result = $this->call(search_query::class, ['recursión', (int) $data->course->id]);

        // Assert.
        $expected = $response['results'][0];
        $this->assertSame($response['total'], $result['total']);
        $this->assertSame($expected['document_id'], $result['results'][0]['document_id']);
        $this->assertSame($expected['chunk_index'], $result['results'][0]['chunk_index']);
        $this->assertSame($expected['section'], $result['results'][0]['section']);
    }

    /**
     * Criterion: quiz_generate keeps the questions of the contract quiz.
     */
    public function test_quiz_generate_processes_the_contract_quiz(): void {
        // Arrange.
        $data = $this->setup_course();
        $quiz = $this->contract('responses/quiz_generate.json');
        $this->mock_backend($quiz);

        // Act.
        $result = $this->call(quiz_generate::class, [(int) $data->course->id, 'Pilas']);

        // Assert.
        $this->assertSame($quiz['questions'][0]['options'], $result['questions'][0]['options']);
        $this->assertSame($quiz['questions'][0]['correct_index'], $result['questions'][0]['correct_index']);
        $this->assertSame($quiz['questions'][0]['source_document_id'], $result['questions'][0]['source_document_id']);
    }

    /**
     * Criterion: document_status maps the contract document of the course.
     */
    public function test_document_status_processes_the_contract_document(): void {
        // Arrange: the contract document, in the test course.
        $data = $this->setup_course('editingteacher');
        $document = $this->contract('responses/document.json');
        $document['course_id'] = (int) $data->course->id;
        $this->mock_backend($document);

        // Act.
        $result = $this->call(document_status::class, [(int) $data->course->id, $document['id']]);

        // Assert.
        $this->assertSame($document['status'], $result['status']);
        $this->assertSame($document['filename'], $result['filename']);
        $this->assertNull($result['error_message']);
    }
}
