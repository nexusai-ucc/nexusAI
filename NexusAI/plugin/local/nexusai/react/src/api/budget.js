/**
 * The user's token limit (DATA-05, #525): how much is left per hour and
 * per day, for the widget's bar. Moodle computes it with the last value the
 * backend reported or, if there is none, with its own usage record.
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
 *   null outside Moodle (demo mode) or if the call fails: the bar is not shown.
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
