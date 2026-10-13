/**
 * API client for the automatic document summary (BUS-03) and for the
 * multi-document pre-exam review summary (BUS-04).
 * Calls local_nexusai_document_summarize / local_nexusai_document_pre_exam_summary
 * through core/ajax.
 */

const _MOCK_SUMMARY = `Este documento aborda los conceptos fundamentales del tema, organizados en secciones temáticas que van desde los fundamentos teóricos hasta la aplicación práctica. Se presentan definiciones clave, ejemplos ilustrativos y ejercicios de aplicación. El material está orientado a estudiantes de nivel universitario y sirve como referencia para las actividades prácticas del curso.`;

const _MOCK_PRE_EXAM_SUMMARY = `Para este examen, los temas principales a repasar son los fundamentos teóricos, sus aplicaciones prácticas y los ejercicios de referencia (apuntes.pdf). Se recomienda prestar especial atención a las definiciones clave y a los ejemplos resueltos, ya que suelen ser la base de las consignas de evaluación.`;

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
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
        return {
            document_id:       documentId,
            document_filename: "documento.pdf",
            summary:           _MOCK_SUMMARY,
            chunks_used:       12,
            total_chunks:      15,
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_document_summarize",
        args: { documentid: documentId, courseid: courseId },
    }]);

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
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
        return {
            summary:          _MOCK_PRE_EXAM_SUMMARY,
            documents_used:   [{ document_id: "mock-1", filename: "apuntes.pdf" }],
            total_documents:  1,
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_document_pre_exam_summary",
        args: { courseid: courseId, section },
    }]);

    return response;
}
