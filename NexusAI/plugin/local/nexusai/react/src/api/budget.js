// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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
