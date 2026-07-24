<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * External function `local_nexusai_calendar_alerts_list`.
 *
 * Devuelve las alertas de calendario activas del alumno en el curso.
 * Accesible para usuarios con capability `local/nexusai:use`.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\external;

defined('MOODLE_INTERNAL') || die();
require_once($GLOBALS['CFG']->libdir . '/externallib.php');

class calendar_alerts_list extends \external_api {

    public static function execute_parameters(): \external_function_parameters {
        return new \external_function_parameters([
            'userid'   => new \external_value(PARAM_INT, 'ID del usuario', VALUE_REQUIRED),
            'courseid' => new \external_value(PARAM_INT, 'ID del curso',   VALUE_REQUIRED),
        ]);
    }

    public static function execute_returns(): \external_single_structure {
        return new \external_single_structure([
            'alerts' => new \external_multiple_structure(
                new \external_single_structure([
                    'event_id'    => new \external_value(PARAM_INT,  'ID del evento en Moodle'),
                    'days_before' => new \external_value(PARAM_INT,  'Días de anticipación configurados'),
                    'notified'    => new \external_value(PARAM_BOOL, 'True si el cron ya envió la notificación'),
                ])
            ),
        ]);
    }

    public static function execute(int $userid, int $courseid): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'userid'   => $userid,
            'courseid' => $courseid,
        ]);

        $context = \context_course::instance($params['courseid']);
        self::validate_context($context);
        require_capability('local/nexusai:use', $context);

        $client   = new backend_client();
        $response = $client->list_calendar_alerts((int) $params['userid'], (int) $params['courseid']);

        return [
            'alerts' => array_map(
                static fn(array $a) => [
                    'event_id'    => (int)  ($a['event_id']    ?? 0),
                    'days_before' => (int)  ($a['days_before'] ?? 0),
                    'notified'    => (bool) ($a['notified']    ?? false),
                ],
                $response['alerts'] ?? []
            ),
        ];
    }
}
