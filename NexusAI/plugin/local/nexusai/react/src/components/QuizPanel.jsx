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

export default function QuizPanel({ courseId, lang = "es" }) {
    const [stage, setStage] = useState("setup"); // setup | loading | playing | finished | error
    const [topic, setTopic] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [quiz, setQuiz] = useState(null);
    const [error, setError] = useState(null);

    // Estado del juego en curso
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [reveal, setReveal] = useState(false);
    const [score, setScore] = useState(0);

    const L = lang === "es" ? {
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
        errorGeneric:  "No se pudo generar el quiz",
    } : {
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
        errorGeneric:  "Could not generate quiz",
    };

    const start = async () => {
        setError(null);
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
            console.error("[NexusAI] generateQuiz failed:", err);
            setError(err.message || L.errorGeneric);
            setStage("error");
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
                    <h4 className="nexusai-quiz__intro-title">
                        🎯 {lang === "es" ? "Quiz de práctica" : "Practice Quiz"}
                    </h4>
                    <p className="nexusai-quiz__intro-text">
                        {lang === "es"
                            ? "Genero preguntas de opción múltiple desde el material del curso para que repases."
                            : "I generate multiple-choice questions from the course material so you can review."}
                    </p>
                </div>
                <div className="nexusai-quiz__field">
                    <label className="nexusai-quiz__label">{L.topicLabel}</label>
                    <input
                        type="text"
                        className="nexusai-quiz__input"
                        placeholder={L.topicPlaceholder}
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        maxLength={200}
                    />
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
                        ← {lang === "es" ? "Volver" : "Back"}
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
                        <strong>
                            {selectedIdx === q.correct_index ? `✓ ${L.correct}` : `✗ ${L.wrong}`}
                        </strong>
                        <p className="nexusai-quiz__explanation">{q.explanation}</p>
                        {q.source_filename && (
                            <p className="nexusai-quiz__source">
                                📄 {L.source}: {q.source_filename}
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
                            {currentIdx >= total - 1 ? L.finish : L.next} →
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
        const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚";
        return (
            <div className="nexusai-quiz nexusai-quiz--center">
                <div className="nexusai-quiz__final">
                    <div className="nexusai-quiz__final-emoji">{emoji}</div>
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
