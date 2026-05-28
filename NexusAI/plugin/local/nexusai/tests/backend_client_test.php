<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests de backend_client — autenticación HMAC.
 *
 * Qué se verifica:
 *  1. compute_signature() produce un string hex de 64 caracteres (SHA-256).
 *  2. La firma cambia cuando cambia el body (integridad).
 *  3. La firma cambia cuando cambia el secret (aislamiento de tenants).
 *  4. El algoritmo PHP es compatible con el Python:
 *     signed_string = timestamp + nonce + body → hmac-sha256(secret, signed_string).
 *
 * Los métodos privados se acceden mediante ReflectionMethod para poder
 * testearlos sin exponer la API pública ni levantar HTTP.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\tests;

defined('MOODLE_INTERNAL') || die();

use local_nexusai\external\backend_client;

/**
 * Tests de autenticación HMAC del backend_client.
 *
 * @covers \local_nexusai\external\backend_client
 */
class backend_client_test extends \advanced_testcase {

    // ============================================================
    // Helper de reflexión
    // ============================================================

    /**
     * Invoca un método estático privado/protegido via ReflectionMethod.
     *
     * @param string $method Nombre del método.
     * @param array  $args   Argumentos posicionales.
     * @return mixed Valor de retorno del método.
     */
    private function invoke_static(string $method, array $args = []): mixed {
        $ref = new \ReflectionMethod(backend_client::class, $method);
        $ref->setAccessible(true);
        return $ref->invoke(null, ...$args);
    }

    // ============================================================
    // Test 1: formato de la firma HMAC
    // ============================================================

    /**
     * compute_signature() debe retornar una cadena hex de 64 caracteres,
     * el formato estándar de SHA-256 como hexadecimal.
     * Este valor va en el header X-Signature de cada request al backend.
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
            'SHA-256 en hexadecimal debe tener exactamente 64 caracteres'
        );
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{64}$/',
            $sig,
            'La firma debe contener solo caracteres hexadecimales en minúscula'
        );
    }

    // ============================================================
    // Test 2: integridad — la firma cambia con el body
    // ============================================================

    /**
     * Si el body cambia (incluso un solo byte), la firma debe ser distinta.
     * Esto garantiza que el backend puede detectar body tampering.
     */
    public function test_compute_signature_differs_when_body_changes(): void {
        $common = ['sharedsecret32chars', '1716649200', 'nonce-test-abc'];

        $sig1 = $this->invoke_static('compute_signature',
            [...$common, '{"course_id":1}']);
        $sig2 = $this->invoke_static('compute_signature',
            [...$common, '{"course_id":2}']);

        $this->assertNotEquals(
            $sig1,
            $sig2,
            'La firma debe cambiar si el body cambia'
        );
    }

    // ============================================================
    // Test 3: aislamiento — la firma cambia con el secret
    // ============================================================

    /**
     * Dos instancias con distinto shared_secret producen firmas distintas
     * para el mismo body, garantizando aislamiento entre tenants.
     */
    public function test_compute_signature_differs_when_secret_changes(): void {
        $common = ['1716649200', 'nonce-test-abc', '{"hello":"world"}'];

        $sig1 = $this->invoke_static('compute_signature',
            ['secret-A-32-chars-long', ...$common]);
        $sig2 = $this->invoke_static('compute_signature',
            ['secret-B-32-chars-long', ...$common]);

        $this->assertNotEquals(
            $sig1,
            $sig2,
            'La firma debe cambiar si el shared_secret cambia'
        );
    }

    // ============================================================
    // Test 4: compatibilidad PHP ↔ Python
    // ============================================================

    /**
     * El algoritmo PHP debe producir exactamente el mismo resultado que Python:
     *   signed_string = (timestamp + nonce).encode("utf-8") + body.encode("utf-8")
     *   signature = hmac.new(secret.encode(), signed_string, sha256).hexdigest()
     *
     * En PHP:
     *   $signedstring = $timestamp . $nonce . $body;
     *   return hash_hmac('sha256', $signedstring, $secret);
     *
     * Ambas concatenaciones producen el mismo byte sequence, así que el
     * resultado debe ser idéntico.
     */
    public function test_compute_signature_compatible_with_python_algorithm(): void {
        $secret    = 'test-shared-secret-32chars';
        $timestamp = '1716649200';
        $nonce     = 'testnonce9876';
        $body      = '{"course_id":1,"uploader_id":42}';

        // Cálculo esperado (mismo algoritmo que Python side).
        $signed_string = $timestamp . $nonce . $body;
        $expected = hash_hmac('sha256', $signed_string, $secret);

        $actual = $this->invoke_static('compute_signature',
            [$secret, $timestamp, $nonce, $body]);

        $this->assertEquals(
            $expected,
            $actual,
            'El algoritmo PHP de firma debe producir el mismo resultado que el Python'
        );
    }

    // ============================================================
    // Test 5: generate_nonce — formato y unicidad
    // ============================================================

    /**
     * generate_nonce() debe retornar un string hex de 32 caracteres
     * y dos llamadas consecutivas no deben producir el mismo valor.
     */
    public function test_generate_nonce_returns_unique_hex_strings(): void {
        $nonce1 = $this->invoke_static('generate_nonce');
        $nonce2 = $this->invoke_static('generate_nonce');

        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{32}$/',
            $nonce1,
            'El nonce debe ser un string hex de 32 caracteres (16 bytes)'
        );
        $this->assertNotEquals(
            $nonce1,
            $nonce2,
            'Dos nonces consecutivos no deben ser iguales'
        );
    }
}
