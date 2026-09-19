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
 * Tests for backend_client::extract_stream_error_detail().
 *
 * FEAT-06 (#481, daily limit): the SSE proxy (chat_stream.php) has to emit
 * a well-formed `data: {...}\n\n` event when the backend returns an error
 * (e.g. 429 rate limit) instead of forwarding the raw JSON, which React's
 * SSE parser silently discards for not starting with "data:" — before this
 * fix, the student was left staring at the "typing" indicator hung forever
 * with no visible error.
 *
 * @package    local_nexusai
 * @category   test
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai;

use local_nexusai\external\backend_client;

/**
 * Tests for backend_client::extract_stream_error_detail().
 *
 * @covers \local_nexusai\external\backend_client::extract_stream_error_detail
 */
final class stream_error_detail_test extends \advanced_testcase {
    /**
     * Our own rate limiter sends a structured `detail` — an object, not a
     * string — with a `message` already written for the student. It has
     * to be preferred over anything else.
     */
    public function test_prefiere_el_message_estructurado_del_rate_limiter(): void {
        $body = json_encode([
            'detail' => [
                'error'      => 'rate_limit_exceeded',
                'scope'      => 'daily',
                'message'    => 'Alcanzaste tu límite de 50 consultas de hoy. Volvé a intentarlo mañana.',
                'limit'      => 50,
                'window_sec' => 86400,
            ],
        ]);

        $result = backend_client::extract_stream_error_detail($body, 429);

        $this->assertEquals(
            'Alcanzaste tu límite de 50 consultas de hoy. Volvé a intentarlo mañana.',
            $result
        );
    }

    /**
     * The per-minute limit has to give a DIFFERENT message than the daily
     * one — that's this PR's whole reason to exist: so the frontend can
     * tell them apart.
     */
    public function test_distingue_el_mensaje_de_minuto_del_de_diario(): void {
        $bodyminute = json_encode([
            'detail' => [
                'error'   => 'rate_limit_exceeded',
                'scope'   => 'minute',
                'message' => 'Superaste el límite de 20 consultas por minuto. Esperá un momento y volvé a intentarlo.',
            ],
        ]);
        $bodydaily = json_encode([
            'detail' => [
                'error'   => 'rate_limit_exceeded',
                'scope'   => 'daily',
                'message' => 'Alcanzaste tu límite de 50 consultas de hoy. Volvé a intentarlo mañana.',
            ],
        ]);

        $minutemsg = backend_client::extract_stream_error_detail($bodyminute, 429);
        $dailymsg  = backend_client::extract_stream_error_detail($bodydaily, 429);

        $this->assertNotEquals($minutemsg, $dailymsg);
        $this->assertStringContainsString('minuto', $minutemsg);
        $this->assertStringContainsString('mañana', $dailymsg);
    }

    /**
     * A plain string `detail` (not structured — e.g. a generic 503 from
     * the backend) also has to be shown, not lost.
     */
    public function test_usa_el_detail_string_plano_cuando_no_es_estructurado(): void {
        $body = json_encode(['detail' => 'El LLM no está disponible temporalmente']);

        $result = backend_client::extract_stream_error_detail($body, 503);

        $this->assertEquals('El LLM no está disponible temporalmente', $result);
    }

    /**
     * An empty body or broken JSON (connection cut off mid error-response)
     * shouldn't break anything — it falls back to a readable message with the status.
     */
    public function test_cae_al_fallback_con_body_vacio_o_json_roto(): void {
        $this->assertEquals('HTTP 500', backend_client::extract_stream_error_detail('', 500));
        $this->assertEquals(
            'HTTP 502',
            backend_client::extract_stream_error_detail('{esto no es json', 502)
        );
    }

    /**
     * A structured `detail` with no `message` (unexpected shape) also
     * falls back instead of failing or showing something empty.
     */
    public function test_cae_al_fallback_si_el_detail_estructurado_no_tiene_message(): void {
        $body = json_encode(['detail' => ['error' => 'something_else']]);

        $result = backend_client::extract_stream_error_detail($body, 500);

        $this->assertEquals('HTTP 500', $result);
    }
}
