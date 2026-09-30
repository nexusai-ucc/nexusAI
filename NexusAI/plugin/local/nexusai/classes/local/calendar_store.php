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
 * Calendar reminders chosen by students, and the forum digest webhook (DATA-05).
 *
 * Ported from services/api/app/calendar/router.py and the webhook part of
 * forums/router.py.
 *
 * @package    local_nexusai
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_nexusai\local;

/**
 * Reads and writes calendar reminders and forum webhooks.
 */
class calendar_store {
    /**
     * Creates, changes or (with 0 days) removes a reminder for an event.
     *
     * @param int $userid Student.
     * @param int $courseid Course.
     * @param int $eventid Moodle event.
     * @param string $eventname Event name.
     * @param int $eventtimestamp Event start.
     * @param int $daysbefore Days before to remind; 0 removes the reminder.
     * @return array{id:?string, days_before:int}
     */
    public static function save(
        int $userid,
        int $courseid,
        int $eventid,
        string $eventname,
        int $eventtimestamp,
        int $daysbefore
    ): array {
        global $DB;
        $existing = $DB->get_record('local_nexusai_cal_alerts', ['userid' => $userid, 'eventid' => $eventid]);
        if ($daysbefore === 0) {
            if ($existing) {
                $DB->delete_records('local_nexusai_cal_alerts', ['id' => $existing->id]);
            }
            return ['id' => null, 'days_before' => 0];
        }
        $name = \core_text::substr($eventname, 0, 200);
        if ($existing) {
            $existing->courseid = $courseid;
            $existing->eventname = $name;
            $existing->eventtimestamp = $eventtimestamp;
            $existing->daysbefore = $daysbefore;
            $existing->notified = 0;
            $DB->update_record('local_nexusai_cal_alerts', $existing);
            return ['id' => $existing->uuid, 'days_before' => $daysbefore];
        }
        $uuid = store_util::uuid();
        $DB->insert_record('local_nexusai_cal_alerts', (object) [
            'uuid' => $uuid,
            'userid' => $userid,
            'courseid' => $courseid,
            'eventid' => $eventid,
            'eventname' => $name,
            'eventtimestamp' => $eventtimestamp,
            'daysbefore' => $daysbefore,
            'notified' => 0,
            'timecreated' => time(),
        ]);
        return ['id' => $uuid, 'days_before' => $daysbefore];
    }

    /**
     * The student's reminders in a course.
     *
     * @param int $userid Student.
     * @param int $courseid Course.
     * @return array[] [{event_id, days_before, notified}]
     */
    public static function list(int $userid, int $courseid): array {
        global $DB;
        $rows = $DB->get_records('local_nexusai_cal_alerts', ['userid' => $userid, 'courseid' => $courseid], 'id');
        return array_values(array_map(static fn($r) => [
            'event_id' => (int) $r->eventid,
            'days_before' => (int) $r->daysbefore,
            'notified' => (bool) $r->notified,
        ], $rows));
    }

    /**
     * Reminders whose moment has come and were not sent yet.
     *
     * @param int $now Unix time.
     * @return \stdClass[]
     */
    public static function due(int $now): array {
        global $DB;
        return array_values($DB->get_records_select(
            'local_nexusai_cal_alerts',
            'daysbefore > 0 AND notified = 0 AND eventtimestamp - daysbefore * :day <= :now',
            ['day' => DAYSECS, 'now' => $now],
            'id'
        ));
    }

    /**
     * Marks a reminder as sent so it is not sent again.
     *
     * @param int $id Reminder id.
     */
    public static function mark_notified(int $id): void {
        global $DB;
        $DB->set_field('local_nexusai_cal_alerts', 'notified', 1, ['id' => $id]);
    }

    /**
     * Saves the course's forum digest webhook; an empty URL removes it.
     *
     * @param int $courseid Course.
     * @param string $url http(s) URL, or empty.
     * @return string|null The saved URL.
     */
    public static function save_webhook(int $courseid, string $url): ?string {
        global $DB;
        $existing = $DB->get_record('local_nexusai_forum_webhooks', ['courseid' => $courseid]);
        if ($url === '') {
            if ($existing) {
                $DB->delete_records('local_nexusai_forum_webhooks', ['id' => $existing->id]);
            }
            return null;
        }
        $now = time();
        if ($existing) {
            $existing->webhookurl = $url;
            $existing->timemodified = $now;
            $DB->update_record('local_nexusai_forum_webhooks', $existing);
        } else {
            $DB->insert_record('local_nexusai_forum_webhooks', (object) [
                'courseid' => $courseid,
                'webhookurl' => $url,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        return $url;
    }

    /**
     * The course's forum digest webhook, if any.
     *
     * @param int $courseid Course.
     * @return string|null
     */
    public static function webhook(int $courseid): ?string {
        global $DB;
        $url = $DB->get_field('local_nexusai_forum_webhooks', 'webhookurl', ['courseid' => $courseid]);
        return $url === false ? null : (string) $url;
    }
}
