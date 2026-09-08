/**
 * QuizPanel — generador de quiz de práctica / modo estudio (Feature F /
 * SP-03 / SP-05 / SP-06 / SP-08).
 *
 * Estados:
 *   - "setup":    selector de tema + tipo de pregunta + dificultad + cantidad + botón Generar
 *   - "loading":  spinner mientras el LLM genera
 *   - "playing":  una pregunta por vez con feedback inmediato
 *   - "finished": score final + opción de empezar otro
 *   - "error":    mensaje de error + botón Reintentar
 *
 * Tipos de pregunta:
 *   - multiple_choice: 4 opciones A/B/C/D
 *   - true_false:      2 opciones Verdadero / Falso
 *   - open:            textarea libre evaluado por IA
 *   - flashcard:       tarjeta pregunta/respuesta autoevaluada por el alumno (SP-06)
 *   - mix:             combinación de multiple_choice/true_false/open
 *
 * Dificultad (SP-08): easy | medium | hard, se envía al backend y ajusta
 * la complejidad de las preguntas generadas por el LLM.
 */

import { useState, useRef, useEffect } from "react";
import {
    generateQuiz, evaluateOpenAnswer, recordQuizErrors, saveQuizAttempt, listQuizAttempts, suggestDifficulty,
    getFlashcardsSummary, getDueFlashcards, submitFlashcardReviews,
} from "../api/quiz.js";
import { IconBook, IconCheck, IconChevronRight, IconClock, IconDownload, IconFile, IconThumbsUp, IconTrophy, IconX } from "./icons.jsx";
import { getFriendlyErrorMessage } from "./errors.js";

// SP-17 (#363): "Exportar a PDF" — client-side, mismo criterio que gift.js
// (sin round-trip al backend). A diferencia de GIFT (texto plano, Blob +
// <a download>), un PDF real necesitaría una librería (jsPDF, ~200KB+) —
// el bundle de este widget (chatwidget-lazy) ya está por encima del límite
// de tamaño recomendado, sin margen para sumar una. En cambio, se abre una
// ventana nueva con HTML formateado para impresión y se dispara
// window.print() — el diálogo nativo del navegador ya ofrece "Guardar como
// PDF", sin agregar ni un byte al bundle.
//
// Genera desde `quiz.questions` (las preguntas tal como las devolvió el
// generador), NUNCA desde `answersRef`/el estado de "review" — ese sí
// revela cuál era la opción correcta, y el criterio de aceptación pide
// explícitamente que el PDF no revele las respuestas.
export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

