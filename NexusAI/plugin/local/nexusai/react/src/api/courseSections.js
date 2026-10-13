/**
 * API client of the course sections (BUS-05).
 *
 * Calls `local_nexusai_course_sections_list` — used both by the section
 * selector when uploading material (DocumentsManager.jsx) and by the
 * search filter (SearchPanel.jsx).
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

/**
 * Lists the sections (number + name) of a course.
 *
 * @param {number} courseId
 * @returns {Promise<Array<{section: number, name: string}>>}
 */
export async function listCourseSections(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        // Mock fuera de Moodle.
        return [
            { section: 0, name: "General" },
            { section: 1, name: "Unidad 1" },
            { section: 2, name: "Unidad 2" },
        ];
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_course_sections_list",
        args: { courseid: courseId },
    }]);

    return response;
}
