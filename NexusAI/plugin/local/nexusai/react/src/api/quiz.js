/**
 * API client of the quiz generator (Feature F / SP-03 / SP-05 / SP-10).
 * Calls local_nexusai_quiz_generate, local_nexusai_quiz_evaluate and the
 * error review functions (quiz_errors_*, quiz_review_suggestions)
 * through core/ajax.
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
 * Generates a practice quiz.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} [params.topic]           Optional topic (default: a mix).
 * @param {number} [params.numQuestions]    Number of questions (default 5).
 * @param {string} [params.questionType]    Type: multiple_choice | true_false | open | mix | flashcard
 * @param {string} [params.difficulty]      Difficulty: easy | medium | hard (default medium)
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
 * Generates an EXAM question bank for the teacher (EVAL-01, issue #235).
 *
 * Unlike generateQuiz, the teacher explicitly picks which course files the
 * questions come from (documentIds), instead of a free topic or random
 * material from the whole course.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string[]} params.documentIds     UUIDs of the chosen documents (at least 1).
 * @param {string} [params.topic]           Optional topic to focus the questions.
 * @param {number} [params.numQuestions]    Number of questions (default 10).
 * @param {string} [params.questionType]    Type: multiple_choice | true_false | open | mix
 * @param {string} [params.difficulty]      Difficulty: easy | medium | hard (default medium)
 * @param {Array<{label:string, source:string}>} [params.focusTopics]
 *   Topics with detected difficulty (Gaps/FAQ) to prioritize (DOC-D09, issue #390).
 * @returns {Promise<{course_id:number, topic:?string, questions:Array}>}
 */
export async function generateExam({ courseId, documentIds, topic = "", numQuestions = 10, questionType = "multiple_choice", difficulty = "medium", focusTopics = [] }) {
    const ajax = await getMoodleAjax();

    if (!ajax) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
        let mockQuestions = MOCK_QUIZ.questions.filter((q) => q.question_type !== "flashcard");
        if (questionType !== "mix") {
            const filtered = mockQuestions.filter((q) => q.question_type === questionType);
            mockQuestions = filtered.length ? filtered : mockQuestions.slice(0, 1);
        }
        if (focusTopics.length) {
            mockQuestions = mockQuestions.map((q, i) => ({ ...q, source_topic: focusTopics[i % focusTopics.length]?.label || null }));
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
            topics:       focusTopics,
        },
    }]);

    return response;
}

/**
 * Grades a student's free answer to an open question (SP-05).
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.question      Question text.
 * @param {string} params.modelAnswer   Model answer (the quiz explanation).
 * @param {string} params.userAnswer    Answer written by the student.
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
 * Stores the questions the student got wrong in a quiz (SP-10).
 * Best effort: if it fails (network, Moodle unavailable), the caller must not
 * block the quiz flow because of it.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {Array}  params.errors  Errors in the shape QuizPanel builds.
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
 * Lists the student's quiz error history in the course (SP-10).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @param {number} [limit=100]
 * @param {number} [offset=0]
 * @returns {Promise<{course_id:number, total:number, items:Array}>}
 */
export async function listQuizErrors(courseId, days = 90, limit = 100, offset = 0) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { course_id: courseId, total: 0, items: [] };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_errors_list",
        args: { courseid: courseId, days, limit, offset },
    }]);

    return response;
}

/**
 * Deletes the student's quiz error history in the course (SP-10).
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
 * Stores the result of a quiz the student completed (SP-09).
 * Best effort: the caller must not block the flow if it fails.
 *
 * @param {Object} params
 * @param {number} params.courseId
 * @param {string} params.questionType
 * @param {string} [params.difficulty]
 * @param {string|null} [params.topic]
 * @param {number} params.totalQuestions
 * @param {number} params.correctCount
 * @returns {Promise<{id:string, created_at:string}>}
 */
export async function saveQuizAttempt({ courseId, questionType, difficulty = "medium", topic = null, totalQuestions, correctCount }) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { id: "mock", created_at: new Date().toISOString() };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_attempt_save",
        args: {
            courseid:       courseId,
            questiontype:   questionType,
            difficulty,
            topic:          topic || "",
            totalquestions: totalQuestions,
            correctcount:   correctCount,
        },
    }]);
    return response;
}

/**
 * Lists the quizzes the student completed in the course (SP-09).
 *
 * @param {number} courseId
 * @param {number} [days=90]
 * @param {number} [limit=20]
 * @returns {Promise<{course_id:number, total:number, items:Array}>}
 */
export async function listQuizAttempts(courseId, days = 90, limit = 20) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        return {
            course_id: courseId,
            total: 2,
            items: [
                { id: "mock-1", question_type: "multiple_choice", difficulty: "medium", topic: null,            total_questions: 5, correct_answers: 4, score: 0.8,    created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: "mock-2", question_type: "flashcard",       difficulty: "easy",   topic: "Fotosíntesis", total_questions: 3, correct_answers: 2, score: 0.6667, created_at: new Date(Date.now() - 3600000).toISOString() },
            ],
        };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_attempt_list",
        args: { courseid: courseId, days, limit },
    }]);
    return response;
}

