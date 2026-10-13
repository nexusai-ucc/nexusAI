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
 * Chat API client — transport layer between React and the Moodle plugin.
 *
 * Architecture flow (see ADR-001 + ADR-005):
 *
 *   React  ─→  core/ajax (Moodle)  ─→  External Function PHP
 *                                              │
 *                                              ▼
 *                                   backend_client (cURL + HMAC)
 *                                              │
 *                                              ▼
 *                                   FastAPI /api/v1/chat/messages
 *
 * The Moodle plugin exposes an External Function `local_nexusai_chat_send` that
 * acts as a proxy. React only passes the question, courseid, userid and session_id;
 * the HMAC signature and the backend endpoint are handled by PHP on the server.
 *
 * MOCK MODE:
 * If Moodle's `core/ajax` module is not available (e.g. local React dev
 * outside Moodle, or Storybook), we fall back to a mock that simulates
 * delayed answers and shows the UI without a backend.
 */

// ============================================================
// MOCK SERVER (only for dev outside Moodle)
// ============================================================
// Messages the widget shows when it refuses a question or the stream breaks,
// in the language of the Moodle interface (the `lang` the widget receives).
const CHAT_ERRORS = {
    es: {
        empty: "La pregunta no puede estar vacía",
        tooLong: "La pregunta es demasiado larga (máximo 2000 caracteres)",
        connectionClosed: "La conexión se cerró antes de terminar la respuesta.",
    },
    en: {
        empty: "The question cannot be empty",
        tooLong: "The question is too long (maximum 2000 characters)",
        connectionClosed: "The connection closed before the answer was complete.",
    },
};

const MOCK_RESPONSES = [
    "Esta es una respuesta de prueba del asistente. Cuando el cliente PHP esté implementado, vas a ver respuestas reales del LLM con contexto del material del curso.",
    "Perfecto, podés seguir preguntando. El historial de la conversación se está guardando en la base de datos.",
    "Para responder esa pregunta sobre tu materia, normalmente buscaría en los PDFs subidos por tu profesor mediante similitud semántica con pgvector. Por ahora estoy en modo mock.",
    "Recordá que puedo ayudarte con dudas sobre el contenido del curso, generar resúmenes, o crear quizzes de práctica.",
];

let mockSessionMessages = [];
let mockResponseIdx = 0;

async function mockSendMessage({ question, sessionId }) {
    // Simulate the LLM's latency (between 600ms and 1.4s)
    const delay = 600 + Math.random() * 800;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const newSessionId = sessionId || `mock-session-${Date.now()}`;
    const userMessage = {
        id: `mock-msg-${Date.now()}-u`,
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
    };
    const answer = MOCK_RESPONSES[mockResponseIdx % MOCK_RESPONSES.length];
    mockResponseIdx++;
    const assistantMessage = {
        id: `mock-msg-${Date.now()}-a`,
        role: "assistant",
        content: answer,
        created_at: new Date(Date.now() + 50).toISOString(),
    };
    mockSessionMessages = [...mockSessionMessages, userMessage, assistantMessage];

    return {
        session_id: newSessionId,
        answer,
        messages: mockSessionMessages,
    };
}

// ============================================================
// CLIENTE REAL (Moodle core/ajax)
// ============================================================
let cachedFetchMany = null;

async function getMoodleAjax() {
    // Lazy-loaded because core/ajax is an AMD module that only exists inside
    // Moodle. Importing it at the top level breaks Webpack in the standalone
    // build (Storybook / dev outside Moodle).
    if (cachedFetchMany) return cachedFetchMany;

    if (typeof window === "undefined" || !window.M || !window.M.cfg) {
        // No estamos dentro de Moodle.
        return null;
    }

    try {
        // require() global de RequireJS dentro de Moodle.
        const ajax = await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
        cachedFetchMany = ajax.call;
        return cachedFetchMany;
    } catch {
        return null;
    }
}

/**
 * Sends a message to the assistant. Returns { session_id, answer, messages }.
 *
 * @param {Object}  params
 * @param {string}  params.question     Student's question (1..2000 chars).
 * @param {number}  params.courseId     Moodle course ID.
 * @param {number}  params.userId       ID of the logged-in user.
 * @param {string}  [params.sessionId]  Existing session UUID (optional).
 * @param {boolean} [params.multiCourse] If true, searches all of the student's courses.
 * @param {string}  [params.lang]       Interface language for the error messages ('es' | 'en').
 * @returns {Promise<{session_id:string, answer:string, messages:Array}>}
 */
export async function sendMessage({ question, courseId, userId, sessionId, multiCourse = false, lang = "es" }) {
    const errors = CHAT_ERRORS[lang] || CHAT_ERRORS.es;
    if (!question || !question.trim()) {
        throw new Error(errors.empty);
    }
    if (question.length > 2000) {
        throw new Error(errors.tooLong);
    }

    const fetchMany = await getMoodleAjax();

    // Mock mode — only when we are NOT inside Moodle.
    if (!fetchMany) {
        return mockSendMessage({ question, sessionId });
    }

    // Real mode — through core/ajax to Moodle's External Function.
    // This methodname must match the one declared in db/services.php
    // (classes/external/chat_send.php).
    const args = {
        question,
        courseid:    courseId,
        userid:      userId,
        multicourse: multiCourse,
    };
    if (sessionId) {
        args.sessionid = sessionId;
    }

    const [response] = await fetchMany([
        {
            methodname: "local_nexusai_chat_send",
            args,
        },
    ]);

    // If the External Function returns an error, core/ajax rejects on its own.
    // If it returns OK, we expect the same shape as the Python backend:
    //   { session_id, answer, messages: [{id, role, content, created_at}, ...] }
    return response;
}

