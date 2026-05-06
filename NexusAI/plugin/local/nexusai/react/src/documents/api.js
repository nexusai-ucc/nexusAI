/**
 * Cliente de la API de documentos NexusAI.
 *
 * Llama a las 4 External Functions de Moodle vía core/ajax. Cada llamada
 * sale firmada con sesskey de Moodle (CSRF) y, del lado server, el plugin
 * PHP la firma con HMAC y hace el POST/GET/DELETE al backend Python.
 *
 * Mock fallback: cuando se corre fuera de Moodle (dev standalone, Storybook),
 * devuelve datos de ejemplo en lugar de fallar — útil para iterar la UI.
 */

// ============================================================
// Mock state (para dev fuera de Moodle)
// ============================================================
const MOCK_DOCS = [
    {
        id: "mock-1",
        course_id: 2,
        uploader_id: 2,
        filename: "apunte-derivadas.pdf",
        mime_type: "application/pdf",
        status: "indexed",
        error_message: null,
    },
    {
        id: "mock-2",
        course_id: 2,
        uploader_id: 2,
        filename: "teorema-fundamental.pdf",
        mime_type: "application/pdf",
        status: "indexed",
        error_message: null,
    },
    {
        id: "mock-3",
        course_id: 2,
        uploader_id: 2,
        filename: "scan-clase-3.pdf",
        mime_type: "application/pdf",
        status: "error",
        error_message: "El PDF no tiene texto extraíble. Solo se admiten PDFs con texto, no escaneados.",
    },
];

// ============================================================
// Helper para obtener core/ajax de Moodle
// ============================================================
let cachedFetchMany = null;
async function getMoodleAjax() {
    if (cachedFetchMany) return cachedFetchMany;
    if (typeof window === "undefined" || !window.M || !window.M.cfg) {
        return null;
    }
    try {
        const ajax = await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            window.require(["core/ajax"], resolve, reject);
        });
        cachedFetchMany = ajax.call;
        return cachedFetchMany;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[NexusAI/documents] core/ajax no disponible:", err);
        return null;
    }
}

async function callMoodle(methodname, args) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        throw new Error("core/ajax not available (running outside Moodle)");
    }
    const [response] = await fetchMany([{ methodname, args }]);
    return response;
}

// ============================================================
// Operaciones públicas
// ============================================================

/**
 * Lista todos los documentos del curso.
 *
 * @param {number} courseId
 * @returns {Promise<Array>}
 */
export async function listDocuments(courseId) {
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 300));
        return MOCK_DOCS.filter((d) => d.course_id === courseId);
    }
    return callMoodle("local_nexusai_document_list", { courseid: courseId });
}

/**
 * Estado actual de un documento (para polling).
 *
 * @param {number} courseId
 * @param {string} documentId
 * @returns {Promise<object>}
 */
export async function getDocumentStatus(courseId, documentId) {
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 200));
        return MOCK_DOCS.find((d) => d.id === documentId);
    }
    return callMoodle("local_nexusai_document_status", {
        courseid: courseId,
        documentid: documentId,
    });
}

/**
 * Sube un archivo PDF — convierte a base64 y llama al External Function.
 *
 * @param {number} courseId
 * @param {File} file  Archivo del input HTML5 (drag-and-drop o input file)
 * @returns {Promise<object>}  Document state inicial (status='pending' o 'indexing')
 */
export async function uploadDocument(courseId, file) {
    if (!file) throw new Error("No file provided");
    if (file.type !== "application/pdf") {
        throw new Error(`Solo se aceptan PDFs en MVP. Recibido: ${file.type || "tipo desconocido"}`);
    }
    if (file.size > 20 * 1024 * 1024) {
        throw new Error(`Archivo muy grande (${formatBytes(file.size)}). Máximo: 20 MB`);
    }
    if (file.size === 0) {
        throw new Error("El archivo está vacío");
    }

    // Convertir File → base64. FileReader es async pero lo envolvemos en Promise.
    const contentB64 = await fileToBase64(file);

    // Mock fallback.
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 600));
        const mock = {
            id: `mock-${Date.now()}`,
            course_id: courseId,
            uploader_id: 2,
            filename: file.name,
            mime_type: file.type,
            status: "pending",
            error_message: null,
        };
        MOCK_DOCS.unshift(mock);
        // Simular transición de estado para demo.
        setTimeout(() => { mock.status = "indexing"; }, 1500);
        setTimeout(() => { mock.status = "indexed"; }, 4000);
        return mock;
    }

    return callMoodle("local_nexusai_document_upload", {
        courseid:    courseId,
        filename:    file.name,
        mimetype:    file.type,
        content_b64: contentB64,
    });
}

/**
 * Borra un documento.
 *
 * @param {number} courseId
 * @param {string} documentId
 */
export async function deleteDocument(courseId, documentId) {
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 200));
        const idx = MOCK_DOCS.findIndex((d) => d.id === documentId);
        if (idx >= 0) MOCK_DOCS.splice(idx, 1);
        return { success: true };
    }
    return callMoodle("local_nexusai_document_delete", {
        courseid:   courseId,
        documentid: documentId,
    });
}

// ============================================================
// Helpers
// ============================================================

/**
 * Convierte un File a string base64 (sin el prefijo `data:...;base64,`).
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // reader.result viene como "data:application/pdf;base64,XXXXX"
            // Pelamos el prefijo data URL para mandar solo el base64 puro.
            const result = reader.result;
            const commaIdx = result.indexOf(",");
            resolve(commaIdx >= 0 ? result.substring(commaIdx + 1) : result);
        };
        reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
        reader.readAsDataURL(file);
    });
}

export function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
}
