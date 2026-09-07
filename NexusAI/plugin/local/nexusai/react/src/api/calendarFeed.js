/**
 * Cliente del feed de calendario suscribible (CAL-07).
 *
 * Usa las external functions de Moodle:
 *   - local_nexusai_calendar_feed_get    → get-or-create de la URL de suscripción
 *   - local_nexusai_calendar_feed_revoke → revoca el token actual
 *
 * Sin mock fallback: esta feature no tiene sentido fuera de Moodle (la URL
 * que devuelve apunta al export nativo de calendario del propio sitio).
 */

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) {
        throw new Error("core/ajax not available (running outside Moodle)");
    }
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line no-undef
        window.require(["core/ajax"], resolve, reject);
    });
}

/**
 * Get-or-create de la URL de suscripción .ics del usuario actual.
 *
 * @returns {Promise<{ enabled: boolean, url: string|null }>}
 */
export async function getCalendarFeed() {
    const ajax = await getMoodleAjax();
    const [promise] = ajax.call([{ methodname: "local_nexusai_calendar_feed_get", args: {} }]);
    return await promise;
}

/**
 * Revoca el token de suscripción actual del usuario.
 *
 * @returns {Promise<{ success: boolean }>}
 */
export async function revokeCalendarFeed() {
    const ajax = await getMoodleAjax();
    const [promise] = ajax.call([{ methodname: "local_nexusai_calendar_feed_revoke", args: {} }]);
    return await promise;
}
