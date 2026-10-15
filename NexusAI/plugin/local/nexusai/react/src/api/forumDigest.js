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
 * Client of the weekly forum digest (FOR-06, #367) + urgency signal
 * per thread (FOR-05, #366) — a single combined endpoint, see
 * `local_nexusai_forum_weekly_digest` (teacher).
 */

const MOCK_DIGEST = {
    course_id: 0,
    period_days: 7,
    discussion_count: 2,
    discussions: [
        {
            discussion_id: 1,
            discussion_name: "No entiendo nada del parcial",
            forum_name: "Consultas generales",
            post_count: 3,
            urgent: true,
        },
        {
            discussion_id: 2,
            discussion_name: "¿Cuándo entrega el TP2?",
            forum_name: "Consultas generales",
            post_count: 2,
            urgent: false,
        },
    ],
    summary: "Esta semana hubo actividad en 2 hilos. Un alumno pidió ayuda urgente con el parcial — conviene responderle pronto. La consulta sobre la fecha del TP2 ya quedó resuelta entre los alumnos.",
};

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
 * Weekly digest of the course forum, for the teacher.
 *
 * @param {number} courseId
 * @param {number} [days=7]
 * @returns {Promise<{course_id:number, period_days:number, discussion_count:number,
 *   discussions:Array<{discussion_id:number, discussion_name:string, forum_name:string,
 *   post_count:number, urgent:boolean}>, summary:?string}>}
 */
export async function getWeeklyDigest(courseId, days = 7) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 500));
        return { ...MOCK_DIGEST, course_id: courseId, period_days: days };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_forum_weekly_digest",
        args: { courseid: courseId, days },
    }]);
    const response = await responsePromise;

    return response;
}

// FOR-07 (#378): webhook URL (Slack/Discord/Teams) set by the teacher to
// also receive the weekly digest outside Moodle.

let _mockWebhookUrl = null;

/**
 * @param {number} courseId
 * @returns {Promise<string|null>}
 */
export async function getForumWebhook(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return _mockWebhookUrl;
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_forum_webhook_get",
        args: { courseid: courseId },
    }]);
    const response = await responsePromise;

    return response.webhook_url ?? null;
}

/**
 * @param {number} courseId
 * @param {string} url An empty URL deletes the setting.
 * @returns {Promise<string|null>}
 */
export async function saveForumWebhook(courseId, url) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        _mockWebhookUrl = url || null;
        return _mockWebhookUrl;
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_forum_webhook_save",
        args: { courseid: courseId, webhookurl: url },
    }]);
    const response = await responsePromise;

    return response.webhook_url ?? null;
}
