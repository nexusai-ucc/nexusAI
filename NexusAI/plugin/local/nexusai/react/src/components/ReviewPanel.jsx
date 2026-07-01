/**
 * ReviewPanel — Repaso basado en errores del quiz (SP-10).
 *
 * Muestra las preguntas respondidas incorrectamente en quizes anteriores,
 * con la explicación de cada una y el archivo fuente clickeable para descarga.
 *
 * Los errores se leen de localStorage (clave: nexusai_quiz_errors_{courseId})
 * y son guardados por QuizPanel al finalizar cada quiz.
 */

import { useState } from "react";
import { IconBook, IconCheck, IconFile, IconX } from "./icons.jsx";

const LS_KEY = (courseId) => `nexusai_quiz_errors_${courseId}`;

function loadErrors(courseId) {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY(courseId)) || "[]");
    } catch {
        return [];
    }
}

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

export default function ReviewPanel({ courseId, sesskey, lang = "es" }) {
    const [errors, setErrors] = useState(() => loadErrors(courseId));
    const [expanded, setExpanded] = useState({});

    const L = lang === "es" ? {
        title:          "Repaso de errores",
        subtitle:       "Preguntas que respondiste mal en quizes anteriores.",
        empty:          "¡Sin errores recientes!",
        emptyHint:      "Completá un quiz para que tus respuestas incorrectas aparezcan aquí.",
        clear:          "Borrar historial",
        yourAnswer:     "Tu respuesta",
        correctAnswer:  "Respuesta correcta",
        explanation:    "Explicación",
        feedback:       "Evaluación IA",
        source:         "Fuente",
        download:       "Abrir archivo fuente",
        noFile:         "Archivo no disponible para descarga",
        typeMC:         "Opción múltiple",
        typeTF:         "Verdadero / Falso",
        typeOpen:       "Pregunta abierta",
        showMore:       "Ver explicación",
        showLess:       "Ocultar",
        score:          (n) => `${Math.round(n * 100)}% de la respuesta correcta`,
    } : {
        title:          "Error review",
        subtitle:       "Questions you answered incorrectly in previous quizzes.",
        empty:          "No recent errors!",
        emptyHint:      "Complete a quiz to see your incorrect answers here.",
        clear:          "Clear history",
        yourAnswer:     "Your answer",
        correctAnswer:  "Correct answer",
        explanation:    "Explanation",
        feedback:       "AI evaluation",
        source:         "Source",
        download:       "Open source file",
        noFile:         "File not available for download",
        typeMC:         "Multiple choice",
        typeTF:         "True / False",
        typeOpen:       "Open question",
        showMore:       "See explanation",
        showLess:       "Hide",
        score:          (n) => `${Math.round(n * 100)}% of the correct answer`,
    };

    const typeLabel = (qt) => ({
        multiple_choice: L.typeMC,
        true_false:      L.typeTF,
        open:            L.typeOpen,
    }[qt] || qt);

    const clearAll = () => {
        try { localStorage.removeItem(LS_KEY(courseId)); } catch { /* */ }
        setErrors([]);
    };

    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const openDownload = (documentId) => {
        if (!documentId || !sesskey) return;
        const params = new URLSearchParams({
            document_id: String(documentId),
            courseid:    String(courseId || ""),
            sesskey,
        });
        window.open(`/local/nexusai/document_download.php?${params}`, "_blank", "noopener,noreferrer");
    };

    // ── Empty state ──
    if (!errors.length) {
        return (
            <div className="nexusai-review nexusai-review--empty">
                <div className="nexusai-review__empty-icon">
                    <IconBook size={32} />
                </div>
                <p className="nexusai-review__empty-title">{L.empty}</p>
                <p className="nexusai-review__empty-hint">{L.emptyHint}</p>
            </div>
        );
    }

    return (
        <div className="nexusai-review">
            {/* Header */}
            <div className="nexusai-review__header">
                <div>
                    <h4 className="nexusai-review__title">{L.title}</h4>
                    <p className="nexusai-review__subtitle">{errors.length} {L.subtitle}</p>
                </div>
                <button
                    type="button"
                    className="nexusai-review__clear-btn"
                    onClick={clearAll}
                    title={L.clear}
                >
                    {L.clear}
                </button>
            </div>

            {/* Error cards */}
            <div className="nexusai-review__list">
                {errors.map((err) => {
                    const isOpen  = err.question_type === "open";
                    const isTF    = err.question_type === "true_false";
                    const exp     = expanded[err.id];
                    const canDownload = !!(err.source_document_id && sesskey);
                    const tfLetters  = ["V", "F"];

                    return (
                        <div key={err.id} className="nexusai-review__card">
                            {/* Card top: badge + date + toggle */}
                            <div className="nexusai-review__card-top">
                                <span className={`nexusai-review__badge nexusai-review__badge--${err.question_type}`}>
                                    {typeLabel(err.question_type)}
                                </span>
                                <span className="nexusai-review__date">{formatDate(err.timestamp)}</span>
                            </div>

                            {/* Question text */}
                            <p className="nexusai-review__question">{err.question}</p>

                            {/* MC / T/F: opciones con highlight */}
                            {!isOpen && err.options?.length > 0 && (
                                <div className="nexusai-review__options">
                                    {err.options.map((opt, i) => {
                                        const isCorrect  = i === err.correct_index;
                                        const isWrong    = i === err.user_selected_index && !isCorrect;
                                        let cls = "nexusai-review__opt";
                                        if (isCorrect) cls += " nexusai-review__opt--correct";
                                        else if (isWrong) cls += " nexusai-review__opt--wrong";
                                        const letter = isTF ? tfLetters[i] : String.fromCharCode(65 + i);
                                        return (
                                            <div key={i} className={cls}>
                                                <span className="nexusai-review__opt-letter">{letter}</span>
                                                <span className="nexusai-review__opt-text">{opt}</span>
                                                {isCorrect && <IconCheck size={12} />}
                                                {isWrong   && <IconX    size={12} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Open: respuesta del alumno */}
                            {isOpen && err.user_answer && (
                                <div className="nexusai-review__open-answer">
                                    <span className="nexusai-review__open-label">{L.yourAnswer}</span>
                                    <p className="nexusai-review__open-text">{err.user_answer}</p>
                                </div>
                            )}

                            {/* Toggle explicación */}
                            <button
                                type="button"
                                className="nexusai-review__toggle"
                                onClick={() => toggleExpand(err.id)}
                            >
                                {exp ? L.showLess : L.showMore}
                            </button>

                            {exp && (
                                <div className="nexusai-review__explanation">
                                    <p className="nexusai-review__explanation-label">
                                        {isOpen ? L.feedback : L.explanation}
                                    </p>
                                    <p className="nexusai-review__explanation-text">
                                        {isOpen ? (err.ai_feedback || err.explanation) : err.explanation}
                                    </p>
                                    {isOpen && typeof err.ai_score === "number" && (
                                        <p className="nexusai-review__score">{L.score(err.ai_score)}</p>
                                    )}
                                </div>
                            )}

                            {/* Archivo fuente */}
                            {err.source_filename && (
                                <button
                                    type="button"
                                    className={`nexusai-review__source ${canDownload ? "nexusai-review__source--link" : ""}`}
                                    onClick={() => canDownload && openDownload(err.source_document_id)}
                                    disabled={!canDownload}
                                    title={canDownload ? L.download : L.noFile}
                                >
                                    <IconFile size={12} />
                                    <span>{err.source_filename}</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
