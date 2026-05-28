/**
 * Cliente API del buscador semántico (Feature A).
 * Llama a `local_nexusai_search_query` vía core/ajax. Fuera de Moodle
 * cae a un mock para que la UI sea visible en dev standalone.
 */

const MOCK_RESULTS = [
    {
        document_filename: "apunte-estructuras.pdf",
        chunk_index: 3,
        content: "Los árboles binarios de búsqueda (BST) son estructuras de datos donde cada nodo tiene como máximo dos hijos...",
        similarity: 0.87,
    },
    {
        document_filename: "tp2-enunciado.pdf",
        chunk_index: 1,
        content: "El trabajo práctico consiste en implementar una tabla hash con resolución de colisiones por encadenamiento...",
        similarity: 0.74,
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
 * Busca fragmentos del material del curso.
 *
 * @param {Object} params
 * @param {string} params.query     Consulta de búsqueda.
 * @param {number} params.courseId  ID del curso de Moodle.
 * @param {number} [params.topK]    Cantidad de resultados (default 5).
 * @returns {Promise<{query:string, total:number, results:Array}>}
 */
export async function searchMaterial({ query, courseId, topK = 5 }) {
    if (!query?.trim()) {
        throw new Error("La búsqueda no puede estar vacía");
    }

    const ajax = await getMoodleAjax();

    if (!ajax) {
        // Mock fuera de Moodle.
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        return { query, total: MOCK_RESULTS.length, results: MOCK_RESULTS };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_search_query",
        args: { query: query.trim(), courseid: courseId, topk: topK },
    }]);

    return response;
}
