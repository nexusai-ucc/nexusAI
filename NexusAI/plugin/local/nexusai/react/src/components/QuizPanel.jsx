/**
 * QuizPanel — generador de quiz de práctica (Feature F / SP-03 / SP-05).
 *
 * Estados:
 *   - "setup":    selector de tema + tipo de pregunta + cantidad + botón Generar
 *   - "loading":  spinner mientras el LLM genera
 *   - "playing":  una pregunta por vez con feedback inmediato
 *   - "finished": score final + opción de empezar otro
 *   - "error":    mensaje de error + botón Reintentar
 *
 * Tipos de pregunta:
 *   - multiple_choice: 4 opciones A/B/C/D
 *   - true_false:      2 opciones Verdadero / Falso
 *   - open:            textarea libre evaluado por IA
 *   - mix:             combinación de los tres anteriores
 */

import { useState, useRef } from "react";
import { generateQuiz, evaluateOpenAnswer } from "../api/quiz.js";
import { IconBook, IconCheck, IconChevronRight, IconFile, IconThumbsUp, IconTrophy, IconX } from "./icons.jsx";

// ── localStorage helpers para persistir errores del quiz (SP-10) ──
const LS_KEY = (courseId) => `nexusai_quiz_errors_${courseId}`;
const MAX_STORED_ERRORS = 100;

function appendErrorsToStorage(courseId, newErrors) {
    if (!newErrors.length) return;
    try {
        const existing = JSON.parse(localStorage.getItem(LS_KEY(courseId)) || "[]");
        const combined = [...newErrors, ...existing].slice(0, MAX_STORED_ERRORS);
        localStorage.setItem(LS_KEY(courseId), JSON.stringify(combined));
    } catch { /* localStorage puede no estar disponible (modo privado, etc.) */ }
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

export default function QuizPanel({ courseId, lang = "es" }) {
    const [stage, setStage] = useState("setup"); // setup | loading | playing | finished | error
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [questionType, setQuestionType] = useState("multiple_choice");
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

    const L = lang === "es" ? {
        introTitle:      "Quiz de práctica",
        introText:       "Generá preguntas de práctica sobre el material del curso para repasar.",
        topicLabel:      "Tema (opcional)",
        topicPlaceholder:"Ej: derivadas, estructuras de datos, fotosíntesis...",
        typeLabel:       "Tipo de preguntas",
        typeMC:          "Opción múltiple",
        typeTF:          "V / F",
        typeOpen:        "Preguntas abiertas",
        typeMix:         "Mix",
        nQuestions:      "Cantidad de preguntas",
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
    } : {
        introTitle:      "Practice Quiz",
        introText:       "Generate practice questions from the course material to review.",
        topicLabel:      "Topic (optional)",
        topicPlaceholder:"Ex: derivatives, data structures, photosynthesis...",
        typeLabel:       "Question type",
        typeMC:          "Multiple choice",
        typeTF:          "True / False",
        typeOpen:        "Open questions",
        typeMix:         "Mix",
        nQuestions:      "Number of questions",
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
            const data = await generateQuiz({ courseId, topic, numQuestions, questionType });
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
                    question_type:      "open",
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
            // Persistir errores antes de mostrar el resultado final
            appendErrorsToStorage(courseId, wrongAnswersRef.current);
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

    // ─── SETUP ───
    if (stage === "setup") {
        const typeOptions = [
            { key: "multiple_choice", label: L.typeMC },
            { key: "true_false",      label: L.typeTF },
            { key: "open",            label: L.typeOpen },
            { key: "mix",             label: L.typeMix },
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
                <button
                    type="button"
                    className="nexusai-quiz__primary"
                    onClick={start}
                >
                    {L.generate}
                </button>
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
        const isOpen = qType === "open";
        const isTF   = qType === "true_false";

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
                {!isOpen && (
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

                {/* ── Feedback después de verificar ── */}
                {reveal && (
                    <div className={`nexusai-quiz__feedback ${
                        isOpen
                            ? (evaluation?.correct ? "nexusai-quiz__feedback--correct" : "nexusai-quiz__feedback--wrong")
                            : (selectedIdx === q.correct_index ? "nexusai-quiz__feedback--correct" : "nexusai-quiz__feedback--wrong")
                    }`}>
                        <strong className="nexusai-quiz__feedback-title">
                            {(isOpen ? evaluation?.correct : selectedIdx === q.correct_index)
                                ? <><IconCheck size={14} /> {L.correct}</>
                                : <><IconX size={14} /> {L.wrong}</>
                            }
                        </strong>
                        <p className="nexusai-quiz__explanation">
                            {isOpen ? evaluation?.feedback : q.explanation}
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
                    {!reveal ? (
                        isOpen ? (
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

    return null;
}
