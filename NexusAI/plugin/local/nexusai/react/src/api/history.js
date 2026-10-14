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
 * API client of the conversation history (Feature E).
 *
 * Calls the external functions:
 *   - local_nexusai_chat_sessions_list  → sidebar list
 *   - local_nexusai_chat_session_messages → messages to resume a conversation
 *   - local_nexusai_chat_session_delete → deletes one session (ASIST-02)
 */

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
 * Lists the user's previous sessions.
 *
 * @param {Object}  params
 * @param {number}  params.courseId
 * @param {boolean} [params.scopeCourse]  Default true: only this course. false: all.
 * @param {number}  [params.limit]        Default 20.
 */
export async function listSessions({ courseId, scopeCourse = true, limit = 20 }) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock fuera de Moodle.
        return {
            sessions: [
                {
                    id: "mock-session-1",
                    course_id: courseId,
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    updated_at: new Date(Date.now() - 3600000).toISOString(),
                    last_message_preview: "¿Qué temas entran en el parcial?",
                    message_count: 4,
                },
                {
                    id: "mock-session-2",
                    course_id: courseId,
                    created_at: new Date(Date.now() - 172800000).toISOString(),
                    updated_at: new Date(Date.now() - 172800000).toISOString(),
                    last_message_preview: "Explicame cómo funciona pgvector",
                    message_count: 2,
                },
            ],
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_chat_sessions_list",
        args: { courseid: courseId, scopecourse: scopeCourse, limit },
    }]);

    return response;
}

/**
 * Loads the messages of an existing session.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.sessionId
 */
export async function getSessionMessages({ courseId, sessionId }) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock fuera de Moodle.
        return {
            session_id: sessionId,
            messages: [
                { id: "m1", role: "user", content: "Pregunta de prueba", created_at: new Date().toISOString() },
                { id: "m2", role: "assistant", content: "Respuesta de prueba mock.", created_at: new Date().toISOString() },
            ],
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_chat_session_messages",
        args: { courseid: courseId, sessionid: sessionId },
    }]);

    return response;
}

/**
 * Deletes one session from the history (ASIST-02, #350).
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.sessionId
 */
export async function deleteSession({ courseId, sessionId }) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock fuera de Moodle.
        return { success: true };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_chat_session_delete",
        args: { courseid: courseId, sessionid: sessionId },
    }]);

    return response;
}
