<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_chat_message_feedback`.
 *
 * ASIST-01 (#321): guarda el voto 👍/👎 del alumno sobre una respuesta
 * puntual del asistente, ligado a `messages.id`. Anónimo por diseño del
 * lado del backend — este proxy solo resuelve $USER->id real del server
 * (nunca confía en un userid del cliente) antes de mandarlo a hashear.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_message_feedback extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'  => new \external_value(PARAM_INT, 'ID del curso', VALUE_REQUIRED),
            'messageid' => new \external_value(PARAM_ALPHANUMEXT, 'ID del mensaje (UUID)', VALUE_REQUIRED),
            'ishelpful' => new \external_value(PARAM_BOOL, 'true = 👍, false = 👎', VALUE_REQUIRED),
            'comment'   => new \external_value(PARAM_TEXT, 'Comentario corto opcional (solo con 👎)', VALUE_DEFAULT, ''),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'true si se guardó correctamente'),
        ]);
    }

    public static function execute(int $courseid, string $messageid, bool $ishelpful, string $comment = ''): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'  => $courseid,
            'messageid' => $messageid,
            'ishelpful' => $ishelpful,
            'comment'   => $comment,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $cleancomment = trim($params['comment']);
        if (mb_strlen($cleancomment) > 1000) {
            $cleancomment = mb_substr($cleancomment, 0, 1000);
        }

        $client   = new backend_client();
        $response = $client->submit_message_feedback(
            $params['messageid'],
            (int) $params['courseid'],
            (int) $USER->id,
            (bool) $params['ishelpful'],
            $cleancomment !== '' ? $cleancomment : null
        );

        return [
            'ok' => (bool) ($response['ok'] ?? true),
        ];
    }
}
