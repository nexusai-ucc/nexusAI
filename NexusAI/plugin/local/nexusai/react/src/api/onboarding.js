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
 * API client of the teacher onboarding (ONB-02 / #425, ONB-05 / #428).
 *
 * Calls the external functions:
 *   - local_nexusai_course_setup_state    → course setup state
 *   - local_nexusai_onboarding_state_get  → dismissal + "not applicable" steps
 *   - local_nexusai_onboarding_state_set  → stores dismissal + "not applicable"
 *
 * Outside Moodle (Storybook / dev server) it returns mocks so the tutorial
 * (ONB-03/04/05/06) can be developed in isolation.
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

const MOCK_STATE = {
    courseid: 0,
    sections: { present: true, count: 3 },
    groups: { present: false, count: 0 },
    students: { present: true, count: 12 },
    forums: { present: false, count: 0 },
    calendar: { present: false, count: 0 },
    material: { present: true, count: 8 },
};

/**
 * Setup state of a course: which signals are already there and which are missing.
 *
 * `material.present` can be `null` if the NexusAI backend did not answer
 * — the UI must treat that case as "unknown" (neither ✓ nor pending), not as
 * "missing".
 *
 * @param {number} courseId
 * @returns {Promise<{courseid:number, sections:Signal, groups:Signal, students:Signal, forums:Signal, calendar:Signal, material:Signal}>}
 *   where Signal = { present: boolean|null, count: number }
 */
export async function getCourseSetupState(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 300));
        return { ...MOCK_STATE, courseid: courseId || 0 };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_course_setup_state",
        args: { courseid: courseId },
    }]);
    const response = await responsePromise;

    return response;
}

const MOCK_ONBOARDING_STATE = { courseid: 0, dismissed: false, skipped: [] };

/**
 * Dismissal/progress state of the tutorial for the current user and a course.
 *
 * @param {number} courseId
 * @returns {Promise<{courseid:number, dismissed:boolean, skipped:string[]}>}
 */
export async function getOnboardingState(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return { ...MOCK_ONBOARDING_STATE, courseid: courseId || 0 };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_onboarding_state_get",
        args: { courseid: courseId },
    }]);
    const response = await responsePromise;

    return response;
}

/**
 * Stores the dismissal/progress state of the tutorial. Full replacement:
 * the caller sends the final, already merged state (read-modify-write on the
 * component side), not a delta.
 *
 * @param {number} courseId
 * @param {{dismissed: boolean, skipped: string[]}} state
 * @returns {Promise<{success: boolean}>}
 */
export async function setOnboardingState(courseId, { dismissed, skipped }) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return { success: true };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_onboarding_state_set",
        args: { courseid: courseId, dismissed: !!dismissed, skipped: skipped || [] },
    }]);
    const response = await responsePromise;

    return response;
}
