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
 * @param {Object} params
 * @param {string} params.question  Pregunta del alumno (1..2000 chars).
 * @param {number} params.courseId  ID del curso de Moodle.
 * @param {number} params.userId    ID del usuario logueado.
 * @param {string} [params.sessionId]  UUID de sesión existente (opcional).
 * @returns {Promise<{session_id:string, answer:string, messages:Array}>}
 */
export async function sendMessage({ question, courseId, userId, sessionId }) {
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
        courseid: courseId,
        userid: userId,
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
