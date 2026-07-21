/**
 * Cliente API para resumen automático de documentos (BUS-03).
 * Llama a local_nexusai_document_summarize vía core/ajax.
 */

const _MOCK_SUMMARY = `Este documento aborda los conceptos fundamentales del tema, organizados en secciones temáticas que van desde los fundamentos teóricos hasta la aplicación práctica. Se presentan definiciones clave, ejemplos ilustrativos y ejercicios de aplicación. El material está orientado a estudiantes de nivel universitario y sirve como referencia para las actividades prácticas del curso.`;

async function getMoodleAjax() {
    if (typeof window === "undefined" || !window.M?.cfg) return null;
    try {
        return await new Promise((resolve, reject) =>
            window.require(["core/ajax"], resolve, reject)
        );
    } catch { return null; }
}

/**
 * Genera un resumen del documento usando el LLM del backend.
 *
 * @param {Object} params
 * @param {string} params.documentId  UUID del documento a resumir.
 * @param {number} params.courseId    ID del curso de Moodle.
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
