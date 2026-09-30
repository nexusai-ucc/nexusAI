/**
 * Límite de tokens del usuario (DATA-05, #525): cuánto le queda por hora y
 * por día, para la barra del widget. Lo calcula Moodle con el último valor que
 * informó el backend o, si no hay, con su propio registro de consumo.
 */

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        return await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
    } catch {
        return null;
    }
}

/**
 * @param {number} courseId
 * @returns {Promise<null|{role:string, source:string, hourly:Object, daily:Object}>}
 *   null fuera de Moodle (modo demo) o si la llamada falla: la barra no se muestra.
 */
export async function getBudgetStatus(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) return null;
    try {
        const [response] = await ajax.call([{
            methodname: "local_nexusai_budget_status",
            args: { courseid: courseId },
        }]);
        return response;
    } catch {
        return null;
    }
}
