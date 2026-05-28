<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_chat_sessions_list`.
 *
 * Lista las sesiones previas del alumno para el sidebar de historial.
 * Filtro opcional por curso (default: solo el curso actual).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class chat_sessions_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'courseid'   => new \external_value(PARAM_INT, 'Curso para validar capability', VALUE_REQUIRED),
            'scopecourse' => new \external_value(
                PARAM_BOOL,
                'Si true, lista solo sesiones del curso actual. Si false, todas las del user.',
                VALUE_OPTIONAL,
                true
            ),
            'limit'      => new \external_value(PARAM_INT, 'Máximo (1..100)', VALUE_OPTIONAL, 20),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'sessions' => new \external_multiple_structure(
                new \external_single_structure([
                    'id'                   => new \external_value(PARAM_RAW, 'UUID de la sesión'),
                    'course_id'            => new \external_value(PARAM_INT, 'Curso de la sesión'),
                    'created_at'           => new \external_value(PARAM_RAW, 'ISO timestamp creación'),
                    'updated_at'           => new \external_value(PARAM_RAW, 'ISO timestamp última actividad'),
                    'last_message_preview' => new \external_value(PARAM_RAW, 'Preview del primer mensaje', VALUE_OPTIONAL, null, NULL_ALLOWED),
                    'message_count'        => new \external_value(PARAM_INT, 'Cantidad de mensajes'),
                ])
            ),
        ]);
    }

    public static function execute(int $courseid, bool $scopecourse = true, int $limit = 20): array {
        global $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid'    => $courseid,
            'scopecourse' => $scopecourse,
            'limit'       => $limit,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $limit = max(1, min(100, (int) $params['limit']));
        $scopecourseid = !empty($params['scopecourse']) ? (int) $params['courseid'] : null;

        $client   = new backend_client();
        $response = $client->list_sessions((int) $USER->id, $scopecourseid, $limit);

        $sessions = $response['sessions'] ?? [];
        return [
            'sessions' => array_map(
                static fn(array $s) => [
                    'id'                   => (string) ($s['id'] ?? ''),
                    'course_id'            => (int)    ($s['course_id'] ?? 0),
                    'created_at'           => (string) ($s['created_at'] ?? ''),
                    'updated_at'           => (string) ($s['updated_at'] ?? ''),
                    'last_message_preview' => isset($s['last_message_preview']) ? (string) $s['last_message_preview'] : null,
                    'message_count'        => (int)    ($s['message_count'] ?? 0),
                ],
                $sessions
            ),
        ];
    }
}
