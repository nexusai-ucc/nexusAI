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
 * Lista documentos del curso.
 *
 * UX-17 (#387): `limit`/`offset` son opcionales — sin `limit`, el backend
 * devuelve todo hasta su tope interno (lo usa ExamGeneratorPanel.jsx, que
 * necesita elegir entre todos los documentos indexados, no una página).
 *
 * @param {number} courseId
 * @param {number} [limit]  Máximo de items por página. Sin valor: sin paginar.
 * @param {number} [offset] Desde qué posición paginar (default 0).
 * @returns {Promise<{total:number, items:Array}>}
 */
export async function listDocuments(courseId, limit = null, offset = 0) {
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 300));
        const all = MOCK_DOCS.filter((d) => d.course_id === courseId);
        const items = limit != null ? all.slice(offset, offset + limit) : all;
        return { total: all.length, items };
    }
    return callMoodle("local_nexusai_document_list", { courseid: courseId, limit, offset });
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
 * Preview del texto extraído de un documento (CONT-08 / #357).
 *
 * @param {number} courseId
 * @param {string} documentId
 * @returns {Promise<{document_id:string, filename:string, status:string, preview:?string, char_count:number, truncated:boolean}>}
 */
export async function getDocumentPreview(courseId, documentId) {
    if (typeof window === "undefined" || !window.M?.cfg) {
        await new Promise((r) => setTimeout(r, 200));
        const doc = MOCK_DOCS.find((d) => d.id === documentId);
        const sample = "Una derivada mide la tasa de cambio instantánea de una función. "
            + "Formalmente, f'(x) = lim(h→0) [f(x+h) - f(x)] / h. ".repeat(12);
        return {
            document_id: documentId,
            filename: doc?.filename || "",
            status: doc?.status || "indexed",
            preview: doc?.status === "indexed" ? sample.slice(0, 600) : null,
            char_count: doc?.status === "indexed" ? 600 : 0,
            truncated: doc?.status === "indexed",
        };
    }
    return callMoodle("local_nexusai_document_preview", {
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
const ACCEPTED_MIME_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/html",
]);

// El navegador suele mandar file.type vacío (o genérico, ej. "application/octet-stream")
// para CSV, Markdown y a veces HTML. Si pasa eso, derivamos el MIME por extensión
// en lugar de rechazar el archivo.
const EXTENSION_MIME_TYPES = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
    md: "text/markdown",
    markdown: "text/markdown",
    html: "text/html",
    htm: "text/html",
};

function resolveMimeType(file) {
    if (ACCEPTED_MIME_TYPES.has(file.type)) return file.type;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const byExtension = ext ? EXTENSION_MIME_TYPES[ext] : undefined;
    return byExtension || file.type;
}

export async function uploadDocument(courseId, file, section = null) {
    if (!file) throw new Error("No file provided");

    const mimeType = resolveMimeType(file);
    if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
        throw new Error(
            `Formato no soportado: ${file.type || "desconocido"}. `
            + "Se aceptan PDF, DOCX, PPTX, XLSX, CSV, MD, HTML y TXT."
        );
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
            mime_type: mimeType,
            section: section === null || section === undefined ? null : section,
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
        mimetype:    mimeType,
        content_b64: contentB64,
        section:     section === null || section === undefined ? -1 : section,
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


// ============================================================
// Feature G — Gaps del docente
// ============================================================

const MOCK_GAPS = {
    course_id: 2,
    days: 30,
    total: 3,
    items: [
        {
            question: "¿cómo se calcula el determinante de una matriz 4x4?",
            count: 5,
            last_asked_at: new Date(Date.now() - 86400000).toISOString(),
            avg_similarity: 0.18,
            question_ids: ["mock-1a", "mock-1b"],
            is_archived: false,
        },
        {
            question: "¿qué es la regla de la cadena en derivadas parciales?",
            count: 3,
            last_asked_at: new Date(Date.now() - 3 * 86400000).toISOString(),
            avg_similarity: 0.32,
            question_ids: ["mock-2a"],
            is_archived: false,
        },
        {
            question: "ejercicios resueltos de integrales por partes",
            count: 2,
            last_asked_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            avg_similarity: null,
            question_ids: ["mock-3a"],
            is_archived: false,
        },
    ],
};

/**
 * Lista los gaps del docente — preguntas sin respuesta agrupadas.
 *
 * @param {number} courseId
 * @param {number} [days]   Ventana temporal (default 30).
 * @param {number} [limit]  Máximo items por página (default 30).
 * @param {boolean} [includeArchived] Incluir gaps ya archivados (DOC-D08).
 * @param {number} [offset] Desde qué posición paginar (UX-15, default 0).
 * @returns {Promise<{course_id:number, days:number, total:number, items:Array}>}
 */
export async function listGaps(courseId, days = 30, limit = 30, includeArchived = false, offset = 0) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...MOCK_GAPS, course_id: courseId, days };
    }

    const [response] = await fetchMany([{
        methodname: "local_nexusai_gaps_list",
        args: { courseid: courseId, days, limit, includearchived: includeArchived, offset },
    }]);

    return response;
}

