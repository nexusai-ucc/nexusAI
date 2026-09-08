/**
 * Cliente del resumen semanal del foro (FOR-06, #367) + señal de urgencia
 * por hilo (FOR-05, #366) — un solo endpoint combinado, ver
 * `local_nexusai_forum_weekly_digest` (docente).
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
 * Resumen semanal del foro del curso, para el docente.
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

    const [response] = await ajax.call([{
        methodname: "local_nexusai_forum_weekly_digest",
        args: { courseid: courseId, days },
    }]);

    return response;
}