/**
 * Review suggestions based on the student's most frequent errors (SP-10).
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
 * Personalized study plan: combines quiz errors + chat gaps.
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
                    quiz_error_ids: ["mock-qe-1", "mock-qe-2", "mock-qe-3"],
                    gap_question_ids: ["mock-gq-1"],
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

/**
 * Dismisses one topic of the study plan (SP-13 / #323) — without deleting
 * the underlying quiz_errors/unanswered_questions history. Works on the real
 * row IDs (`StudyPlanTopic.quiz_error_ids`/`gap_question_ids`), not on the
 * topic text (the LLM generates it on every call, it is not a stable
 * key).
 *
 * @param {number} courseId
 * @param {string[]} quizErrorIds
 * @param {string[]} gapQuestionIds
 * @returns {Promise<{affected:number}>}
 */
export async function dismissStudyPlanTopic(courseId, quizErrorIds = [], gapQuestionIds = []) {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 200));
        return { affected: quizErrorIds.length + gapQuestionIds.length };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_study_plan_dismiss",
        args: {
            courseid: courseId,
            quizerrorids: quizErrorIds,
            gapquestionids: gapQuestionIds,
        },
    }]);

    return response;
}

/**
 * Suggests a starting difficulty for the quiz generator, based on the
 * student's attempt history (SP-12 / #322). It is only a suggestion —
 * the student can always pick another difficulty by hand.
 *
 * @param {number} courseId
 * @param {string} [topic] Chosen topic; empty = general course history.
 * @returns {Promise<{difficulty:?string, reason:?string, based_on_attempts:number, accuracy_pct:?number}>}
 */
export async function suggestDifficulty(courseId, topic = "") {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return { difficulty: null, reason: null, based_on_attempts: 0, accuracy_pct: null };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_suggest_difficulty",
        args: { courseid: courseId, topic },
    }]);

    return {
        difficulty: response.difficulty ?? null,
        reason: response.reason ?? null,
        based_on_attempts: response.basedonattempts ?? 0,
        accuracy_pct: response.accuracypct ?? null,
    };
}

/**
 * Spaced repetition of flashcards (SM-2) — SP-11 / #315.
 *
 * How many already generated flashcards are "due today" vs. the total
 * generated so far in the course (stored by generateQuiz when questionType is
 * "flashcard").
 *
 * @param {number} courseId
 * @param {string} [topic]
 * @returns {Promise<{due_count:number, total_count:number}>}
 */
export async function getFlashcardsSummary(courseId, topic = "") {
    const ajax = await getMoodleAjax();
    if (!ajax) {
        await new Promise((r) => setTimeout(r, 150));
        return { due_count: 0, total_count: 0 };
    }

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_flashcards_summary",
        args: { courseid: courseId, topic },
    }]);

    return {
        due_count: response.duecount ?? 0,
        total_count: response.totalcount ?? 0,
    };
}

/**
 * Already generated flashcards that are "due today" (most overdue first), from
 * the stored bank — without calling the LLM (SP-11 / #315).
 *
 * @param {number} courseId
 * @param {string} [topic]
 * @param {number} [limit=10]
 * @returns {Promise<{course_id:number, questions:Array}>}
 */
export async function getDueFlashcards(courseId, topic = "", limit = 10) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { course_id: courseId, questions: [] };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_flashcards_due",
        args: { courseid: courseId, topic, limit },
    }]);

    return response;
}

/**
 * Applies spaced repetition (SM-2) to the self-assessment result of a
 * flashcard session. Called ONCE at the end of the session (SP-11 /
 * #315), not per card. Best effort: must not block the flow if it fails.
 *
 * @param {number} courseId
 * @param {Array<{flashcardId:string, knewIt:boolean}>} reviews
 * @returns {Promise<{updated:number}>}
 */
export async function submitFlashcardReviews(courseId, reviews) {
    if (!reviews?.length) return { updated: 0 };
    const ajax = await getMoodleAjax();
    if (!ajax) return { updated: 0 };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_flashcards_review_batch",
        args: {
            courseid: courseId,
            reviews: reviews.map((r) => ({ flashcardid: r.flashcardId, knewit: r.knewIt })),
        },
    }]);

    return response;
}

/**
 * Streak of consecutive days of activity of the student in the course (quiz
 * attempts or chat questions) — SP-16 / #354.
 *
 * @param {number} courseId
 * @returns {Promise<{current_streak:number, practiced_today:boolean}>}
 */
export async function getStudyStreak(courseId) {
    const ajax = await getMoodleAjax();
    if (!ajax) return { current_streak: 0, practiced_today: false };

    const [response] = await ajax.call([{
        methodname: "local_nexusai_quiz_streak",
        args: { courseid: courseId },
    }]);

    return {
        current_streak: response.currentstreak ?? 0,
        practiced_today: response.practicedtoday ?? false,
    };
}