/**
 * Archiva o desarchiva un gap detectado (DOC-D08, issue #383).
 *
 * @param {number} courseId
 * @param {string[]} questionIds IDs de fila devueltos por listGaps (no el texto).
 * @param {boolean} archived true para archivar, false para desarchivar.
 * @returns {Promise<{course_id:number, archived:boolean, affected:number}>}
 */
export async function archiveGap(courseId, questionIds, archived) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        await new Promise((r) => setTimeout(r, 300));
        return { course_id: courseId, archived, affected: questionIds.length };
    }

    const [response] = await fetchMany([{
        methodname: "local_nexusai_gaps_archive",
        args: { courseid: courseId, questionids: questionIds, archived },
    }]);

    return response;
}

const MOCK_FAQ_TOPICS = {
    course_id: 2,
    days: 30,
    total_questions: 14,
    topics: [
        {
            topic: "Fechas y modalidad del parcial",
            count: 6,
            example_questions: [
                "¿qué temas entran en el parcial?",
                "¿el parcial es a libro abierto?",
            ],
        },
        {
            topic: "Determinantes y matrices",
            count: 5,
            example_questions: [
                "¿cómo se calcula el determinante de una matriz 4x4?",
            ],
        },
        {
            topic: "Regla de la cadena",
            count: 3,
            example_questions: [
                "¿qué es la regla de la cadena en derivadas parciales?",
            ],
        },
    ],
};

/**
 * Preguntas más frecuentes de los alumnos, agrupadas por tema (DOC-D02).
 *
 * @param {number} courseId
 * @param {number} [days] Ventana temporal (default 30).
 * @returns {Promise<{course_id:number, days:number, total_questions:number, topics:Array}>}
 */
export async function getFaqTopics(courseId, days = 30) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...MOCK_FAQ_TOPICS, course_id: courseId, days };
    }

    const [response] = await fetchMany([{
        methodname: "local_nexusai_analytics_faq_topics",
        args: { courseid: courseId, days },
    }]);

    return response;
}

const MOCK_ANALYTICS_DASHBOARD = {
    course_id: 2,
    period_days: 30,
    top_queries: [
        { question: "¿qué temas entran en el parcial?", count: 6 },
        { question: "¿cómo se calcula el determinante de una matriz 4x4?", count: 5 },
        { question: "¿qué es la regla de la cadena en derivadas parciales?", count: 3 },
        { question: "¿el parcial es a libro abierto?", count: 2 },
    ],
    daily_message_counts: Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return {
            date: d.toISOString().slice(0, 10),
            message_count: Math.round(3 + Math.random() * 12),
        };
    }),
    quiz_score_distribution: {
        total_attempts: 27,
        average_score: 68.4,
        buckets: [
            { range: "0-20", count: 1 },
            { range: "20-40", count: 3 },
            { range: "40-60", count: 6 },
            { range: "60-80", count: 11 },
            { range: "80-100", count: 6 },
        ],
    },
    gaps_ratio: {
        gaps_detected: 12,
        questions_answered: 78,
        ratio: 0.133,
    },
    topics_consulted: 9,
};

/**
 * Dashboard agregado de métricas de un curso para el docente (ANALYTICS-01/02):
 * top queries, uso diario, distribución de puntajes de quiz y ratio de gaps.
 *
 * @param {number} courseId
 * @param {number} [days] Ventana temporal (default 30).
 * @returns {Promise<{course_id:number, period_days:number, top_queries:Array,
 *   daily_message_counts:Array, quiz_score_distribution:Object, gaps_ratio:Object,
 *   topics_consulted:number}>}
 */
export async function getAnalyticsDashboard(courseId, days = 30) {
    const fetchMany = await getMoodleAjax();
    if (!fetchMany) {
        await new Promise((r) => setTimeout(r, 400));
        return { ...MOCK_ANALYTICS_DASHBOARD, course_id: courseId, period_days: days };
    }

    const [response] = await fetchMany([{
        methodname: "local_nexusai_analytics_dashboard",
        args: { courseid: courseId, days },
    }]);

    return response;
}
