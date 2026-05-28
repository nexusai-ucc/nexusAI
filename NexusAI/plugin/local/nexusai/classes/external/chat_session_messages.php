<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_chat_session_messages`.
 *
 * Devuelve los mensajes completos de una sesión previa para que el frontend
 * pueda continuar la conversación. El backend valida ownership de la sesión
 * contra el user_id del alumno.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_session_messages extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'Curso (para capability check)', VALUE_REQUIRED),
            'sessionid' => new \external_value(PARAM_ALPHANUMEXT, 'UUID de sesión', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'session_id' => new \external_value(PARAM_RAW, 'UUID de la sesión'),
            'messages'   => new \external_multiple_structure(
                new \external_single_structure([
                    'id'         => new \external_value(PARAM_ALPHANUMEXT, 'UUID del mensaje'),
                    'role'       => new \external_value(PARAM_ALPHA, 'user | assistant | system'),
                    'content'    => new \external_value(PARAM_RAW, 'Texto del mensaje'),
                    'created_at' => new \external_value(PARAM_RAW, 'ISO timestamp'),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, string $sessionid): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'sessionid' => $sessionid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleansessionid = trim($params['sessionid']);
        if ($cleansessionid === '' || strlen($cleansessionid) < 8 || strlen($cleansessionid) > 64) {
            throw new \invalid_parameter_exception('Invalid session id');
        }

        $client   = new backend_client();
        $response = $client->get_session_messages((int) $USER->id, $cleansessionid);

        if (!isset($response['session_id'], $response['messages'])) {
            throw new \moodle_exception('errorbackend', 'local_nexusai', '', 'Invalid session messages response');
        }

        return [
            'session_id' => (string) $response['session_id'],
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
