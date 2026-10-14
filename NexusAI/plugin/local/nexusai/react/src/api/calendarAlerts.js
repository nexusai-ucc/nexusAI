// This file is part of Moodle - https://moodle.org/
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
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Calendar alerts client (CAL-02).
 *
 * Uses Moodle's external functions:
 *   - local_nexusai_calendar_alert_save  → saves/updates/deletes an alert
 *   - local_nexusai_calendar_alerts_list → lists the student's active alerts
 */

const MOCK_ALERTS = [
    { event_id: 1, days_before: 3, notified: false },
];

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        const ajax = await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
        return ajax;
    } catch {
        return null;
    }
}

/**
 * Saves or updates the alert for an event. daysBefore=0 deletes it.
 *
 * @param {{ userId: number, courseId: number, eventId: number, eventName: string, eventTimestamp: number, daysBefore: number }} params
 * @returns {Promise<{ id: string|null, days_before: number }>}
 */
export async function saveCalendarAlert({ userId, courseId, eventId, eventName, eventTimestamp, daysBefore }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return { id: daysBefore > 0 ? "mock-id" : null, days_before: daysBefore };
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_alert_save",
        args: {
            userid:         userId,
            courseid:       courseId,
            eventid:        eventId,
            eventname:      eventName,
            eventtimestamp: eventTimestamp,
            daysbefore:     daysBefore,
        },
    }]);

    return await promise;
}

/**
 * Lists the student's active alerts in the course.
 *
 * @param {number} userId
 * @param {number} courseId
 * @returns {Promise<Array<{ event_id: number, days_before: number, notified: boolean }>>}
 */
export async function listCalendarAlerts(userId, courseId) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return MOCK_ALERTS;
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_alerts_list",
        args: { userid: userId, courseid: courseId },
    }]);

    const response = await promise;
    return response?.alerts ?? [];
}

/**
 * URL of the student's subscribable .ics feed for the course (CAL-07 / #377).
 *
 * @param {number} courseId
 * @returns {Promise<string>} Absolute URL of the feed.
 */
export async function getCalendarFeedUrl(courseId) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return `https://moodle.example/local/nexusai/calendar_feed.php?token=demotoken0000000000000000000000000000000000&course=${courseId}`;
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_feed_url",
        args: { courseid: courseId },
    }]);
    const response = await promise;
    return response?.url ?? "";
}

/**
 * Rotates the feed token: the old URL stops working and a new one is
 * returned. It cuts the subscriptions of all the student's courses.
 *
 * @param {number} courseId
 * @returns {Promise<string>} New absolute URL of the feed.
 */
export async function revokeCalendarFeed(courseId) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return `https://moodle.example/local/nexusai/calendar_feed.php?token=newdemotoken000000000000000000000000000000&course=${courseId}`;
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_feed_revoke",
        args: { courseid: courseId },
    }]);
    const response = await promise;
    return response?.url ?? "";
}
