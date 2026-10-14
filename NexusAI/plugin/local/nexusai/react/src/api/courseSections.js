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
