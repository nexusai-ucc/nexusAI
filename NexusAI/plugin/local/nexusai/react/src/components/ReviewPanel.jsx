/**
 * ReviewPanel — Repaso basado en errores del quiz (SP-10).
 *
 * Muestra:
 *   - Sugerencias de repaso generadas por IA, agrupadas por archivo fuente,
 *     a partir de los errores más frecuentes del alumno.
 *   - El historial completo de preguntas respondidas incorrectamente, con
 *     la explicación de cada una y el archivo fuente clickeable para descarga.
 *
 * Ambos datasets viven en el backend (tabla quiz_errors, por alumno+curso) —
 * antes esto era solo localStorage del navegador, efímero y no cross-device.
 */

import { useEffect, useState } from "react";
import { listQuizErrors, clearQuizErrors, getReviewSuggestions } from "../api/quiz.js";
import { IconBook, IconCheck, IconFile, IconTarget, IconX } from "./icons.jsx";

function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
        return "";
    }
}

const PAGE_SIZE = 100;

export default function ReviewPanel({ courseId, sesskey, lang = "es" }) {
    const [errors, setErrors] = useState([]);
    const [total, setTotal] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(true);
    const [error, setError] = useState(null);
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
        loadMore:       "Cargar más",
        loading:        "Cargando...",
        score:          (n) => `${Math.round(n * 100)}% de la respuesta correcta`,
        suggTitle:      "Sugerencias de repaso",
        suggSubtitle:   "Basadas en tus errores más frecuentes.",
        suggLoading:    "Analizando tu historial...",
        suggEmpty:      "Todavía no hay suficientes errores para sugerirte algo. ¡Seguí practicando!",
        suggErrorCount: (n) => `${n} error${n === 1 ? "" : "es"}`,
        loadError:      "No se pudo cargar el historial de errores.",
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
        loadMore:       "Load more",
        loading:        "Loading...",
        score:          (n) => `${Math.round(n * 100)}% of the correct answer`,
        suggTitle:      "Review suggestions",
        suggSubtitle:   "Based on your most frequent mistakes.",
        suggLoading:    "Analyzing your history...",
        suggEmpty:      "Not enough errors yet to suggest something. Keep practicing!",
        suggErrorCount: (n) => `${n} error${n === 1 ? "" : "s"}`,
        loadError:      "Could not load the error history.",
    };

    const typeLabel = (qt) => ({
        multiple_choice: L.typeMC,
        true_false:      L.typeTF,
        open:            L.typeOpen,
    }[qt] || qt);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);
        listQuizErrors(courseId, 90, PAGE_SIZE, 0)
            .then((data) => {
                if (cancelled) return;
                setErrors(data?.items || []);
                setTotal(data?.total ?? 0);
            })
            .catch((err) => { if (!cancelled) setError(err.message || L.loadError); })
            .finally(() => { if (!cancelled) setLoading(false); });

        setSuggestionsLoading(true);
        getReviewSuggestions(courseId)
            .then((data) => { if (!cancelled) setSuggestions(data?.suggestions || []); })
            .catch(() => { if (!cancelled) setSuggestions([]); })
            .finally(() => { if (!cancelled) setSuggestionsLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const clearAll = async () => {
        setErrors([]);
        setTotal(0);
        setSuggestions([]);
        try { await clearQuizErrors(courseId); } catch { /* best-effort */ }
    };

    const hasMore = errors.length < total;

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await listQuizErrors(courseId, 90, PAGE_SIZE, errors.length);
            setErrors((prev) => [...prev, ...(data?.items || [])]);
            setTotal(data?.total ?? total);
        } catch (err) {
            setError(err.message || L.loadError);
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidDocumentId = (id) => typeof id === "string" && UUID_RE.test(id);

    const openDownload = (documentId) => {
        if (!documentId || !sesskey) return;
        const params = new URLSearchParams({
            document_id: String(documentId),
            courseid:    String(courseId || ""),
            sesskey,
        });
        window.open(`/local/nexusai/document_download.php?${params}`, "_blank", "noopener,noreferrer");
    };

    // ── Loading state (primer fetch) ──
    if (loading) {
        return (
            <div className="nexusai-review nexusai-review--empty">
                <div className="nexusai-quiz__spinner" />
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="nexusai-alert nexusai-alert--error" role="alert">
                <span>{error}</span>
            </div>
        );
    }

    // ── Empty state (sin errores ni sugerencias) ──
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
            {/* Sugerencias de repaso (SP-10) */}
            <div className="nexusai-review__suggestions">
                <div className="nexusai-review__suggestions-header">
                    <IconTarget size={16} />
                    <div>
                        <h4 className="nexusai-review__suggestions-title">{L.suggTitle}</h4>
                        <p className="nexusai-review__suggestions-subtitle">{L.suggSubtitle}</p>
                    </div>
                </div>

                {suggestionsLoading && (
                    <div className="nexusai-review__suggestions-loading">
                        <div className="nexusai-quiz__spinner" />
                        <span>{L.suggLoading}</span>
                    </div>
                )}

                {!suggestionsLoading && suggestions.length === 0 && (
                    <p className="nexusai-review__suggestions-empty">{L.suggEmpty}</p>
                )}

                {!suggestionsLoading && suggestions.length > 0 && (
                    <div className="nexusai-review__suggestions-list">
                        {suggestions.map((s, i) => {
                            const canDownload = isValidDocumentId(s.source_document_id) && !!sesskey;
                            return (
                                <div key={i} className="nexusai-review__suggestion-card">
                                    <div className="nexusai-review__suggestion-top">
                                        <span className="nexusai-review__suggestion-topic">{s.topic}</span>
                                        <span className="nexusai-review__suggestion-count">
                                            {L.suggErrorCount(s.error_count)}
                                        </span>
                                    </div>
                                    <p className="nexusai-review__suggestion-text">{s.suggestion}</p>
                                    {s.source_filename && (
                                        <button
                                            type="button"
                                            className={`nexusai-review__source ${canDownload ? "nexusai-review__source--link" : ""}`}
                                            onClick={() => canDownload && openDownload(s.source_document_id)}
                                            disabled={!canDownload}
                                            title={canDownload ? L.download : L.noFile}
                                        >
                                            <IconFile size={12} />
                                            <span>{s.source_filename}</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Header */}
            <div className="nexusai-review__header">
                <div>
                    <h4 className="nexusai-review__title">{L.title}</h4>
                    <p className="nexusai-review__subtitle">
                        {hasMore ? `${errors.length} / ${total}` : errors.length} {L.subtitle}
                    </p>
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
                    const canDownload = isValidDocumentId(err.source_document_id) && !!sesskey;
                    const tfLetters  = ["V", "F"];

                    return (
                        <div key={err.id} className="nexusai-review__card">
                            {/* Card top: badge + date + toggle */}
                            <div className="nexusai-review__card-top">
                                <span className={`nexusai-review__badge nexusai-review__badge--${err.question_type}`}>
                                    {typeLabel(err.question_type)}
                                </span>
                                <span className="nexusai-review__date">{formatDate(err.created_at)}</span>
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

            {hasMore && (
                <button
                    type="button"
                    className="nexusai-review__load-more"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                >
                    {loadingMore ? L.loading : `${L.loadMore} (${errors.length} / ${total})`}
                </button>
            )}
        </div>
    );
}
