/**
 * Cliente API de secciones del curso (BUS-05).
 *
 * Llama a `local_nexusai_course_sections_list` — usado tanto por el
 * selector de sección al subir material (DocumentsManager.jsx) como por
 * el filtro de búsqueda (SearchPanel.jsx).
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
 * Lista las secciones (número + nombre) de un curso.
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
