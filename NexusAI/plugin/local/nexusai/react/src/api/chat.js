/**
 * Cliente API del chat — capa de transporte entre React y el plugin Moodle.
 *
 * Flujo arquitectónico (ver ADR-001 + ADR-005):
 *
 *   React  ─→  core/ajax (Moodle)  ─→  External Function PHP
 *                                              │
 *                                              ▼
 *                                   backend_client (cURL + HMAC)
 *                                              │
 *                                              ▼
 *                                   FastAPI /api/v1/chat/messages
 *
 * El plugin Moodle expone una External Function `local_nexusai_chat_send` que
 * hace de proxy. React solo le pasa la pregunta, courseid, userid y session_id;
 * la firma HMAC y el endpoint del backend los gestiona PHP del lado del server.
 *
 * MOCK MODE:
 * Si el módulo `core/ajax` de Moodle no está disponible (ej. dev local de
 * React fuera de Moodle, o pruebas Storybook), caemos a un mock que simula
 * respuestas con delay y demuestra la UI sin necesidad de backend.
 */

// ============================================================
// MOCK SERVER (solo para dev fuera de Moodle)
// ============================================================
const MOCK_RESPONSES = [
    "Esta es una respuesta de prueba del asistente. Cuando el cliente PHP esté implementado, vas a ver respuestas reales del LLM con contexto del material del curso.",
    "Perfecto, podés seguir preguntando. El historial de la conversación se está guardando en la base de datos.",
    "Para responder esa pregunta sobre tu materia, normalmente buscaría en los PDFs subidos por tu profesor mediante similitud semántica con pgvector. Por ahora estoy en modo mock.",
    "Recordá que puedo ayudarte con dudas sobre el contenido del curso, generar resúmenes, o crear quizzes de práctica.",
];

let mockSessionMessages = [];
let mockResponseIdx = 0;

async function mockSendMessage({ question, sessionId }) {
    // Simular latencia del LLM (entre 600ms y 1.4s)
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
    // Lazy-loaded porque core/ajax es un módulo AMD que solo existe dentro
    // de Moodle. Si lo importamos a nivel top-level, Webpack rompe en el
    // build standalone (Storybook / dev fuera de Moodle).
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
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[NexusAI] core/ajax no disponible:", err);
        return null;
    }
}

/**
 * Envía un mensaje al asistente. Devuelve { session_id, answer, messages }.
 *
 * @param {Object}  params
 * @param {string}  params.question     Pregunta del alumno (1..2000 chars).
 * @param {number}  params.courseId     ID del curso de Moodle.
 * @param {number}  params.userId       ID del usuario logueado.
 * @param {string}  [params.sessionId]  UUID de sesión existente (opcional).
 * @param {boolean} [params.multiCourse] Si true, busca en todos los cursos del alumno.
 * @returns {Promise<{session_id:string, answer:string, messages:Array}>}
 */
export async function sendMessage({ question, courseId, userId, sessionId, multiCourse = false }) {
    if (!question || !question.trim()) {
        throw new Error("La pregunta no puede estar vacía");
    }
    if (question.length > 2000) {
        throw new Error("La pregunta es demasiado larga (máximo 2000 caracteres)");
    }

    const fetchMany = await getMoodleAjax();

    // Modo mock — solo cuando NO estamos en Moodle.
    if (!fetchMany) {
        return mockSendMessage({ question, sessionId });
    }

    // Modo real — vamos por core/ajax al External Function de Moodle.
    // Cuando Marcos termine db/services.php + classes/external/chat_send.php,
    // este methodname tiene que coincidir con el declarado allí.
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

    // Si el External Function devuelve un error, core/ajax lo rechaza solo.
    // Si devuelve OK, esperamos la misma forma que el backend Python:
    //   { session_id, answer, messages: [{id, role, content, created_at}, ...] }
    return response;
}

/**
 * Reset del estado mock (útil para tests o para "nueva conversación").
 */
export function resetMockState() {
    mockSessionMessages = [];
    mockResponseIdx = 0;
}


// ============================================================
// STREAMING — Server-Sent Events vía endpoint PHP proxy
// ============================================================

/**
 * Envía un mensaje en modo streaming. Los tokens llegan uno por uno via SSE.
 *
 * Flujo: React → fetch a /local/nexusai/chat_stream.php → cURL al backend
 *        Python → LLM streaming → SSE de vuelta al browser tal como llega.
 *
 * @param {Object}  params
 * @param {string}  params.question
 * @param {number}  params.courseId
 * @param {string}  [params.sessionId]
 * @param {boolean} [params.multiCourse]
 * @param {Object}  callbacks
 * @param {(meta:{session_id:string,chunks:number}) => void} [callbacks.onMeta]
 * @param {(token:string) => void}                          callbacks.onToken
 * @param {(stats:{prompt_tokens:number,completion_tokens:number,total_tokens:number}) => void} [callbacks.onDone]
 * @param {(detail:string) => void}                         [callbacks.onError]
 * @returns {Promise<void>} resuelve cuando termina el stream
 */
export async function sendMessageStream(
    { question, courseId, sessionId, multiCourse = false },
    { onMeta, onToken, onDone, onError } = {}
) {
    if (!question || !question.trim()) {
        throw new Error("La pregunta no puede estar vacía");
    }

    // Fuera de Moodle: caer al mock sync (no hay streaming en mock).
    if (typeof window === "undefined" || !window.M?.cfg) {
        const fake = await mockSendMessage({ question, sessionId });
        onMeta?.({ session_id: fake.session_id, chunks: 0 });
        // Simular streaming partiendo la respuesta en palabras.
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

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE delimita eventos con "\n\n". Procesamos los completos y dejamos
        // en el buffer cualquier evento parcial.
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
            const rawEvent = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            for (const line of rawEvent.split("\n")) {
                if (!line.startsWith("data:")) continue;
                const json = line.slice(5).trim();
                if (!json) continue;
                let parsed;
                try { parsed = JSON.parse(json); }
                catch { continue; }

                switch (parsed.type) {
                    case "meta":  onMeta?.(parsed); break;
                    case "token": onToken?.(parsed.content || ""); break;
                    case "done":  onDone?.(parsed); break;
                    case "error": onError?.(parsed.detail || "stream error"); break;
                }
            }
        }
    }
}
