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

import { randomFloat } from "./random";

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * API client of the semantic search (Feature A).
 * Calls `local_nexusai_search_query` through core/ajax. Outside Moodle
 * it falls back to a mock so the UI can be seen in standalone dev.
 */

const MOCK_RESULTS = [
    {
        document_id: "mock-uuid-1",
        document_filename: "apunte-estructuras.pdf",
        course_id: 0,
        course_name: "",
        chunk_index: 3,
        content: "Los árboles binarios de búsqueda (BST) son estructuras de datos donde cada nodo tiene como máximo dos hijos...",
        similarity: 0.87,
        mime_type: "application/pdf",
        section: 1,
    },
    {
        document_id: "mock-uuid-2",
        document_filename: "tp2-enunciado.pdf",
        course_id: 0,
        course_name: "",
        chunk_index: 1,
        content: "El trabajo práctico consiste en implementar una tabla hash con resolución de colisiones por encadenamiento...",
        similarity: 0.74,
        mime_type: "application/pdf",
        section: 2,
    },
    {
        document_id: "mock-uuid-3",
        document_filename: "diapositivas-unidad2.pptx",
        course_id: 0,
        course_name: "",
        chunk_index: 0,
        content: "Complejidad temporal: notación Big-O para el análisis de algoritmos de búsqueda y ordenamiento...",
        similarity: 0.68,
        mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        section: null,
    },
];

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
 * Searches fragments of the course material.
 *
 * @param {Object}  params
 * @param {string}  params.query        Search query.
 * @param {number}  params.courseId     Moodle course ID.
 * @param {number}  [params.topK]       Number of results (default 5).
 * @param {boolean} [params.global]     true to search all the user's courses.
 * @param {string}  [params.materialType] Filter by the document's mime type (BUS-02).
 * @param {number}  [params.section]    Filter by course section (BUS-05).
 * @param {boolean} [params.sectionUnassigned] Filter only material with no section assigned (BUS-05).
 * @returns {Promise<{query:string, total:number, results:Array}>}
 */
export async function searchMaterial({
    query, courseId, topK = 5, global: isGlobal = false, materialType = "",
    section = null, sectionUnassigned = false,
}) {
    if (!query?.trim()) {
        throw new Error("The search cannot be empty");
    }

    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 600 + randomFloat() * 400));
        let filtered = materialType
            ? MOCK_RESULTS.filter((r) => r.mime_type === materialType)
            : MOCK_RESULTS;
        if (sectionUnassigned) {
            filtered = filtered.filter((r) => r.section === null || r.section === undefined);
        } else if (section !== null && section !== undefined) {
            filtered = filtered.filter((r) => r.section === section);
        }
        return { query, total: filtered.length, results: filtered };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_search_query",
        args: {
            query: query.trim(),
            courseid: courseId,
            topk: topK,
            global: isGlobal,
            materialtype: materialType,
            section: section === null || section === undefined ? -1 : section,
            sectionunassigned: sectionUnassigned,
        },
    }]);
    const response = await responsePromise;

    return response;
}