export function printQuizAsPdf(quiz, topic, lang) {
    const win = window.open("", "_blank");
    if (!win) return; // popup bloqueado por el navegador — sin fallback, no hay mucho más que hacer

    const title = (topic && topic.trim()) || (lang === "es" ? "Quiz de práctica" : "Practice quiz");
    const answerSpaceLabel = lang === "es" ? "Respuesta:" : "Answer:";

    const questionsHtml = quiz.questions.map((q, i) => {
        const stem = `<p class="q-stem"><strong>${i + 1}.</strong> ${escapeHtml(q.question)}</p>`;
        const hasOptions = Array.isArray(q.options) && q.options.length > 0 && q.question_type !== "open";
        const body = hasOptions
            ? `<ol class="q-options">${q.options.map((opt) => `<li>${escapeHtml(opt)}</li>`).join("")}</ol>`
            : `<p class="q-answer-label">${answerSpaceLabel}</p><div class="q-answer-space"></div>`;
        return `<div class="question">${stem}${body}</div>`;
    }).join("");

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
    body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin-bottom: 20px; }
    .question { margin-bottom: 20px; page-break-inside: avoid; }
    .q-stem { margin: 0 0 6px; line-height: 1.5; }
    .q-options { margin: 0 0 0 22px; padding: 0; }
    .q-options li { margin-bottom: 4px; }
    .q-answer-label { margin: 0 0 4px; font-size: 12px; color: #64748b; }
    .q-answer-space { border-bottom: 1px solid #cbd5e1; height: 46px; }
    @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${questionsHtml}
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
}

// ── Persistencia de errores del quiz en el backend (SP-10) ──
// Best-effort: si falla, no bloquea el flujo del quiz (el alumno ya vio su
// resultado). El historial vive en Postgres, no en localStorage.
function persistErrors(courseId, newErrors) {
    if (!newErrors.length) return;
    recordQuizErrors({ courseId, errors: newErrors }).catch(() => { /* best-effort */ });
}

function is422(err) {
    const msg = err?.message || String(err);
    return msg.includes("422");
}

export default function QuizPanel({ courseId, lang = "es", initialTopic = "" }) {
    const [stage, setStage] = useState("setup"); // setup | loading | playing | finished | error
    const [topic, setTopic] = useState(initialTopic);
    const [numQuestions, setNumQuestions] = useState(5);
    const [questionType, setQuestionType] = useState("multiple_choice");
    const [difficulty, setDifficulty] = useState("medium");
    // SP-12 (#322): sugerencia de dificultad de partida, calculada una sola
    // vez al abrir el generador (no se re-consulta si el alumno edita el
    // campo de tema después — es solo el punto de partida, override manual
    // en cualquier momento vía los botones de dificultad de siempre).
    const [difficultySuggestion, setDifficultySuggestion] = useState(null);
    // SP-11 (#315): cuántas flashcards ya generadas "tocan hoy" vs. el total
    // — solo se pide cuando el alumno elige el tipo "flashcard" en el setup.
    const [flashcardsSummary, setFlashcardsSummary] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState(null);
    const [topicError, setTopicError] = useState(null);

    // Estado del juego en curso
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(null);  // MC / T/F
    const [openAnswer, setOpenAnswer] = useState("");       // preguntas abiertas
    const [evaluating, setEvaluating] = useState(false);   // spinner inline de evaluación
    const [evaluation, setEvaluation] = useState(null);    // { correct, score, feedback }
    const [reveal, setReveal] = useState(false);
    const [score, setScore] = useState(0);

    // Acumula respuestas incorrectas durante la partida (no causa re-render)
    const wrongAnswersRef = useRef([]);
    // SP-11 (#315): acumula el resultado de autoevaluación {flashcardId, knewIt}
    // de cada flashcard de la sesión, para aplicar SM-2 una sola vez al final.
    const flashcardReviewsRef = useRef([]);
    // SP-14: acumula TODAS las respuestas (correctas e incorrectas) del
    // intento en curso, para la pantalla de revisión post-quiz.
    const answersRef = useRef([]);

    // Historial de quizzes (SP-09)
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // SP-15: modo cronometrado opcional.
    const [timedMode, setTimedMode] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const L = lang === "es" ? {
        introTitle:      "Quiz de práctica",
        introText:       "Generá preguntas de práctica sobre el material del curso para repasar.",
        topicLabel:      "Tema (opcional)",
        topicPlaceholder:"Ej: derivadas, estructuras de datos, fotosíntesis...",
        typeLabel:       "Tipo de preguntas",
        typeMC:          "Opción múltiple",
        typeTF:          "V / F",
        typeOpen:        "Preguntas abiertas",
        typeFlashcard:   "Flashcards",
        typeMix:         "Mix",
        nQuestions:      "Cantidad de preguntas",
        difficultyLabel: "Dificultad",
        diffEasy:        "Fácil",
        diffMedium:      "Media",
        diffHard:        "Difícil",
        generate:        "Generar quiz",
        generating:      "Generando preguntas...",
        verify:          "Verificar",
        evaluating:      "Evaluando...",
        next:            "Siguiente",
        finish:          "Ver resultado",
        correct:         "¡Correcto!",
        wrong:           "Incorrecto",
        questionOf:      (a, b) => `Pregunta ${a} de ${b}`,
        finalTitle:      "Quiz terminado",
        finalScore:      (a, b) => `Acertaste ${a} de ${b}`,
        again:           "Nuevo quiz",
        source:          "Fuente",
        emptyTopic:      "Variedad",
        retry:           "Reintentar",
        back:            "Volver",
        errorGeneric:    "No se pudo generar el quiz",
        openPlaceholder: "Escribí tu respuesta aquí...",
        openHint:        "Esta pregunta será evaluada por IA.",
        showAnswer:      "Ver respuesta",
        flashcardKnew:      "Sabía",
        flashcardDidntKnow: "No sabía",
        typeFillBlank:      "Completar espacios",
        fillBlankHint:      "Escribí la palabra que completa el espacio en blanco.",
        fillBlankPlaceholder: "Escribí la palabra aquí...",
        historyTitle:       "Historial de quizzes",
        historyEmpty:       "Todavía no hiciste ningún quiz en este curso. Cuando completes uno, vas a ver acá tu puntaje y tu progreso.",
        historyView:        "Ver historial",
        historyBack:        "Volver al quiz",
        historyLoading:     "Cargando historial...",
        historyScore:       (a, b) => `${a}/${b}`,
        historyTypeMC:      "Opción múltiple",
        historyTypeTF:      "V/F",
        historyTypeOpen:    "Preguntas abiertas",
        historyTypeFlash:   "Flashcards",
        historyTypeFill:    "Completar espacios",
        historyTypeMix:     "Mix",
        historyDiffEasy:    "Fácil",
        historyDiffMedium:  "Media",
        historyDiffHard:    "Difícil",
        reviewAnswers:      "Revisar respuestas",
        exportPdf:          "Exportar a PDF",
        reviewTitle:        "Repaso del intento",
        reviewYourAnswer:   "Tu respuesta",
        reviewCorrectAnswer: "Respuesta correcta",
        timedModeLabel:     "Modo cronometrado",
        timedModeHint:      (min) => `Tiempo sugerido: ~${min} min para este quiz.`,
        flashcardsDueSummary: (due, total) => `${due} de ${total} flashcards generadas te tocan repasar hoy.`,
    } : {
        introTitle:      "Practice Quiz",
        introText:       "Generate practice questions from the course material to review.",
        topicLabel:      "Topic (optional)",
        topicPlaceholder:"Ex: derivatives, data structures, photosynthesis...",
        typeLabel:       "Question type",
        typeMC:          "Multiple choice",
        typeTF:          "True / False",
        typeOpen:        "Open questions",
        typeFlashcard:   "Flashcards",
        typeMix:         "Mix",
        nQuestions:      "Number of questions",
        difficultyLabel: "Difficulty",
        diffEasy:        "Easy",
        diffMedium:      "Medium",
        diffHard:        "Hard",
        generate:        "Generate quiz",
        generating:      "Generating questions...",
        verify:          "Check",
        evaluating:      "Evaluating...",
        next:            "Next",
        finish:          "See result",
        correct:         "Correct!",
        wrong:           "Incorrect",
        questionOf:      (a, b) => `Question ${a} of ${b}`,
        finalTitle:      "Quiz finished",
        finalScore:      (a, b) => `You got ${a} out of ${b}`,
        again:           "New quiz",
        source:          "Source",
        emptyTopic:      "Mixed",
        retry:           "Retry",
        back:            "Back",
        errorGeneric:    "Could not generate quiz",
        openPlaceholder: "Write your answer here...",
        openHint:        "This question will be evaluated by AI.",
        showAnswer:      "Show answer",
        flashcardKnew:      "I knew it",
        flashcardDidntKnow: "I didn't know it",
        typeFillBlank:      "Fill in the blank",
        fillBlankHint:      "Write the word that completes the blank.",
        fillBlankPlaceholder: "Write the word here...",
        historyTitle:       "Quiz history",
        historyEmpty:       "You haven't taken any quizzes in this course yet. Once you complete one, you'll see your score and progress here.",
        historyView:        "View history",
        historyBack:        "Back to quiz",
        historyLoading:     "Loading history...",
        historyScore:       (a, b) => `${a}/${b}`,
        historyTypeMC:      "Multiple choice",
        historyTypeTF:      "True/False",
        historyTypeOpen:    "Open questions",
        historyTypeFlash:   "Flashcards",
        historyTypeFill:    "Fill in blank",
        historyTypeMix:     "Mix",
        historyDiffEasy:    "Easy",
        historyDiffMedium:  "Medium",
        historyDiffHard:    "Hard",
        reviewAnswers:      "Review answers",
        exportPdf:          "Export to PDF",
        reviewTitle:        "Attempt review",
        reviewYourAnswer:   "Your answer",
        reviewCorrectAnswer: "Correct answer",
        timedModeLabel:     "Timed mode",
        timedModeHint:      (min) => `Suggested time: ~${min} min for this quiz.`,
        flashcardsDueSummary: (due, total) => `${due} of ${total} generated flashcards are due for review today.`,
    };

    const resetQuestionState = () => {
        setSelectedIdx(null);
        setOpenAnswer("");
        setEvaluating(false);
        setEvaluation(null);
        setReveal(false);
    };

    const start = async () => {
        setError(null);
        setTopicError(null);
        setStage("loading");
        setQuiz(null);
        setCurrentIdx(0);
        setScore(0);
        wrongAnswersRef.current = [];
        answersRef.current = [];
        flashcardReviewsRef.current = [];
        resetQuestionState();

        try {
            let data;
            if (questionType === "flashcard") {
                // SP-11: prioriza mostrar primero las flashcards ya generadas
                // que "tocan hoy" (banco persistido, sin llamar al LLM) — solo
                // completa con generación nueva el remanente que falte.
                const due = await getDueFlashcards(courseId, topic, numQuestions);
                const dueQuestions = due?.questions || [];
                if (dueQuestions.length >= numQuestions) {
                    data = { course_id: courseId, topic: topic || null, questions: dueQuestions.slice(0, numQuestions) };
                } else {
                    const remaining = numQuestions - dueQuestions.length;
                    const generated = await generateQuiz({ courseId, topic, numQuestions: remaining, questionType, difficulty });
                    data = { course_id: courseId, topic: topic || null, questions: [...dueQuestions, ...(generated?.questions || [])] };
                }
            } else {
                data = await generateQuiz({ courseId, topic, numQuestions, questionType, difficulty });
            }
            if (!data?.questions?.length) throw new Error(L.errorGeneric);
            setQuiz(data);
            if (timedMode) setTimeRemaining(numQuestions * 90);
            setStage("playing");
        } catch (err) {
            if (is422(err)) {
                setTopicError(getFriendlyErrorMessage(err, L.errorGeneric, lang));
                setStage("setup");
            } else {
                setError(getFriendlyErrorMessage(err, L.errorGeneric, lang));
                setStage("error");
            }
        }
    };

    // ── Verificar respuesta de opción múltiple o V/F ──
    const verify = () => {
        if (selectedIdx === null) return;
        setReveal(true);
        const q = quiz.questions[currentIdx];
        const correct = q.correct_index === selectedIdx;
        if (correct) {
            setScore((s) => s + 1);
        } else {
            wrongAnswersRef.current.push({
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                question_type: q.question_type || "multiple_choice",
                question:            q.question,
                explanation:         q.explanation,
                source_filename:     q.source_filename,
                source_document_id:  q.source_document_id ?? null,
                options:             q.options,
                correct_index:       q.correct_index,
                user_selected_index: selectedIdx,
            });
        }
        answersRef.current.push({
            index:               currentIdx,
            question_type:       q.question_type || "multiple_choice",
            question:            q.question,
            explanation:         q.explanation,
            source_filename:     q.source_filename,
            options:             q.options,
            correct_index:       q.correct_index,
            user_selected_index: selectedIdx,
            correct,
        });
    };

    // ── Autoevaluación de flashcard (sin IA): el alumno juzga si la sabía ──
    const markFlashcard = (knewIt) => {
        const q = quiz.questions[currentIdx];
        // SP-11: q.id solo falta si la flashcard es efímera (no debería pasar
        // ya que /generate y /flashcards/due persisten todo lo que devuelven,
        // pero se valida igual antes de acumular para el review-batch final).
        if (q.id) {
            flashcardReviewsRef.current.push({ flashcardId: q.id, knewIt });
        }
        if (knewIt) {
            setScore((s) => s + 1);
        } else {
            wrongAnswersRef.current.push({
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                question_type:       "flashcard",
                question:            q.question,
                explanation:         q.explanation,
                source_filename:     q.source_filename,
                source_document_id:  q.source_document_id ?? null,
                options:             [],
                correct_index:       -1,
            });
        }
        answersRef.current.push({
            index:           currentIdx,
            question_type:   "flashcard",
            question:        q.question,
            explanation:     q.explanation,
            source_filename: q.source_filename,
            options:         [],
            correct_index:   -1,
            correct:         knewIt,
        });
        next();
    };

    // ── Verificar respuesta abierta (llama al LLM evaluador) ──
    const verifyOpen = async () => {
        if (!openAnswer.trim()) return;
        const q = quiz.questions[currentIdx];
        setEvaluating(true);
        try {
            const result = await evaluateOpenAnswer({
                courseId,
                question:    q.question,
                modelAnswer: q.explanation,
                userAnswer:  openAnswer,
            });
            setEvaluation(result);
            if (result.correct) {
                setScore((s) => s + 1);
            } else {
                wrongAnswersRef.current.push({
                    id: `${Date.now()}-${Math.random()}`,
                    timestamp: new Date().toISOString(),
                    question_type:      q.question_type,
                    question:           q.question,
                    explanation:        q.explanation,
                    source_filename:    q.source_filename,
                    source_document_id: q.source_document_id ?? null,
                    options:            [],
                    correct_index:      -1,
                    user_answer:        openAnswer,
                    ai_feedback:        result.feedback,
                    ai_score:           result.score,
                });
            }
            answersRef.current.push({
                index:           currentIdx,
                question_type:   q.question_type,
                question:        q.question,
                explanation:     q.explanation,
                source_filename: q.source_filename,
                options:         [],
                correct_index:   -1,
                user_answer:     openAnswer,
                ai_feedback:     result.feedback,
                ai_score:        result.score,
                correct:         result.correct,
            });
        } catch {
            setEvaluation({ correct: false, score: 0, feedback: "Error al evaluar la respuesta. Intentá de nuevo." });
        } finally {
            setEvaluating(false);
            setReveal(true);
        }
    };

    // SP-15: factorizado de next() para poder cerrar el intento tanto al
    // llegar naturalmente a la última pregunta como al agotarse el tiempo
    // (finishEarly), sin duplicar la lógica de persistencia.
    const finalizeAttempt = (reachedQuestions) => {
        const correctCount = answersRef.current.filter((a) => a.correct).length;
        persistErrors(courseId, wrongAnswersRef.current);
        if (questionType === "flashcard" && flashcardReviewsRef.current.length) {
            submitFlashcardReviews(courseId, flashcardReviewsRef.current).catch(() => { /* best-effort */ });
        }
        saveQuizAttempt({
            courseId,
            questionType: questionType,
            difficulty,
            topic: topic || null,
            totalQuestions: reachedQuestions,
            correctCount,
        }).catch(() => {});
        setStage("finished");
    };

    const next = () => {
        const isLast = currentIdx >= quiz.questions.length - 1;
        if (isLast) {
            finalizeAttempt(quiz.questions.length);
        } else {
            setCurrentIdx((i) => i + 1);
            resetQuestionState();
        }
    };

    // SP-15: se llama cuando se agota el tiempo del modo cronometrado —
    // cierra el quiz con lo respondido hasta el momento, sin perderlo.
    const finishEarly = () => {
        const reached = currentIdx + (reveal ? 1 : 0);
        finalizeAttempt(reached);
    };

    const resetAll = () => {
        wrongAnswersRef.current = [];
        answersRef.current = [];
        flashcardReviewsRef.current = [];
        setStage("setup");
        setQuiz(null);
        setError(null);
        setCurrentIdx(0);
        setScore(0);
        resetQuestionState();
    };

    const openHistory = async () => {
        setStage("history");
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const data = await listQuizAttempts(courseId);
            setHistoryItems(data.items || []);
        } catch {
            setHistoryError("No se pudo cargar el historial. Intentá de nuevo.");
        } finally {
            setHistoryLoading(false);
        }
    };

    // SP-15: cuenta regresiva mientras se juega en modo cronometrado.
    useEffect(() => {
        if (stage !== "playing" || !timedMode) return;
        const intervalId = setInterval(() => {
            setTimeRemaining((t) => (t <= 1 ? 0 : t - 1));
        }, 1000);
        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, timedMode]);

    // Se agotó el tiempo — cierra el intento con lo respondido hasta ahora.
    useEffect(() => {
        if (stage === "playing" && timedMode && timeRemaining === 0) {
            finishEarly();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining]);

    // SP-12: sugerencia de dificultad al abrir el generador — una sola vez.
    useEffect(() => {
        let cancelled = false;
        suggestDifficulty(courseId, initialTopic)
            .then((data) => {
                if (cancelled || !data.difficulty) return;
                setDifficultySuggestion(data);
                setDifficulty(data.difficulty);
            })
            .catch(() => {
                // Sin sugerencia: se mantiene el comportamiento actual (medium, manual).
            });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    // SP-11 (#315): banner de "cuántas flashcards tocan hoy" — solo se pide
    // cuando el alumno elige ese tipo de pregunta en el setup.
    useEffect(() => {
        if (questionType !== "flashcard") {
            setFlashcardsSummary(null);
            return;
        }
        let cancelled = false;
        getFlashcardsSummary(courseId, topic)
            .then((data) => { if (!cancelled) setFlashcardsSummary(data); })
            .catch(() => { /* sin banner: no bloquea el flujo */ });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, questionType]);

    // ─── SETUP ───
    if (stage === "setup") {
        const typeOptions = [
            { key: "multiple_choice", label: L.typeMC },
            { key: "true_false",      label: L.typeTF },
            { key: "open",            label: L.typeOpen },
            { key: "flashcard",       label: L.typeFlashcard },
            { key: "fill_blank",      label: L.typeFillBlank },
            { key: "mix",             label: L.typeMix },
        ];
        const difficultyOptions = [
            { key: "easy",   label: L.diffEasy },
            { key: "medium", label: L.diffMedium },
            { key: "hard",   label: L.diffHard },
        ];
        return (
            <div className="nexusai-quiz">
                <div className="nexusai-quiz__intro">
                    <h4 className="nexusai-quiz__intro-title">{L.introTitle}</h4>
                    <p className="nexusai-quiz__intro-text">{L.introText}</p>
                </div>
                <div className="nexusai-quiz__field">
                    <label className="nexusai-quiz__label" htmlFor="nexusai-quiz-topic">{L.topicLabel}</label>
                    <input
                        id="nexusai-quiz-topic"
                        type="text"
                        className={`nexusai-quiz__input${topicError ? " nexusai-quiz__input--error" : ""}`}
                        placeholder={L.topicPlaceholder}
                        value={topic}
                        onChange={(e) => { setTopic(e.target.value); setTopicError(null); }}
                        maxLength={200}
                        aria-invalid={!!topicError}
                        aria-describedby={topicError ? "nexusai-quiz-topic-error" : undefined}
                    />
                    {topicError && (
                        <p className="nexusai-quiz__topic-error" id="nexusai-quiz-topic-error" role="alert">{topicError}</p>
                    )}
                </div>
                <div className="nexusai-quiz__field">
                    <span className="nexusai-quiz__label" id="nexusai-quiz-type-label">{L.typeLabel}</span>
                    <div className="nexusai-quiz__typebtns" role="group" aria-labelledby="nexusai-quiz-type-label">
                        {typeOptions.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                className={`nexusai-quiz__typebtn ${questionType === key ? "nexusai-quiz__typebtn--active" : ""}`}
                                onClick={() => setQuestionType(key)}
                                aria-pressed={questionType === key}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {questionType === "flashcard" && flashcardsSummary && flashcardsSummary.total_count > 0 && (
                        <p className="nexusai-quiz__diff-suggestion">
                            {L.flashcardsDueSummary(flashcardsSummary.due_count, flashcardsSummary.total_count)}
                        </p>
                    )}
                </div>
                <div className="nexusai-quiz__field">
                    <span className="nexusai-quiz__label" id="nexusai-quiz-num-label">{L.nQuestions}</span>
                    <div className="nexusai-quiz__numbtns" role="group" aria-labelledby="nexusai-quiz-num-label">
                        {[3, 5, 7, 10].map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={`nexusai-quiz__numbtn ${numQuestions === n ? "nexusai-quiz__numbtn--active" : ""}`}
                                onClick={() => setNumQuestions(n)}
                                aria-pressed={numQuestions === n}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="nexusai-quiz__field">
                    <span className="nexusai-quiz__label" id="nexusai-quiz-diff-label">{L.difficultyLabel}</span>
                    {difficultySuggestion?.reason && (
                        <p className="nexusai-quiz__diff-suggestion">{difficultySuggestion.reason}</p>
                    )}
                    <div className="nexusai-quiz__diffbtns" role="group" aria-labelledby="nexusai-quiz-diff-label">
                        {difficultyOptions.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                className={`nexusai-quiz__diffbtn ${difficulty === key ? "nexusai-quiz__diffbtn--active" : ""}`}
                                onClick={() => setDifficulty(key)}
                                aria-pressed={difficulty === key}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="nexusai-quiz__field">
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={timedMode}
                            onChange={(e) => setTimedMode(e.target.checked)}
                        />
                        <IconClock size={13} />
                        {L.timedModeLabel}
                    </label>
                    {timedMode && (
                        <p className="nexusai-quiz__intro-text">
                            {L.timedModeHint(Math.round((numQuestions * 90) / 60))}
                        </p>
                    )}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        className="nexusai-quiz__primary"
                        onClick={start}
                    >
                        {L.generate}
                    </button>
                    <button
                        type="button"
                        className="nexusai-quiz__secondary"
                        onClick={openHistory}
                    >
                        {L.historyView}
                    </button>
                </div>
            </div>
        );
    }

    // ─── LOADING ───
    if (stage === "loading") {
        return (
            <div className="nexusai-quiz nexusai-quiz--center" role="status">
                <div className="nexusai-quiz__spinner" />
                <p className="nexusai-quiz__loading-text">{L.generating}</p>
            </div>
        );
    }

    // ─── ERROR ───
    if (stage === "error") {
        return (
            <div className="nexusai-quiz nexusai-quiz--center">
                <p className="nexusai-error__text" role="alert">{error || L.errorGeneric}</p>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button type="button" className="nexusai-quiz__primary" onClick={start}>
                        {L.retry}
                    </button>
                    <button type="button" className="nexusai-quiz__secondary" onClick={resetAll}>
                        {L.back}
                    </button>
                </div>
            </div>
        );
    }

    // ─── PLAYING ───
    if (stage === "playing" && quiz) {
        const q = quiz.questions[currentIdx];
        const total = quiz.questions.length;
        const qType = q.question_type || "multiple_choice";
        const isOpen      = qType === "open";
        const isFillBlank = qType === "fill_blank";
        const isTF        = qType === "true_false";
        const isFlashcard = qType === "flashcard";

        const timeTotal = numQuestions * 90;
        const timePct = timedMode ? Math.max(0, Math.round((timeRemaining / timeTotal) * 100)) : 0;
        const timeMod = timeRemaining <= 30 ? "low" : timeRemaining <= timeTotal * 0.3 ? "mid" : "good";
        const timeMM = Math.floor(timeRemaining / 60);
        const timeSS = String(timeRemaining % 60).padStart(2, "0");

        return (
            <div className="nexusai-quiz">
                {timedMode && (
                    <div className="nexusai-quiz__field">
                        <span className="nexusai-quiz__progress-label">
                            <IconClock size={12} /> {timeMM}:{timeSS}
                        </span>
                        <div className="nexusai-quiz__history-bar">
                            <div
                                className={`nexusai-quiz__history-bar-fill nexusai-quiz__history-bar-fill--${timeMod}`}
                                style={{ width: `${timePct}%` }}
                            />
                        </div>
                    </div>
                )}
                <div className="nexusai-quiz__progress">
                    <span className="nexusai-quiz__progress-label">
                        {L.questionOf(currentIdx + 1, total)}
                    </span>
                    <div className="nexusai-quiz__progress-bar">
                        <div
                            className="nexusai-quiz__progress-fill"
                            style={{ width: `${((currentIdx + (reveal ? 1 : 0)) / total) * 100}%` }}
                        />
                    </div>
                </div>

                <p className="nexusai-quiz__question">{q.question}</p>

                {/* ── Opciones: MC y T/F ── */}
                {!isOpen && !isFillBlank && !isFlashcard && (
                    <div className={`nexusai-quiz__options${isTF ? " nexusai-quiz__options--tf" : ""}`}>
                        {q.options.map((opt, i) => {
                            const isCorrect  = i === q.correct_index;
                            const isSelected = i === selectedIdx;
                            let cls = "nexusai-quiz__option";
                            if (reveal) {
                                if (isCorrect) cls += " nexusai-quiz__option--correct";
                                else if (isSelected) cls += " nexusai-quiz__option--wrong";
                            } else if (isSelected) {
                                cls += " nexusai-quiz__option--selected";
                            }
                            // Label: T/F uses V/F, MC uses A/B/C/D
                            const letter = isTF
                                ? (i === 0 ? "V" : "F")
                                : String.fromCharCode(65 + i);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={cls}
                                    onClick={() => !reveal && setSelectedIdx(i)}
                                    disabled={reveal}
                                    aria-pressed={isSelected}
                                >
                                    <span className="nexusai-quiz__option-letter">{letter}</span>
                                    <span className="nexusai-quiz__option-text">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Textarea: preguntas abiertas ── */}
                {isOpen && (
                    <div className="nexusai-quiz__open-area">
                        <p className="nexusai-quiz__open-hint">{L.openHint}</p>
                        <textarea
                            className="nexusai-quiz__open-textarea"
                            placeholder={L.openPlaceholder}
                            value={openAnswer}
                            onChange={(e) => setOpenAnswer(e.target.value)}
                            disabled={reveal || evaluating}
                            rows={5}
                        />
                    </div>
                )}

                {/* ── Input: completar espacios en blanco (SP-04) ── */}
                {isFillBlank && (
                    <div className="nexusai-quiz__open-area">
                        <p className="nexusai-quiz__open-hint">{L.fillBlankHint}</p>
                        <input
                            type="text"
                            className="nexusai-quiz__input"
                            placeholder={L.fillBlankPlaceholder}
                            value={openAnswer}
                            onChange={(e) => setOpenAnswer(e.target.value)}
                            disabled={reveal || evaluating}
                            onKeyDown={(e) => { if (e.key === "Enter" && openAnswer.trim() && !reveal && !evaluating) verifyOpen(); }}
                        />
                    </div>
                )}

                {/* ── Dorso de la flashcard ── */}
                {isFlashcard && reveal && (
                    <div className="nexusai-quiz__feedback nexusai-quiz__feedback--flashcard">
                        <p className="nexusai-quiz__explanation">{q.explanation}</p>
                        {q.source_filename && (
                            <p className="nexusai-quiz__source">
                                <IconFile size={12} />
                                {L.source}: {q.source_filename}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Feedback después de verificar ── */}
                {reveal && !isFlashcard && (
                    <div role="status" className={`nexusai-quiz__feedback ${
                        (isOpen || isFillBlank)
                            ? (evaluation?.correct ? "nexusai-quiz__feedback--correct" : "nexusai-quiz__feedback--wrong")
                            : (selectedIdx === q.correct_index ? "nexusai-quiz__feedback--correct" : "nexusai-quiz__feedback--wrong")
                    }`}>
                        <strong className="nexusai-quiz__feedback-title">
                            {((isOpen || isFillBlank) ? evaluation?.correct : selectedIdx === q.correct_index)
                                ? <><IconCheck size={14} /> {L.correct}</>
                                : <><IconX size={14} /> {L.wrong}</>
                            }
                        </strong>
                        <p className="nexusai-quiz__explanation">
                            {(isOpen || isFillBlank) ? evaluation?.feedback : q.explanation}
                        </p>
                        {q.source_filename && (
                            <p className="nexusai-quiz__source">
                                <IconFile size={12} />
                                {L.source}: {q.source_filename}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Acciones ── */}
                <div className="nexusai-quiz__actions">
                    {isFlashcard ? (
                        !reveal ? (
                            <button
                                type="button"
                                className="nexusai-quiz__primary"
                                onClick={() => setReveal(true)}
                            >
                                {L.showAnswer}
                            </button>
                        ) : (
                            <div className="nexusai-quiz__flashcard-actions">
                                <button
                                    type="button"
                                    className="nexusai-quiz__secondary"
                                    onClick={() => markFlashcard(false)}
                                >
                                    <IconX size={14} /> {L.flashcardDidntKnow}
                                </button>
                                <button
                                    type="button"
                                    className="nexusai-quiz__primary"
                                    onClick={() => markFlashcard(true)}
                                >
                                    <IconCheck size={14} /> {L.flashcardKnew}
                                </button>
                            </div>
                        )
                    ) : !reveal ? (
                        (isOpen || isFillBlank) ? (
                            <button
                                type="button"
                                className="nexusai-quiz__primary"
                                onClick={verifyOpen}
                                disabled={!openAnswer.trim() || evaluating}
                            >
                                {evaluating
                                    ? <><div className="nexusai-quiz__btn-spinner" />{L.evaluating}</>
                                    : L.verify}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="nexusai-quiz__primary"
                                onClick={verify}
                                disabled={selectedIdx === null}
                            >
                                {L.verify}
                            </button>
                        )
                    ) : (
                        <button
                            type="button"
                            className="nexusai-quiz__primary"
                            onClick={next}
                        >
                            {currentIdx >= total - 1 ? L.finish : L.next}
                            <IconChevronRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── FINISHED ───
    if (stage === "finished" && quiz) {
        const total = quiz.questions.length;
        const pct = Math.round((score / total) * 100);
        const tier = pct >= 80 ? "high" : pct >= 50 ? "mid" : "low";
        const FinalIcon = tier === "high" ? IconTrophy : tier === "mid" ? IconThumbsUp : IconBook;
        return (
            <div className="nexusai-quiz nexusai-quiz--center">
                <div className="nexusai-quiz__final">
                    <div className={`nexusai-quiz__final-icon nexusai-quiz__final-icon--${tier}`}>
                        <FinalIcon size={28} />
                    </div>
                    <h4 className="nexusai-quiz__final-title">{L.finalTitle}</h4>
                    <p className="nexusai-quiz__final-score">{L.finalScore(score, total)}</p>
                    <div className="nexusai-quiz__final-pct">{pct}%</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                    <button type="button" className="nexusai-quiz__secondary" onClick={() => setStage("review")}>
                        {L.reviewAnswers}
                    </button>
                    <button
                        type="button"
                        className="nexusai-quiz__secondary"
                        onClick={() => printQuizAsPdf(quiz, topic, lang)}
                    >
                        <IconDownload size={13} /> {L.exportPdf}
                    </button>
                    <button type="button" className="nexusai-quiz__primary" onClick={resetAll}>
                        {L.again}
                    </button>
                </div>
            </div>
        );
    }

    // ─── REVIEW (SP-14) ───
    if (stage === "review" && quiz) {
        const reviewTypeLabel = (qt) => ({
            multiple_choice: L.typeMC,
            true_false:      L.typeTF,
            open:            L.typeOpen,
            flashcard:       L.typeFlashcard,
            fill_blank:      L.typeFillBlank,
        }[qt] || qt);

        const answered = answersRef.current.slice().sort((a, b) => a.index - b.index);

        return (
            <div className="nexusai-quiz">
                <div className="nexusai-quiz__intro">
                    <h4 className="nexusai-quiz__intro-title">{L.reviewTitle}</h4>
                </div>
                <div className="nexusai-quiz__history-list">
                    {answered.map((a) => (
                        <div key={a.index} className="nexusai-quiz__history-card">
                            <div className="nexusai-quiz__history-header">
                                <div className="nexusai-quiz__history-badges">
                                    <span className="nexusai-quiz__history-type">{reviewTypeLabel(a.question_type)}</span>
                                    <span className={`nexusai-quiz__history-pct nexusai-quiz__history-pct--${a.correct ? "good" : "low"}`}>
                                        {a.correct ? <><IconCheck size={12} /> {L.correct}</> : <><IconX size={12} /> {L.wrong}</>}
                                    </span>
                                </div>
                            </div>
                            <p className="nexusai-quiz__question">{a.question}</p>
                            {a.options?.length > 0 && a.user_selected_index !== undefined && (
                                <p className="nexusai-quiz__explanation">
                                    {L.reviewYourAnswer}: {a.options[a.user_selected_index] ?? "—"}
                                    {!a.correct && a.correct_index >= 0 && (
                                        <> · {L.reviewCorrectAnswer}: {a.options[a.correct_index]}</>
                                    )}
                                </p>
                            )}
                            {a.user_answer !== undefined && (
                                <p className="nexusai-quiz__explanation">
                                    {L.reviewYourAnswer}: {a.user_answer}
                                </p>
                            )}
                            {a.explanation && (
                                <p className="nexusai-quiz__explanation">{a.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>
                <button type="button" className="nexusai-quiz__secondary" onClick={() => setStage("finished")} style={{ marginTop: "12px" }}>
                    {L.back}
                </button>
            </div>
        );
    }

    // ─── HISTORY (SP-09) ───
    if (stage === "history") {
        const typeLabel = (qt) => ({
            multiple_choice: L.historyTypeMC,
            true_false:      L.historyTypeTF,
            open:            L.historyTypeOpen,
            flashcard:       L.historyTypeFlash,
            fill_blank:      L.historyTypeFill,
            mix:             L.historyTypeMix,
        }[qt] || qt);

        const diffLabel = (d) => ({
            easy:   L.historyDiffEasy,
            medium: L.historyDiffMedium,
            hard:   L.historyDiffHard,
        }[d] || d);

        const fmtDate = (iso) => {
            try {
                return new Date(iso).toLocaleDateString(lang === "es" ? "es-AR" : "en-US", {
                    day: "numeric", month: "short", year: "numeric",
                });
            } catch { return iso; }
        };

        return (
            <div className="nexusai-quiz">
                <div className="nexusai-quiz__intro">
                    <h4 className="nexusai-quiz__intro-title">{L.historyTitle}</h4>
                </div>

                {historyLoading && (
                    <div className="nexusai-quiz nexusai-quiz--center" role="status">
                        <div className="nexusai-quiz__spinner" />
                        <p className="nexusai-quiz__loading-text">{L.historyLoading}</p>
                    </div>
                )}

                {historyError && (
                    <p className="nexusai-error__text">{historyError}</p>
                )}

                {!historyLoading && !historyError && historyItems.length === 0 && (
                    <p className="nexusai-quiz__intro-text">{L.historyEmpty}</p>
                )}

                {!historyLoading && !historyError && historyItems.length > 0 && (
                    <div className="nexusai-quiz__history-list">
                        {historyItems.map((item) => {
                            const pct = Math.round((item.correct_answers / item.total_questions) * 100);
                            const pctMod = pct >= 80 ? "good" : pct >= 50 ? "mid" : "low";
                            return (
                                <div key={item.id} className="nexusai-quiz__history-card">
                                    <div className="nexusai-quiz__history-header">
                                        <div className="nexusai-quiz__history-badges">
                                            <span className="nexusai-quiz__history-type">{typeLabel(item.question_type)}</span>
                                            <span className={`nexusai-quiz__history-diff nexusai-quiz__history-diff--${item.difficulty}`}>
                                                {diffLabel(item.difficulty)}
                                            </span>
                                        </div>
                                        <span className="nexusai-quiz__history-date">{fmtDate(item.created_at)}</span>
                                    </div>
                                    {item.topic && <p className="nexusai-quiz__history-topic">{item.topic}</p>}
                                    <div className="nexusai-quiz__history-score-row">
                                        <div className="nexusai-quiz__history-fraction">
                                            <span className="nexusai-quiz__history-correct">{item.correct_answers}</span>
                                            <span className="nexusai-quiz__history-slash"> / </span>
                                            <span className="nexusai-quiz__history-total">{item.total_questions}</span>
                                        </div>
                                        <span className={`nexusai-quiz__history-pct nexusai-quiz__history-pct--${pctMod}`}>{pct}%</span>
                                    </div>
                                    <div className="nexusai-quiz__history-bar">
                                        <div
                                            className={`nexusai-quiz__history-bar-fill nexusai-quiz__history-bar-fill--${pctMod}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button type="button" className="nexusai-quiz__secondary" onClick={resetAll} style={{ marginTop: "12px" }}>
                    {L.historyBack}
                </button>
            </div>
        );
    }

    return null;
}
