/**
 * Cliente de alertas de calendario (CAL-02).
 *
 * Usa las external functions de Moodle:
 *   - local_nexusai_calendar_alert_save  → guarda/actualiza/elimina una alerta
 *   - local_nexusai_calendar_alerts_list → lista alertas activas del alumno
 */

const MOCK_ALERTS = [
    { event_id: 1, days_before: 3, notified: false },
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
 * Guarda o actualiza la alerta para un evento. daysBefore=0 la elimina.
 *
 * @param {{ userId: number, courseId: number, eventId: number, eventName: string, eventTimestamp: number, daysBefore: number }} params
 * @returns {Promise<{ id: string|null, days_before: number }>}
 */
export async function saveCalendarAlert({ userId, courseId, eventId, eventName, eventTimestamp, daysBefore }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return { id: daysBefore > 0 ? "mock-id" : null, days_before: daysBefore };
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_alert_save",
        args: {
            userid:         userId,
            courseid:       courseId,
            eventid:        eventId,
            eventname:      eventName,
            eventtimestamp: eventTimestamp,
            daysbefore:     daysBefore,
        },
    }]);

    return await promise;
}

/**
 * Lista las alertas activas del alumno en el curso.
 *
 * @param {number} userId
 * @param {number} courseId
 * @returns {Promise<Array<{ event_id: number, days_before: number, notified: boolean }>>}
 */
export async function listCalendarAlerts(userId, courseId) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return MOCK_ALERTS;
    }

    const [promise] = ajax.call([{
        methodname: "local_nexusai_calendar_alerts_list",
        args: { userid: userId, courseid: courseId },
    }]);

    const response = await promise;
    return response?.alerts ?? [];
}
