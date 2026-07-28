/**
 * Cliente API del generador de quiz (Feature F / SP-03 / SP-05 / SP-10).
 * Llama a local_nexusai_quiz_generate, local_nexusai_quiz_evaluate y a las
 * funciones de repaso de errores (quiz_errors_*, quiz_review_suggestions)
 * vía core/ajax.
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
        {
            question_type: "flashcard",
            question: "HNSW",
            options: [],
            correct_index: -1,
            explanation: "Hierarchical Navigable Small World — índice de pgvector para búsqueda aproximada de vecinos más cercanos en tiempo sub-lineal.",
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
 * @param {string} [params.questionType]    Tipo: multiple_choice | true_false | open | mix | flashcard
 * @param {string} [params.difficulty]      Dificultad: easy | medium | hard (default medium)
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
export async function generateQuiz({ courseId, topic = "", numQuestions = 5, questionType = "multiple_choice", difficulty = "medium" }) {
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
        difficulty,
    };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_generate",
        args,
    }]);

    return response;
}

/**
 * Genera un banco de preguntas de EXAMEN para el docente (EVAL-01, issue #235).
 *
 * A diferencia de generateQuiz, el docente elige explícitamente de qué
 * archivos del curso salen las preguntas (documentIds), en vez de un topic
 * libre o material aleatorio de todo el curso.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string[]} params.documentIds     UUIDs de los documentos elegidos (al menos 1).
 * @param {string} [params.topic]           Tema opcional para enfocar las preguntas.
 * @param {number} [params.numQuestions]    Cantidad de preguntas (default 10).
 * @param {string} [params.questionType]    Tipo: multiple_choice | true_false | open | mix
 * @param {string} [params.difficulty]      Dificultad: easy | medium | hard (default medium)
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
export async function generateExam({ courseId, documentIds, topic = "", numQuestions = 10, questionType = "multiple_choice", difficulty = "medium" }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
        let mockQuestions = MOCK_QUIZ.questions.filter((q) => q.question_type !== "flashcard");
        if (questionType !== "mix") {
            const filtered = mockQuestions.filter((q) => q.question_type === questionType);
            mockQuestions = filtered.length ? filtered : mockQuestions.slice(0, 1);
        }
        return { course_id: courseId, topic: topic || null, questions: mockQuestions };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_exam_generate",
        args: {
            courseid:     courseId,
            documentids:  documentIds,
            topic:        topic || "",
            numquestions: numQuestions,
            questiontype: questionType,
            difficulty,
        },
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

/**
 * Persiste las preguntas que el alumno respondió mal en un quiz (SP-10).
 * Best-effort: si falla (red, Moodle no disponible), el caller no debe
 * bloquear el flujo del quiz por esto.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {Array}  params.errors  Errores en el shape que arma QuizPanel.
 * @returns {Promise<{stored:number}>}
 */
export async function recordQuizErrors({ courseId, errors }) {
    if (!errors?.length) return { stored: 0 };
    const ajax = await getMoodleAjax();
    if (!ajax) return { stored: 0 };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_errors_record",
        args: {
            courseid: courseId,
            errors:   errors.map((e) => ({
                question_type:       e.question_type,
                question:            e.question,
                explanation:         e.explanation || "",
                source_filename:     e.source_filename || null,
                source_document_id:  e.source_document_id != null ? String(e.source_document_id) : null,
                options:             e.options || [],
                correct_index:       typeof e.correct_index === "number" ? e.correct_index : -1,
                user_selected_index: typeof e.user_selected_index === "number" ? e.user_selected_index : null,
                user_answer:         e.user_answer ?? null,
                ai_feedback:         e.ai_feedback ?? null,
                ai_score:            typeof e.ai_score === "number" ? e.ai_score : null,
            })),
        },
    }]);

    return response;
}

/**
 * Lista el historial de errores de quiz del alumno en el curso (SP-10).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @param {number} [limit=100]
 * @returns {Promise<{course_id:number, total:number, items:Array}>}
 */
export async function listQuizErrors(courseId, days = 90, limit = 100) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { course_id: courseId, total: 0, items: [] };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_errors_list",
        args: { courseid: courseId, days, limit },
    }]);

    return response;
}

/**
 * Borra el historial de errores de quiz del alumno en el curso (SP-10).
 *
 * @param {number} courseId
 * @returns {Promise<{deleted:number}>}
 */
export async function clearQuizErrors(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { deleted: 0 };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_errors_clear",
        args: { courseid: courseId },
    }]);

    return response;
}

/**
 * Sugerencias de repaso basadas en los errores más frecuentes del alumno (SP-10).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @returns {Promise<{course_id:number, total_errors:number, suggestions:Array}>}
 */
export async function getReviewSuggestions(courseId, days = 90) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { course_id: courseId, total_errors: 0, suggestions: [] };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_review_suggestions",
        args: { courseid: courseId, days },
    }]);

    return response;
}

/**
 * Plan de estudio personalizado: combina errores de quiz + gaps del chat.
 *
 * @param {number} courseId
 * @param {number} [days=30]
 * @returns {Promise<{course_id:number, topics:Array}>}
 */
export async function getStudyPlan(courseId, days = 30) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        return {
            course_id: courseId,
            topics: [
                {
                    topic: "Derivadas de funciones trigonométricas",
                    quiz_error_count: 3,
                    gap_count: 1,
                    reason: "Fallaste 3 preguntas de práctica y preguntaste esto una vez en el chat sin buena respuesta.",
                    suggested_quiz_topic: "derivadas trigonométricas",
                },
            ],
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_study_plan",
        args: { courseid: courseId, days },
    }]);

    return response;
}
