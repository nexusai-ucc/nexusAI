<?php
// This file is part of the NexusAI plugin for Moodle.

/**
 * Scheduled task — envía notificaciones de calendario NexusAI (CAL-02).
 *
 * Corre cada hora. Consulta al backend FastAPI las alertas cuyo momento de
 * notificación ya llegó (now >= event_timestamp - days_before * 1 día), envía
 * la notificación nativa de Moodle a cada alumno y luego marca la alerta como
 * notificada para evitar duplicados.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\task;

defined('MOODLE_INTERNAL') || die();

class send_calendar_alerts extends \core\task\scheduled_task {

    public function get_name(): string {
        return get_string('messageprovider:cal_alert', 'local_nexusai');
    }

    public function execute(): void {
        $client = new \local_nexusai\external\backend_client();

        $due = $client->get_due_calendar_alerts();
        $alerts = $due['alerts'] ?? [];

        if (empty($alerts)) {
            return;
        }

        foreach ($alerts as $alert) {
            $userid = (int) ($alert['user_id'] ?? 0);
            if ($userid <= 0) {
                continue;
            }

            $userto = \core_user::get_user($userid);
            if (!$userto || $userto->deleted) {
                continue;
            }

            $eventname = (string) ($alert['event_name'] ?? '');

            $message                     = new \core\message\message();
            $message->component          = 'local_nexusai';
            $message->name               = 'cal_alert';
            $message->userfrom           = \core_user::get_noreply_user();
            $message->userto             = $userto;
            $message->subject            = get_string('cal_alert_subject', 'local_nexusai', $eventname);
            $message->fullmessage        = get_string('cal_alert_body', 'local_nexusai', $eventname);
            $message->fullmessageformat  = FORMAT_PLAIN;
            $message->fullmessagehtml    = '<p>' . get_string('cal_alert_body', 'local_nexusai', format_string($eventname)) . '</p>';
            $message->smallmessage       = $eventname;
            $message->notification       = 1;

            message_send($message);

            $alertid = (string) ($alert['id'] ?? '');
            if ($alertid !== '') {
                $client->mark_calendar_alert_notified($alertid);
            }
        }
    }
}
