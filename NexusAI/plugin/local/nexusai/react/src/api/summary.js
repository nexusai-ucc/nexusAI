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

import { randomFloat } from "./random";

/**
 * API client for the automatic document summary (BUS-03) and for the
 * multi-document pre-exam review summary (BUS-04).
 * Calls local_nexusai_document_summarize / local_nexusai_document_pre_exam_summary
 * through core/ajax.
 */

const _MOCK_SUMMARY = `This document covers the core concepts of the topic, in sections that go from the theoretical foundations to practical application. It presents key definitions, worked examples and exercises. The material is aimed at university students and is a reference for the practical activities of the course.`;

const _MOCK_PRE_EXAM_SUMMARY = `For this exam, the main topics to review are the theoretical foundations, their practical applications and the reference exercises (notes.pdf). Pay special attention to the key definitions and the worked examples, since exam questions are usually based on them.`;

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        return await new Promise((resolve, reject) =>
            window.require(["core/ajax"], resolve, reject)
        );
    } catch { return null; }
}

/**
 * Generates a summary of the document using the backend's LLM.
 *
 * @param {Object} params
 * @param {string} params.documentId  UUID of the document to summarize.
 * @param {number} params.courseId    Moodle course ID.
 * @returns {Promise<{document_id, document_filename, summary, chunks_used, total_chunks}>}
 */
export async function summarizeDocument({ documentId, courseId }) {
    if (!documentId) throw new Error("document_id es requerido");

    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise(r => setTimeout(r, 1200 + randomFloat() * 600));
        return {
            document_id:       documentId,
            document_filename: "document.pdf",
            summary:           _MOCK_SUMMARY,
            chunks_used:       12,
            total_chunks:      15,
        };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_document_summarize",
        args: { documentid: documentId, courseid: courseId },
    }]);
    const response = await responsePromise;

    return response;
}

/**
 * Generates a review summary combining all the indexed material relevant
 * for an upcoming exam, optionally limited to one section of the
 * course (BUS-04).
 *
 * @param {number} courseId Moodle course ID.
 * @param {number|null} [section] Optional section (BUS-05).
 * @returns {Promise<{summary:string, documents_used:Array, total_documents:number}>}
 */
export async function getPreExamSummary(courseId, section = null) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise(r => setTimeout(r, 1200 + randomFloat() * 600));
        return {
            summary:          _MOCK_PRE_EXAM_SUMMARY,
            documents_used:   [{ document_id: "mock-1", filename: "notes.pdf" }],
            total_documents:  1,
        };
    }

    const [responsePromise] = ajax.call([{
        methodname: "local_nexusai_document_pre_exam_summary",
        args: { courseid: courseId, section },
    }]);
    const response = await responsePromise;

    return response;
}
