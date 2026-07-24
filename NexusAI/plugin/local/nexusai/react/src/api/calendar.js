/**
 * Cliente del calendario del curso (CAL-01).
 *
 * A diferencia del resto de los api/*.js de este plugin, NO llama a una
 * external function local_nexusai_* — llama DIRECTO a la webservice nativa
 * de Moodle `core_calendar_get_action_events_by_course` vía core/ajax. No
 * hay backend Python ni HMAC involucrados: Moodle ya expone esa función con
 * ajax=true globalmente y su implementación real (calendar/externallib.php)
 * solo valida que el usuario esté logueado y matriculado en el curso — no
 * exige ninguna capability adicional para leer.
 */

const MOCK_EVENTS = [
    {
        id: 1,
        name: "TP2 — Entrega final",
        timestart: Math.floor(Date.now() / 1000) + 3 * 86400,
        timesort: Math.floor(Date.now() / 1000) + 3 * 86400,
        overdue: false,
        component: "mod_assign",
        url: "#",
    },
    {
        id: 2,
        name: "Parcial 1",
        timestart: Math.floor(Date.now() / 1000) + 10 * 86400,
        timesort: Math.floor(Date.now() / 1000) + 10 * 86400,
        overdue: false,
        component: "mod_quiz",
        url: "#",
    },
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
 * Próximos eventos con fecha (entregas, exámenes) del curso.
 *
 * @param {number} courseId
 * @param {number} [days] Ventana hacia adelante en días (default 30).
 * @returns {Promise<Array>} Eventos ordenados por timesort (Moodle los ordena).
 */
export async function getUpcomingEvents(courseId, days = 30) {
    const ajax = await getMoodleAjax();

    const now = Math.floor(Date.now() / 1000);
    const timesortfrom = now;
    const timesortto = now + days * 86400;

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 400));
        return MOCK_EVENTS.filter((e) => e.timesort <= timesortto);
    }

    // Importante: hay que awaitear el elemento devuelto por ajax.call() antes
    // de leer sus propiedades. `ajax.call([...])` devuelve un array de
    // promesas (jQuery Deferred) — awaitear el ARRAY (en vez del elemento)
    // no lo resuelve, así que `response` seguiría siendo la promesa sin
    // resolver si se accede a `.events` en el mismo paso.
    const [responsePromise] = ajax.call([{
        methodname: "core_calendar_get_action_events_by_course",
        args: { courseid: courseId, timesortfrom, timesortto, limitnum: 20 },
    }]);
    const response = await responsePromise;

    return response?.events || [];
}
