/**
 * Cliente API del generador de quiz (Feature F / SP-03 / SP-05).
 * Llama a local_nexusai_quiz_generate y local_nexusai_quiz_evaluate vía core/ajax.
 */

const MOCK_QUIZ = {
    course_id: 0,
    topic: null,
    questions: [
        {
            question_type: "multiple_choice",
            question: "¿Qué estructura de datos usa NexusAI para búsqueda semántica?",
            options: ["Árbol B+", "pgvector con HNSW", "Tabla hash", "Lista enlazada"],
            correct_index: 1,
            explanation: "NexusAI usa pgvector con índice HNSW para búsqueda por similaridad coseno.",
            source_filename: "architecture.md",
        },
        {
            question_type: "true_false",
            question: "NexusAI usa gemini-embedding-001 como modelo de embeddings por defecto en el MVP.",
            options: ["Verdadero", "Falso"],
            correct_index: 0,
            explanation: "Correcto. El MVP usa gemini-embedding-001 con 768 dimensiones para representar el contenido del curso.",
            source_filename: "architecture.md",
        },
        {
            question_type: "open",
            question: "¿Por qué NexusAI usa pgvector con índice HNSW en lugar de una búsqueda lineal?",
            options: [],
            correct_index: -1,
            explanation: "El índice HNSW (Hierarchical Navigable Small World) permite búsquedas aproximadas de vecinos más cercanos en tiempo sub-lineal (O(log n)), lo que es esencial para mantener tiempos de respuesta bajos con grandes volúmenes de embeddings. Una búsqueda lineal requeriría comparar cada vector del corpus, resultando en O(n) operaciones.",
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
 * @param {string} [params.topic]           Tema opcional (default: variedad).
 * @param {number} [params.numQuestions]    Cantidad de preguntas (default 5).
 * @param {string} [params.questionType]    Tipo: multiple_choice | true_false | open | mix
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
export async function generateQuiz({ courseId, topic = "", numQuestions = 5, questionType = "multiple_choice" }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
        // Filter mock questions by requested type (or return mix)
        let mockQuestions = MOCK_QUIZ.questions;
        if (questionType !== "mix") {
            mockQuestions = MOCK_QUIZ.questions.filter(q => q.question_type === questionType);
            if (!mockQuestions.length) mockQuestions = MOCK_QUIZ.questions.slice(0, 1);
        }
        return { ...MOCK_QUIZ, course_id: courseId, topic: topic || null, questions: mockQuestions };
    }

    const args = {
        courseid:     courseId,
        topic:        topic || "",
        numquestions: numQuestions,
        questiontype: questionType,
    };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_generate",
        args,
    }]);

    return response;
}

/**
 * Evalúa la respuesta libre de un alumno a una pregunta abierta (SP-05).
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.question      Texto de la pregunta.
 * @param {string} params.modelAnswer   Respuesta modelo (explanation del quiz).
 * @param {string} params.userAnswer    Respuesta escrita por el alumno.
 * @returns {Promise<{correct:boolean, score:number, feedback:string}>}
 */
export async function evaluateOpenAnswer({ courseId, question, modelAnswer, userAnswer }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        const isCorrect = userAnswer.trim().length > 15;
        return {
            correct:  isCorrect,
            score:    isCorrect ? 0.8 : 0.2,
            feedback: isCorrect
                ? "Buena respuesta. Mencionaste los conceptos clave. (Evaluación simulada — en el sistema real la IA compara con el material del curso.)"
                : "La respuesta es demasiado breve. Desarrollá más el concepto. (Evaluación simulada.)",
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_evaluate",
        args: {
            courseid:    courseId,
            question,
            modelanswer: modelAnswer,
            useranswer:  userAnswer,
        },
    }]);

    return response;
}
