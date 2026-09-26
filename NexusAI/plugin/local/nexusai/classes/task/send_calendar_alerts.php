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
 * Scheduled task — sends NexusAI calendar notifications (CAL-02).
 *
 * Runs every hour. Queries the FastAPI backend for alerts whose notification
 * time has already arrived (now >= event_timestamp - days_before * 1 day), sends
 * Moodle's native notification to each student, and then marks the alert as
 * notified to avoid duplicates.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\task;

/**
 * Sends NexusAI calendar notifications whose alert time has arrived (CAL-02).
 */
class send_calendar_alerts extends \core\task\scheduled_task {
    /**
     * Task's visible name in Site administration → Server → Scheduled tasks.
     *
     * @return string
     */
    public function get_name(): string {
        return get_string('messageprovider:cal_alert', 'local_nexusai');
    }

    /**
     * Queries the backend for due alerts, notifies each student and marks them as sent.
     */
    public function execute(): void {
        // Off site-wide: nothing to send and no reason to call the backend (CURSO-01).
        if (!\local_nexusai\local\course_guard::plugin_enabled()) {
            return;
        }

        $client = new \local_nexusai\external\backend_client();
        $client->set_role('system');

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

            // The course turned NexusAI off: the alert stays pending and goes
            // out if it is turned on again.
            $alertcourseid = (int) ($alert['course_id'] ?? 0);
            if ($alertcourseid > 0 && !\local_nexusai\local\course_guard::is_enabled($alertcourseid)) {
                continue;
            }

            $userto = \core_user::get_user($userid);
            if (!$userto || $userto->deleted) {
                continue;
            }

            $eventname = (string) ($alert['event_name'] ?? '');

            $noreply    = \core_user::get_noreply_user();
            $fromemail  = trim(get_config('local_nexusai', 'alert_from_email'));
            if (!empty($fromemail)) {
                $noreply        = clone $noreply;
                $noreply->email = $fromemail;
            }

            $message                     = new \core\message\message();
            $message->component          = 'local_nexusai';
            $message->name               = 'cal_alert';
            $message->userfrom           = $noreply;
            $message->userto             = $userto;
            $message->subject            = get_string('cal_alert_subject', 'local_nexusai', $eventname);
            $message->fullmessage        = get_string('cal_alert_body', 'local_nexusai', $eventname);
            $message->fullmessageformat  = FORMAT_PLAIN;
            $message->fullmessagehtml    = '<p>'
                . get_string('cal_alert_body', 'local_nexusai', format_string($eventname))
                . '</p>';
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
