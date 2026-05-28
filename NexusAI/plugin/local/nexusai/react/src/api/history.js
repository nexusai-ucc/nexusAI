/**
 * Cliente API del historial de conversaciones (Feature E).
 *
 * Llama a las external functions:
 *   - local_nexusai_chat_sessions_list  → listado del sidebar
 *   - local_nexusai_chat_session_messages → mensajes para retomar conversación
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
 * Lista sesiones previas del usuario.
 *
 * @param {Object}  params
 * @param {number}  params.courseId
 * @param {boolean} [params.scopeCourse]  Default true: solo este curso. false: todas.
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
 * Carga los mensajes de una sesión existente.
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
