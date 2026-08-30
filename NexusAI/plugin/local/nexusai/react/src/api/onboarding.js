/**
 * Cliente API del onboarding al docente (ONB-02 / #425).
 *
 * Llama a la external function:
 *   - local_nexusai_course_setup_state → estado de setup del curso
 *
 * Fuera de Moodle (Storybook / dev server) devuelve un mock con un curso
 * a medio armar, para poder desarrollar el tutorial (ONB-03/04) aislado.
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
 * Estado de setup de un curso: qué señales ya están y cuáles faltan.
 *
 * `material.present` puede ser `null` si el backend de NexusAI no respondió
 * — la UI debe tratar ese caso como "no sé" (ni ✓ ni pendiente), no como
 * "falta".
 *
 * @param {number} courseId
 * @returns {Promise<{courseid:number, sections:Signal, groups:Signal, students:Signal, forums:Signal, calendar:Signal, material:Signal}>}
 *   donde Signal = { present: boolean|null, count: number }
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
