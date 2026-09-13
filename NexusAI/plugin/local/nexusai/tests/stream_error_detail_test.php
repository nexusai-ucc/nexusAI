<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Tests de backend_client::extract_stream_error_detail().
 *
 * FEAT-06 (#481, límite diario): el proxy SSE (chat_stream.php) tiene que
 * emitir un evento `data: {...}\n\n` bien armado cuando el backend devuelve
 * un error (ej. 429 de rate limit) en vez de reenviar el JSON crudo, que el
 * parser SSE de React descarta en silencio por no empezar con "data:" —
 * antes de este fix, el alumno se quedaba viendo el indicador de
 * "escribiendo" colgado para siempre sin ningún error visible.
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
 * @covers \local_nexusai\external\backend_client::extract_stream_error_detail
 */
class stream_error_detail_test extends \advanced_testcase {

    /**
     * Nuestro propio rate limiter manda un `detail` estructurado — objeto,
     * no string — con un `message` ya pensado para el alumno. Tiene que
     * preferirse por sobre cualquier otra cosa.
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
     * El límite por minuto tiene que dar un mensaje DISTINTO al diario —
     * es la razón de ser de esta PR: que el frontend pueda distinguirlos.
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
     * Un `detail` string plano (no estructurado — ej. un 503 genérico del
     * backend) también tiene que mostrarse, no perderse.
     */
    public function test_usa_el_detail_string_plano_cuando_no_es_estructurado(): void {
        $body = json_encode(['detail' => 'El LLM no está disponible temporalmente']);

        $result = backend_client::extract_stream_error_detail($body, 503);

        $this->assertEquals('El LLM no está disponible temporalmente', $result);
    }

    /**
     * Body vacío o JSON roto (conexión cortada a mitad de la respuesta de
     * error) no debe romper nada — cae a un fallback legible con el status.
     */
    public function test_cae_al_fallback_con_body_vacio_o_json_roto(): void {
        $this->assertEquals('HTTP 500', backend_client::extract_stream_error_detail('', 500));
        $this->assertEquals(
            'HTTP 502',
            backend_client::extract_stream_error_detail('{esto no es json', 502)
        );
    }

    /**
     * Un `detail` estructurado sin `message` (forma inesperada) también
     * cae al fallback en vez de fallar o mostrar algo vacío.
     */
    public function test_cae_al_fallback_si_el_detail_estructurado_no_tiene_message(): void {
        $body = json_encode(['detail' => ['error' => 'something_else']]);

        $result = backend_client::extract_stream_error_detail($body, 500);

        $this->assertEquals('HTTP 500', $result);
    }
}
