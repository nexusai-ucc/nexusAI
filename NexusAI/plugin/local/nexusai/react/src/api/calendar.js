/**
 * Cliente del calendario del curso (CAL-01, CAL-04).
 *
 * A diferencia del resto de los api/*.js de este plugin, NO llama a una
 * external function local_nexusai_* — llama DIRECTO a webservices nativas
 * de Moodle vía core/ajax. No hay backend Python ni HMAC involucrados:
 * Moodle ya las expone con ajax=true globalmente y su implementación real
 * (calendar/externallib.php) solo valida que el usuario esté logueado y
 * matriculado en el curso — no exige ninguna capability adicional para leer.
 *
 * CAL-04 (#319): `core_calendar_get_action_events_by_course` (ya se usaba)
 * SOLO trae "action events" — eventos ligados a un módulo con proveedor de
 * acción (fecha de entrega de una Tarea, cierre de un Quiz). Un evento
 * genérico creado directamente desde el calendario nativo de Moodle (ej.
 * "Feriado", un aviso puntual sin actividad asociada) nunca aparece ahí.
 * Se combina con `core_calendar_get_calendar_events` (trae eventos crudos,
 * confirmado contra el código fuente real de Moodle —
 * calendar/externallib.php), descartando de esa segunda respuesta las
 * filas que YA vienen de la primera (tienen `modulename` seteado) para no
 * duplicar entregas/exámenes reales.
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
    {
        id: 3,
        name: "Feriado — no hay clase",
        timestart: Math.floor(Date.now() / 1000) + 6 * 86400,
        timesort: Math.floor(Date.now() / 1000) + 6 * 86400,
        overdue: false,
        component: "course",
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
 * Trae los eventos genéricos de curso (CAL-04) — los que
 * `get_action_events_by_course` no devuelve porque no están ligados a un
 * módulo con proveedor de acción de calendario. Descarta las filas con
 * `modulename` seteado (esas ya las trae la otra llamada) y normaliza el
 * resto al mismo shape que ya consume CalendarPanel.jsx.
 */
async function fetchGenericCourseEvents(ajax, courseId, timestart, timeend) {
    const [responsePromise] = ajax.call([{
        methodname: "core_calendar_get_calendar_events",
        args: {
            events: { courseids: [courseId] },
            options: { userevents: false, siteevents: false, timestart, timeend, ignorehidden: true },
        },
    }]);
    const response = await responsePromise;
    const wwwroot = window.M?.cfg?.wwwroot || "";

    return (response?.events || [])
        .filter((e) => !e.modulename)
        .map((e) => ({
            id: e.id,
            name: e.name,
            timestart: e.timestart,
            timesort: e.timestart,
            overdue: false,
            component: "course",
            url: `${wwwroot}/calendar/view.php?view=day&course=${courseId}&time=${e.timestart}`,
        }));
}

/**
 * Próximos eventos del curso: entregas/exámenes reales (action events) +
 * avisos genéricos creados a mano en el calendario nativo (CAL-04, #319).
 *
 * @param {number} courseId
 * @param {number} [days] Ventana hacia adelante en días (default 30).
 * @returns {Promise<Array>} Eventos combinados, ordenados por timesort.
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
    const [actionEventsPromise] = ajax.call([{
        methodname: "core_calendar_get_action_events_by_course",
        args: { courseid: courseId, timesortfrom, timesortto, limitnum: 20 },
    }]);

    const [actionResponse, genericEvents] = await Promise.all([
        actionEventsPromise,
        fetchGenericCourseEvents(ajax, courseId, timesortfrom, timesortto).catch(() => []),
    ]);

    const actionEvents = actionResponse?.events || [];

    return [...actionEvents, ...genericEvents].sort((a, b) => a.timesort - b.timesort);
}