/**
 * Resets the mock state (handy for tests or for "new conversation").
 */
export function resetMockState() {
    mockSessionMessages = [];
    mockResponseIdx = 0;
}

/**
 * Stores the student's 👍/👎 vote on one chat answer
 * (ASIST-01 / #321). Best effort: if it fails, it must not block the chat UI
 * — the caller only uses the result to update the local visual state.
 *
 * @param {Object} params
 * @param {string} params.messageId  Real UUID of the message (not the temporary
 *   local id streaming uses before `done` arrives).
 * @param {number} params.courseId
 * @param {boolean} params.isHelpful true = 👍, false = 👎.
 * @param {string} [params.comment]  Optional short comment (only with 👎).
 * @returns {Promise<{ok:boolean}>}
 */
export async function submitMessageFeedback({ messageId, courseId, isHelpful, comment = "" }) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        // Mock mode (outside Moodle): there is no real backend to store it.
        return { ok: true };
    }

    const [response] = await fetchMany([
        {
            methodname: "local_nexusai_chat_message_feedback",
            args: {
                courseid:  courseId,
                messageid: messageId,
                ishelpful: isHelpful,
                comment:   comment || "",
            },
        },
    ]);

    return response;
}


// ============================================================
// STREAMING — Server-Sent Events through the PHP proxy endpoint
// ============================================================

/**
 * Sends a message in streaming mode. Tokens arrive one by one via SSE.
 *
 * Flow: React → fetch to /local/nexusai/chat_stream.php → cURL to the Python
 *       backend → LLM streaming → SSE back to the browser as it arrives.
 *
 * @param {Object}  params
 * @param {string}  params.question
 * @param {number}  params.courseId
 * @param {string}  [params.sessionId]
 * @param {boolean} [params.multiCourse]
 * @param {string}  [params.lang]       Interface language for the error messages ('es' | 'en').
 * @param {Object}  callbacks
 * @param {(meta:{session_id:string,chunks:number}) => void} [callbacks.onMeta]
 * @param {(token:string) => void}                          callbacks.onToken
 * @param {(stats:{prompt_tokens:number,completion_tokens:number,total_tokens:number}) => void} [callbacks.onDone]
 * @param {(detail:string) => void}                         [callbacks.onError]
 * @returns {Promise<void>} resolves when the stream ends
 */
export async function sendMessageStream(
    { question, courseId, sessionId, multiCourse = false, lang = "es" },
    { onMeta, onToken, onDone, onError, onAnswerMeta } = {}
) {
    const errors = CHAT_ERRORS[lang] || CHAT_ERRORS.es;
    if (!question || !question.trim()) {
        throw new Error(errors.empty);
    }

    // Outside Moodle: fall back to the sync mock (no streaming in mock mode).
    if (typeof window === "undefined" || !window.M?.cfg) {
        const fake = await mockSendMessage({ question, sessionId });
        onMeta?.({ session_id: fake.session_id, chunks: 0 });
        // Simulate streaming by splitting the answer into words.
        const words = fake.answer.split(" ");
        for (const w of words) {
            await new Promise((r) => setTimeout(r, 30));
            onToken?.(w + " ");
        }
        onDone?.({ prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
        return;
    }

    const url = `${window.M.cfg.wwwroot}/local/nexusai/chat_stream.php`;
    const body = new URLSearchParams();
    body.set("sesskey", window.M.cfg.sesskey);
    body.set("question", question);
    body.set("courseid", String(courseId));
    if (sessionId) body.set("sessionid", sessionId);
    if (multiCourse) body.set("multicourse", "1");

    const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Accept": "text/event-stream",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    // If the stream is cut (proxy timeout, lost connection) without a "done"
    // or "error" event ever arriving, no callback used to fire: the student
    // kept seeing the empty answer bubble forever, with no visible error.
    // We track it to be able to warn.
    let receivedTerminalEvent = false;

    const processRawEvent = (rawEvent) => {
        for (const line of rawEvent.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            let parsed;
            try { parsed = JSON.parse(json); }
            catch { continue; }

            switch (parsed.type) {
                case "meta":        onMeta?.(parsed); break;
                case "token":       onToken?.(parsed.content || ""); break;
                case "answer_meta": onAnswerMeta?.(parsed); break;
                case "done":        receivedTerminalEvent = true; onDone?.(parsed); break;
                case "error":       receivedTerminalEvent = true; onError?.(parsed.detail || "stream error"); break;
            }
        }
    };

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE separates events with "\n\n". We process the complete ones and
        // leave any partial event in the buffer.
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const rawEvent = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            processRawEvent(rawEvent);
        }
    }

    // The reader finished. If an event without the final "\n\n" is left in the
    // buffer (the connection was cut in the middle of an event), we process it
    // anyway — best effort, but it recovers the common case where only the
    // closing delimiter was missing.
    if (buffer.trim()) {
        processRawEvent(buffer);
    }

    // Nobody fired "done" or "error": the connection closed without any
    // explicit sign. We warn so the UI does not hang.
    if (!receivedTerminalEvent) {
        onError?.(errors.connectionClosed);
    }
}
