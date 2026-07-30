<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_calendar_alert_save`.
 *
 * Guarda o actualiza la alerta de un alumno para un evento de calendario.
 * Si days_before=0, elimina la alerta. Accesible para usuarios con capability
 * `local/nexusai:use` (alumnos matriculados).
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class calendar_alert_save extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'userid'         => new \external_value(PARAM_INT,  'ID del usuario', VALUE_REQUIRED),
            'courseid'       => new \external_value(PARAM_INT,  'ID del curso', VALUE_REQUIRED),
            'eventid'        => new \external_value(PARAM_INT,  'ID del evento en Moodle', VALUE_REQUIRED),
            'eventname'      => new \external_value(PARAM_TEXT, 'Nombre del evento', VALUE_REQUIRED),
            'eventtimestamp' => new \external_value(PARAM_INT,  'Unix timestamp del evento', VALUE_REQUIRED),
            'daysbefore'     => new \external_value(PARAM_INT,  '0 = sin alerta, 1, 3 o 7 días antes', VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'id'          => new \external_value(PARAM_TEXT, 'UUID de la alerta (null si se eliminó)', VALUE_OPTIONAL, null, NULL_ALLOWED),
            'days_before' => new \external_value(PARAM_INT,  'Días configurados'),
        ]);
    }

    public static function execute(int $userid, int $courseid, int $eventid, string $eventname, int $eventtimestamp, int $daysbefore): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'userid'         => $userid,
            'courseid'       => $courseid,
            'eventid'        => $eventid,
            'eventname'      => $eventname,
            'eventtimestamp' => $eventtimestamp,
            'daysbefore'     => $daysbefore,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->save_calendar_alert(
            (int)    $params['userid'],
            (int)    $params['courseid'],
            (int)    $params['eventid'],
            (string) $params['eventname'],
            (int)    $params['eventtimestamp'],
            (int)    $params['daysbefore']
        );

        return [
            'id'          => $response['id'] ?? null,
            'days_before' => (int) ($response['days_before'] ?? $params['daysbefore']),
        ];
    }
}
