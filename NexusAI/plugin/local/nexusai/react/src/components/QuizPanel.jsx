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

import { useState, useRef } from "react";
import { generateQuiz, evaluateOpenAnswer, recordQuizErrors, saveQuizAttempt, listQuizAttempts } from "../api/quiz.js";
import { IconBook, IconCheck, IconChevronRight, IconFile, IconThumbsUp, IconTrophy, IconX } from "./icons.jsx";

// ── Persistencia de errores del quiz en el backend (SP-10) ──
// Best-effort: si falla, no bloquea el flujo del quiz (el alumno ya vio su
// resultado). El historial vive en Postgres, no en localStorage.
function persistErrors(courseId, newErrors) {
    if (!newErrors.length) return;
    recordQuizErrors({ courseId, errors: newErrors }).catch(() => { /* best-effort */ });
}

function extractErrorMessage(err) {
    const raw = err?.message || String(err);
    const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (detailMatch) return detailMatch[1].replace(/\\"/g, '"');
    const jsonFrag = raw.match(/HTTP\s+\d+[:\s]+(\{.+\})/s);
    if (jsonFrag) {
        try {
            const parsed = JSON.parse(jsonFrag[1]);
            if (typeof parsed?.detail === "string") return parsed.detail;
        } catch { /* not valid JSON as-is */ }
        try {
            const parsed = JSON.parse(jsonFrag[1].replace(/\\"/g, '"'));
            if (typeof parsed?.detail === "string") return parsed.detail;
        } catch { /* fall through */ }
    }
    const httpMatch = raw.match(/HTTP\s+\d+[:\s]+(.+)/s);
    if (httpMatch) return httpMatch[1].trim();
    return raw;
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

    // Historial de quizzes (SP-09)
    const [historyItems, setHistoryItems] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

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
        historyEmpty:       "Todavía no realizaste ningún quiz en este curso.",
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
        historyEmpty:       "You haven't completed any quizzes in this course yet.",
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
        resetQuestionState();

        try {
            const data = await generateQuiz({ courseId, topic, numQuestions, questionType, difficulty });
            if (!data?.questions?.length) throw new Error(L.errorGeneric);
            setQuiz(data);
            setStage("playing");
        } catch (err) {
            if (is422(err)) {
                setTopicError(extractErrorMessage(err) || L.errorGeneric);
                setStage("setup");
            } else {
                setError(extractErrorMessage(err) || L.errorGeneric);
                setStage("error");
            }
        }
    };

    // ── Verificar respuesta de opción múltiple o V/F ──
    const verify = () => {
        if (selectedIdx === null) return;
        setReveal(true);
        const q = quiz.questions[currentIdx];
        if (q.correct_index === selectedIdx) {
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
    };

    // ── Autoevaluación de flashcard (sin IA): el alumno juzga si la sabía ──
    const markFlashcard = (knewIt) => {
        const q = quiz.questions[currentIdx];
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
        } catch {
            setEvaluation({ correct: false, score: 0, feedback: "Error al evaluar la respuesta. Intentá de nuevo." });
        } finally {
            setEvaluating(false);
            setReveal(true);
        }
    };

    const next = () => {
        const isLast = currentIdx >= quiz.questions.length - 1;
        if (isLast) {
            const correctCount = quiz.questions.length - wrongAnswersRef.current.length;
            persistErrors(courseId, wrongAnswersRef.current);
            saveQuizAttempt({
                courseId,
                questionType: questionType,
                difficulty,
                topic: topic || null,
                totalQuestions: quiz.questions.length,
                correctCount,
            }).catch(() => {});
            setStage("finished");
        } else {
            setCurrentIdx((i) => i + 1);
            resetQuestionState();
        }
    };

    const resetAll = () => {
        wrongAnswersRef.current = [];
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
                    <label className="nexusai-quiz__label">{L.topicLabel}</label>
                    <input
                        type="text"
                        className={`nexusai-quiz__input${topicError ? " nexusai-quiz__input--error" : ""}`}
                        placeholder={L.topicPlaceholder}
                        value={topic}
                        onChange={(e) => { setTopic(e.target.value); setTopicError(null); }}
                        maxLength={200}
                    />
                    {topicError && (
                        <p className="nexusai-quiz__topic-error">{topicError}</p>
                    )}
                </div>
                <div className="nexusai-quiz__field">
                    <label className="nexusai-quiz__label">{L.typeLabel}</label>
                    <div className="nexusai-quiz__typebtns">
                        {typeOptions.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                className={`nexusai-quiz__typebtn ${questionType === key ? "nexusai-quiz__typebtn--active" : ""}`}
                                onClick={() => setQuestionType(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="nexusai-quiz__field">
                    <label className="nexusai-quiz__label">{L.nQuestions}</label>
                    <div className="nexusai-quiz__numbtns">
                        {[3, 5, 7, 10].map((n) => (
                            <button
                                key={n}
                                type="button"
                                className={`nexusai-quiz__numbtn ${numQuestions === n ? "nexusai-quiz__numbtn--active" : ""}`}
                                onClick={() => setNumQuestions(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="nexusai-quiz__field">
                    <label className="nexusai-quiz__label">{L.difficultyLabel}</label>
                    <div className="nexusai-quiz__diffbtns">
                        {difficultyOptions.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                className={`nexusai-quiz__diffbtn ${difficulty === key ? "nexusai-quiz__diffbtn--active" : ""}`}
                                onClick={() => setDifficulty(key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
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
            <div className="nexusai-quiz nexusai-quiz--center">
                <div className="nexusai-quiz__spinner" />
                <p className="nexusai-quiz__loading-text">{L.generating}</p>
            </div>
        );
    }

    // ─── ERROR ───
    if (stage === "error") {
        return (
            <div className="nexusai-quiz nexusai-quiz--center">
                <p className="nexusai-error__text">{error || L.errorGeneric}</p>
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

        return (
            <div className="nexusai-quiz">
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
                    <div className={`nexusai-quiz__feedback ${
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
                <button type="button" className="nexusai-quiz__primary" onClick={resetAll}>
                    {L.again}
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
                    <div className="nexusai-quiz nexusai-quiz--center">
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
                            const pct = Math.round((item.correct_count / item.total_questions) * 100);
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
                                            <span className="nexusai-quiz__history-correct">{item.correct_count}</span>
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
