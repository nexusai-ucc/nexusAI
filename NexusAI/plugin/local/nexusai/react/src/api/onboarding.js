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

    const [response] = await ajax.call([{
        methodname: "local_nexusai_course_setup_state",
        args: { courseid: courseId },
    }]);

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

    const [response] = await ajax.call([{
        methodname: "local_nexusai_onboarding_state_get",
        args: { courseid: courseId },
    }]);

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

    const [response] = await ajax.call([{
        methodname: "local_nexusai_onboarding_state_set",
        args: { courseid: courseId, dismissed: !!dismissed, skipped: skipped || [] },
    }]);

    return response;
}
