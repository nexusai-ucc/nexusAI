/**
 * Cliente API del generador de quiz (Feature F).
 * Llama a local_nexusai_quiz_generate vía core/ajax.
 */

const MOCK_QUIZ = {
    course_id: 0,
    topic: null,
    questions: [
        {
            question: "¿Qué estructura de datos usa NexusAI para búsqueda semántica?",
            options: ["Árbol B+", "pgvector con HNSW", "Tabla hash", "Lista enlazada"],
            correct_index: 1,
            explanation: "NexusAI usa pgvector con índice HNSW para búsqueda por similaridad coseno.",
            source_filename: "architecture.md",
        },
        {
            question: "¿Qué modelo de embeddings usa por defecto el MVP?",
            options: ["text-embedding-3-small de OpenAI", "Sentence-BERT", "gemini-embedding-001", "BERT-base"],
            correct_index: 2,
            explanation: "El MVP usa gemini-embedding-001 con 768 dimensiones.",
            source_filename: "architecture.md",
        },
    ],
};

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
 * Genera un quiz de práctica.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} [params.topic]         Tema opcional (default: variedad).
 * @param {number} [params.numQuestions]  Cantidad de preguntas (default 5).
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
export async function generateQuiz({ courseId, topic = "", numQuestions = 5 }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
        return { ...MOCK_QUIZ, course_id: courseId, topic: topic || null };
    }

    const args = {
        courseid: courseId,
        topic: topic || "",
        numquestions: numQuestions,
    };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_generate",
        args,
    }]);

    return response;
}
