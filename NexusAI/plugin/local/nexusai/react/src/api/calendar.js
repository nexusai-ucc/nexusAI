/**
 * Course calendar client (CAL-01, CAL-04).
 *
 * Unlike the rest of this plugin's api/*.js, it does NOT call a
 * local_nexusai_* external function — it calls Moodle's native web services
 * DIRECTLY through core/ajax. No Python backend or HMAC involved:
 * Moodle already exposes them with ajax=true globally and their real
 * implementation (calendar/externallib.php) only checks that the user is
 * logged in and enrolled in the course — it requires no extra capability to read.
 *
 * CAL-04 (#319): `core_calendar_get_action_events_by_course` (already used)
 * ONLY returns "action events" — events tied to a module with an action
 * provider (an Assignment due date, a Quiz closing). A generic event
 * created directly from Moodle's native calendar (e.g. "Holiday", a one-off
 * notice with no activity attached) never shows up there.
 * It is combined with `core_calendar_get_calendar_events` (returns raw events,
 * checked against Moodle's real source code —
 * calendar/externallib.php), dropping from that second response the rows
 * that ALREADY come from the first one (they have `modulename` set) so real
 * due dates/exams are not duplicated.
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
 * Fetches the generic course events (CAL-04) — the ones
 * `get_action_events_by_course` does not return because they are not tied to
 * a module with a calendar action provider. Drops the rows with
 * `modulename` set (the other call already returns those) and normalizes the
 * rest to the same shape CalendarPanel.jsx already consumes.
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
 * Upcoming course events: real due dates/exams (action events) +
 * generic notices created by hand in the native calendar (CAL-04, #319).
 *
 * @param {number} courseId
 * @param {number} [days] Window ahead in days (default 30).
 * @returns {Promise<Array>} Combined events, sorted by timesort.
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

    // Important: the element returned by ajax.call() has to be awaited before
    // reading its properties. `ajax.call([...])` returns an array of
    // promises (jQuery Deferred) — awaiting the ARRAY (instead of the element)
    // does not resolve it, so `response` would still be the unresolved promise
    // if `.events` is read in the same step.
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
