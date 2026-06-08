/**
 * QuizPanel — generador de quiz de práctica (Feature F).
 *
 * Estados:
 *   - "setup":    selector de tema + cantidad de preguntas + botón Generar
 *   - "loading":  spinner mientras el LLM genera
 *   - "playing":  una pregunta por vez con feedback inmediato al seleccionar
 *   - "finished": score final + opción de empezar otro
 *   - "error":    mensaje de error + botón Reintentar
 */

import { useState } from "react";
import { generateQuiz } from "../api/quiz.js";
import { IconBook, IconCheck, IconChevronRight, IconFile, IconThumbsUp, IconTrophy, IconX } from "./icons.jsx";

/**
 * Extrae el mensaje legible de un error de Moodle/FastAPI.
 * Moodle puede entregar el error en dos formas:
 *   1. Parseado:   "...HTTP 422: {"detail": "msg"}"   → regex directo
 *   2. Escapado:   "...HTTP 422: {\"detail\":\"msg\"}" → JSON.parse con unescape
 */
function extractErrorMessage(err) {
    const raw = err?.message || String(err);
    // Intento 1: regex — funciona cuando las comillas ya son literales.
    const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (detailMatch) return detailMatch[1].replace(/\\"/g, '"');
    // Intento 2: JSON.parse del fragmento después de "HTTP NNN:" —
    // cubre el caso donde Moodle entrega la string con backslash-escapes.
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
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState(null);
    const [topicError, setTopicError] = useState(null);

    // Estado del juego en curso
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [reveal, setReveal] = useState(false);
    const [score, setScore] = useState(0);

    const L = lang === "es" ? {
        introTitle:    "Quiz de práctica",
        introText:     "Generá preguntas de opción múltiple sobre el material del curso para repasar.",
        topicLabel:    "Tema (opcional)",
        topicPlaceholder: "Ej: derivadas, estructuras de datos, fotosíntesis...",
        nQuestions:    "Cantidad de preguntas",
        generate:      "Generar quiz",
        generating:    "Generando preguntas...",
        verify:        "Verificar",
        next:          "Siguiente",
        finish:        "Ver resultado",
        correct:       "¡Correcto!",
        wrong:         "Incorrecto",
        questionOf:    (a, b) => `Pregunta ${a} de ${b}`,
        finalTitle:    "Quiz terminado",
        finalScore:    (a, b) => `Acertaste ${a} de ${b}`,
        again:         "Nuevo quiz",
        source:        "Fuente",
        emptyTopic:    "Variedad",
        retry:         "Reintentar",
        back:          "Volver",
        errorGeneric:  "No se pudo generar el quiz",
    } : {
        introTitle:    "Practice Quiz",
        introText:     "I generate multiple-choice questions from the course material so you can review.",
        topicLabel:    "Topic (optional)",
        topicPlaceholder: "Ex: derivatives, data structures, photosynthesis...",
        nQuestions:    "Number of questions",
        generate:      "Generate quiz",
        generating:    "Generating questions...",
        verify:        "Check",
        next:          "Next",
        finish:        "See result",
        correct:       "Correct!",
        wrong:         "Incorrect",
        questionOf:    (a, b) => `Question ${a} of ${b}`,
        finalTitle:    "Quiz finished",
        finalScore:    (a, b) => `You got ${a} out of ${b}`,
        again:         "New quiz",
        source:        "Source",
        emptyTopic:    "Mixed",
        retry:         "Retry",
        back:          "Back",
        errorGeneric:  "Could not generate quiz",
    };

    const start = async () => {
        setError(null);
        setTopicError(null);
        setStage("loading");
        setQuiz(null);
        setCurrentIdx(0);
        setSelectedIdx(null);
        setReveal(false);
        setScore(0);

        try {
            const data = await generateQuiz({ courseId, topic, numQuestions });
            if (!data?.questions?.length) {
                throw new Error(L.errorGeneric);
            }
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

    const verify = () => {
        if (selectedIdx === null) return;
        setReveal(true);
        if (quiz.questions[currentIdx].correct_index === selectedIdx) {
            setScore((s) => s + 1);
        }
    };

    const next = () => {
        const isLast = currentIdx >= quiz.questions.length - 1;
        if (isLast) {
            setStage("finished");
        } else {
            setCurrentIdx((i) => i + 1);
            setSelectedIdx(null);
            setReveal(false);
        }
    };

    const resetAll = () => {
        setStage("setup");
        setQuiz(null);
        setError(null);
        setCurrentIdx(0);
        setSelectedIdx(null);
        setReveal(false);
        setScore(0);
    };

    // ─── SETUP ───
    if (stage === "setup") {
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

                <div className="nexusai-quiz__options">
                    {q.options.map((opt, i) => {
                        const isCorrect = i === q.correct_index;
                        const isSelected = i === selectedIdx;
                        let cls = "nexusai-quiz__option";
                        if (reveal) {
                            if (isCorrect) cls += " nexusai-quiz__option--correct";
                            else if (isSelected) cls += " nexusai-quiz__option--wrong";
                        } else if (isSelected) {
                            cls += " nexusai-quiz__option--selected";
                        }
                        return (
                            <button
                                key={i}
                                type="button"
                                className={cls}
                                onClick={() => !reveal && setSelectedIdx(i)}
                                disabled={reveal}
                            >
                                <span className="nexusai-quiz__option-letter">
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="nexusai-quiz__option-text">{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {reveal && (
                    <div className={`nexusai-quiz__feedback ${selectedIdx === q.correct_index ? "nexusai-quiz__feedback--correct" : "nexusai-quiz__feedback--wrong"}`}>
                        <strong className="nexusai-quiz__feedback-title">
                            {selectedIdx === q.correct_index ? <IconCheck size={14} /> : <IconX size={14} />}
                            {selectedIdx === q.correct_index ? L.correct : L.wrong}
                        </strong>
                        <p className="nexusai-quiz__explanation">{q.explanation}</p>
                        {q.source_filename && (
                            <p className="nexusai-quiz__source">
                                <IconFile size={12} />
                                {L.source}: {q.source_filename}
                            </p>
                        )}
                    </div>
                )}

                <div className="nexusai-quiz__actions">
                    {!reveal ? (
                        <button
                            type="button"
                            className="nexusai-quiz__primary"
                            onClick={verify}
                            disabled={selectedIdx === null}
                        >
                            {L.verify}
                        </button>
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
