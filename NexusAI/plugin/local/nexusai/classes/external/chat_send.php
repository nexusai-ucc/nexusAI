<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_chat_send`.
 *
 * Es el proxy entre el frontend React (que llega vía core/ajax) y el backend
 * Python NexusAI. Hace 5 cosas:
 *
 *   1. Valida la sesión de Moodle (require_login + capability del curso).
 *   2. Sanitiza la entrada con los external_value declarados.
 *   3. Resuelve el USERID real desde $USER (NO del cliente — sería falsificable).
 *   4. Llama a backend_client::send_message() que firma y POST-ea con HMAC.
 *   5. Devuelve la respuesta tipada según execute_returns().
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();

// Compatibilidad Moodle 4.1 LTS hasta 4.5: las clases legacy globales
// `external_api`, `external_function_parameters`, etc. siguen disponibles
// en todo el rango. El namespace `core_external\*` solo existe a partir de
// 4.2, así que evitamos depender de él.
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_send extends \external_api {

    /**
     * Define el contrato de entrada (lo que React envía vía core/ajax).
     *
     * Moodle valida estos parámetros automáticamente:
     *   - Tipos correctos (PARAM_*)
     *   - Required vs optional
     *   - Aplicar VALUE_DEFAULT si falta
     */
    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'question'  => new \external_value(
                PARAM_RAW,
                'Pregunta del alumno al asistente (1..2000 caracteres)',
                VALUE_REQUIRED
            ),
            'courseid'  => new \external_value(
                PARAM_INT,
                'ID del curso de Moodle donde se hace la pregunta',
                VALUE_REQUIRED
            ),
            // userid llega solo como hint del cliente. Lo IGNORAMOS y usamos
            // $USER->id real del lado del server (defensa contra impersonation).
            // Lo declaramos para no romper backwards compat con clientes viejos.
            'userid'    => new \external_value(
                PARAM_INT,
                'IGNORADO. El backend usa $USER->id del server. Se acepta solo por compat.',
                VALUE_OPTIONAL
            ),
            'sessionid' => new \external_value(
                PARAM_ALPHANUMEXT,
                'UUID de sesión existente, o vacío para crear una nueva',
                VALUE_OPTIONAL,
                ''
            ),
        ]);
    }

    /**
     * Define el contrato de salida (lo que devolvemos a React).
     *
     * El cliente React (chat.js) usa estas mismas claves: session_id, answer, messages.
     */
    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'session_id' => new \external_value(
                PARAM_ALPHANUMEXT,
                'UUID de la sesión (nueva o existente)'
            ),
            'answer' => new \external_value(
                PARAM_RAW,
                'Respuesta del asistente'
            ),
            'messages' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'         => new \external_value(PARAM_ALPHANUMEXT, 'UUID del mensaje'),
                    'role'       => new \external_value(PARAM_ALPHA, 'user | assistant | system'),
                    'content'    => new \external_value(PARAM_RAW, 'Texto del mensaje'),
                    'created_at' => new \external_value(PARAM_RAW, 'ISO 8601 timestamp del mensaje'),
                ]),
                'Lista completa de mensajes de la sesión, ordenados cronológicamente'
            ),
        ]);
    }

    /**
     * Lógica del endpoint.
     *
     * @param string $question
     * @param int    $courseid
     * @param int|null $userid    Ignorado — usamos $USER->id real
     * @param string|null $sessionid UUID o ''
     * @return array{session_id: string, answer: string, messages: array}
     */
    public static function execute(string $question, int $courseid, ?int $userid = 0, ?string $sessionid = ''): array {
        global $USER;

        // ----- 1. Validar parámetros (Moodle ya hizo validación de tipos) -----
        $params = self::validate_parameters(self::execute_parameters(), [
            'question'  => $question,
            'courseid'  => $courseid,
            'userid'    => $userid ?? 0,
            'sessionid' => $sessionid ?? '',
        ]);

        // ----- 2. Validar contexto del curso + capability -----
        // El curso tiene que existir Y el usuario tiene que tener acceso.
        // validate_context() también dispara require_login() internamente y
        // levanta el contexto correcto en $PAGE.
        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        // ----- 3. Validaciones de negocio -----
        $cleanquestion = trim($params['question']);
        if ($cleanquestion === '') {
            throw new \invalid_parameter_exception('Question cannot be empty');
        }
        if (mb_strlen($cleanquestion) > 2000) {
            throw new \invalid_parameter_exception('Question too long (max 2000 characters)');
        }

        // sessionid: tiene que ser un UUID v4 o vacío. PARAM_ALPHANUMEXT ya
        // bloquea injection; chequeamos largo razonable acá.
        $cleansessionid = trim($params['sessionid']);
        if ($cleansessionid !== '' && (strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64)) {
            throw new \invalid_parameter_exception('Invalid session id format');
        }
        if ($cleansessionid === '') {
            $cleansessionid = null;  // El backend acepta null para crear sesión nueva.
        }

        // ----- 4. Llamar al backend Python -----
        // userid SIEMPRE de $USER, NUNCA del parámetro. Si el atacante manda
        // un userid distinto al suyo, lo ignoramos silenciosamente.
        $client = new backend_client();
        $response = $client->send_message(
            (int) $params['courseid'],
            (int) $USER->id,
            $cleanquestion,
            $cleansessionid
        );

        // ----- 5. Validar shape de la respuesta -----
        // El backend ya validó internamente con Pydantic, pero como external
        // function tenemos que devolver exactamente el shape declarado en
        // execute_returns() o Moodle nos pega.
        if (!isset($response['session_id'], $response['answer'], $response['messages'])) {
            throw new \moodle_exception(
                'errorbackend', 'local_nexusai', '',
                'Backend response is missing required fields'
            );
        }

        return [
            'session_id' => (string) $response['session_id'],
            'answer'     => (string) $response['answer'],
            'messages'   => array_map(
                static fn(array $m) => [
                    'id'         => (string) ($m['id'] ?? ''),
                    'role'       => (string) ($m['role'] ?? ''),
                    'content'    => (string) ($m['content'] ?? ''),
                    'created_at' => (string) ($m['created_at'] ?? ''),
                ],
                $response['messages']
            ),
        ];
    }
}
