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
 * Tests for backend_client — HMAC authentication.
 *
 * What's verified:
 *  1. compute_signature() produces a 64-character hex string (SHA-256).
 *  2. The signature changes when the body changes (integrity).
 *  3. The signature changes when the secret changes (tenant isolation).
 *  4. The PHP algorithm is compatible with the Python one:
 *     signed_string = timestamp + nonce + body → hmac-sha256(secret, signed_string).
 *
 * Private methods are accessed via ReflectionMethod so they can be tested
 * without exposing the public API or making real HTTP calls.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;

/**
 * Tests for backend_client's HMAC authentication.
 *
 * @covers \local_nexusai\external\backend_client
 */
final class backend_client_test extends \advanced_testcase {
    // Reflection helper.

    /**
     * Invokes a private/protected static method via ReflectionMethod.
     *
     * @param string $method Method name.
     * @param array  $args   Positional arguments.
     * @return mixed The method's return value.
     */
    private function invoke_static(string $method, array $args = []): mixed {
        $ref = new \ReflectionMethod(backend_client::class, $method);
        $ref->setAccessible(true);
        return $ref->invoke(null, ...$args);
    }

    // Test 1: HMAC signature format.

    /**
     * compute_signature() must return a 64-character hex string,
     * the standard format for SHA-256 as hexadecimal.
     * This value goes in the X-Signature header of every request to the backend.
     */
    public function test_compute_signature_returns_64_char_hex(): void {
        $sig = $this->invoke_static('compute_signature', [
            'mysecret',
            '1716649200',
            'abc123nonce456',
            '{"course_id":1,"filename":"test.pdf"}',
        ]);

        $this->assertIsString($sig);
        $this->assertEquals(
            64,
            strlen($sig),
            'SHA-256 in hexadecimal must be exactly 64 characters long'
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{64}$/',
            $sig,
            'The signature must contain only lowercase hex characters'
        );
    }

    // Test 2: integrity — the signature changes with the body.

    /**
     * If the body changes (even a single byte), the signature must be different.
     * This guarantees the backend can detect body tampering.
     */
    public function test_compute_signature_differs_when_body_changes(): void {
        $common = ['sharedsecret32chars', '1716649200', 'nonce-test-abc'];

        $sig1 = $this->invoke_static(
            'compute_signature',
            [...$common, '{"course_id":1}']
        );
        $sig2 = $this->invoke_static(
            'compute_signature',
            [...$common, '{"course_id":2}']
        );

        $this->assertNotEquals(
            $sig1,
            $sig2,
            'The signature must change if the body changes'
        );
    }

    // Test 3: isolation — the signature changes with the secret.

    /**
     * Two instances with a different shared_secret produce different
     * signatures for the same body, guaranteeing isolation between tenants.
     */
    public function test_compute_signature_differs_when_secret_changes(): void {
        $common = ['1716649200', 'nonce-test-abc', '{"hello":"world"}'];

        $sig1 = $this->invoke_static(
            'compute_signature',
            ['secret-A-32-chars-long', ...$common]
        );
        $sig2 = $this->invoke_static(
            'compute_signature',
            ['secret-B-32-chars-long', ...$common]
        );

        $this->assertNotEquals(
            $sig1,
            $sig2,
            'The signature must change if the shared_secret changes'
        );
    }

    // Test 4: PHP ↔ Python compatibility.

    /**
     * The PHP algorithm must produce exactly the same result as Python:
     *   signed_string = (timestamp + nonce).encode("utf-8") + body.encode("utf-8")
     *   signature = hmac.new(secret.encode(), signed_string, sha256).hexdigest()
     *
     * In PHP:
     *   $signedstring = $timestamp . $nonce . $body;
     *   return hash_hmac('sha256', $signedstring, $secret);
     *
     * Both concatenations produce the same byte sequence, so the result
     * must be identical.
     */
    public function test_compute_signature_compatible_with_python_algorithm(): void {
        $secret    = 'test-shared-secret-32chars';
        $timestamp = '1716649200';
        $nonce     = 'testnonce9876';
        $body      = '{"course_id":1,"uploader_id":42}';

        // Expected calculation (same algorithm as the Python side).
        $signedstring = $timestamp . $nonce . $body;
        $expected = hash_hmac('sha256', $signedstring, $secret);

        $actual = $this->invoke_static(
            'compute_signature',
            [$secret, $timestamp, $nonce, $body]
        );

        $this->assertEquals(
            $expected,
            $actual,
            'The PHP signing algorithm must produce the same result as the Python one'
        );
    }

    // Test 5: generate_nonce — format and uniqueness.

    /**
     * generate_nonce() must return a 32-character hex string,
     * and two consecutive calls must not produce the same value.
     */
    public function test_generate_nonce_returns_unique_hex_strings(): void {
        $nonce1 = $this->invoke_static('generate_nonce');
        $nonce2 = $this->invoke_static('generate_nonce');

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{32}$/',
            $nonce1,
            'The nonce must be a 32-character hex string (16 bytes)'
        );
        $this->assertNotEquals(
            $nonce1,
            $nonce2,
            'Two consecutive nonces must not be equal'
        );
    }
}
