/**
 * StudyPlanPanel — plan de estudio personalizado.
 *
 * Combina errores de quiz + preguntas de chat que el material no pudo
 * responder bien (`local_nexusai_quiz_study_plan`) con el próximo evento
 * del calendario del curso (`getUpcomingEvents`, CAL-01, 100% client-side)
 * para decirle al alumno qué repasar y por qué, sin que tenga que
 * pedirlo. El banner de examen y la lista de temas son dos señales en
 * paralelo — no se correlaciona un examen puntual con un tema específico
 * (ver plan de esta feature para el porqué).
 *
 * También ofrece el resumen de repaso pre-parcial (BUS-04): el alumno elige
 * opcionalmente una unidad y genera un resumen combinado de todo el material
 * indexado relevante — reusa `getPreExamSummary`, sin vincular automáticamente
 * el examen del banner con una unidad (mismo motivo que arriba: no hay ese
 * dato hoy, lo elige el alumno).
 */

import { useEffect, useState } from "react";
import { getStudyPlan } from "../api/quiz.js";
import { getUpcomingEvents } from "../api/calendar.js";
import { getPreExamSummary } from "../api/summary.js";
import { listCourseSections } from "../api/courseSections.js";
import { IconBook, IconCalendar, IconTarget } from "./icons.jsx";

function daysUntil(timesort) {
    const diffMs = timesort * 1000 - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86400000));
}

export default function StudyPlanPanel({ courseId, lang = "es", onPracticeTopic }) {
    const [topics, setTopics] = useState(null);
    const [nextEvent, setNextEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState("");
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);
    const [summary, setSummary] = useState(null);

    const L = lang === "es" ? {
        empty:      "¡Vas bien!",
        emptyHint:  "No detectamos temas pendientes por ahora. Seguí practicando para mantenerlo así.",
        error:      "No se pudo cargar tu plan de estudio.",
        practice:   "Practicar este tema",
        quizErrors: (n) => `${n} error${n === 1 ? "" : "es"} de quiz`,
        gaps:       (n) => `${n} pregunta${n === 1 ? "" : "s"} sin responder`,
        eventIn:    (name, d) => (d === 0 ? `${name} es hoy` : `${name} es en ${d} día${d === 1 ? "" : "s"}`),
        reviewTitle:    "Resumen de repaso",
        reviewHint:     "Combina todo el material indexado en un solo resumen para estudiar antes del examen.",
        allSections:    "Todo el curso",
        generate:       "Generar resumen",
        generating:     "Generando resumen...",
        reviewError:    "No se pudo generar el resumen. Intentá de nuevo.",
        reviewEmpty:    "No hay material indexado para generar un resumen (probá con otra unidad).",
        sourcesLabel:   (n) => `Basado en ${n} documento${n === 1 ? "" : "s"}`,
    } : {
        empty:      "You're doing great!",
        emptyHint:  "No pending topics detected right now. Keep practicing to stay on track.",
        error:      "Could not load your study plan.",
        practice:   "Practice this topic",
        quizErrors: (n) => `${n} quiz error${n === 1 ? "" : "s"}`,
        gaps:       (n) => `${n} unanswered question${n === 1 ? "" : "s"}`,
        eventIn:    (name, d) => (d === 0 ? `${name} is today` : `${name} is in ${d} day${d === 1 ? "" : "s"}`),
        reviewTitle:    "Review summary",
        reviewHint:     "Combines all indexed material into a single summary to study before the exam.",
        allSections:    "Whole course",
        generate:       "Generate summary",
        generating:     "Generating summary...",
        reviewError:    "Could not generate the summary. Try again.",
        reviewEmpty:    "No indexed material to summarize (try a different section).",
        sourcesLabel:   (n) => `Based on ${n} document${n === 1 ? "" : "s"}`,
    };

    const handleGenerateSummary = async () => {
        setSummaryLoading(true);
        setSummaryError(null);
        setSummary(null);
        try {
            const section = selectedSection === "" ? null : Number(selectedSection);
            const data = await getPreExamSummary(courseId, section);
            if (!data?.summary) {
                setSummaryError(L.reviewEmpty);
            } else {
                setSummary(data);
            }
        } catch {
            setSummaryError(L.reviewError);
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        // Fetches independientes: el calendario es una señal secundaria (el
        // banner de deadline) y no debe tumbar el plan de estudio si falla
        // — ej. core_calendar_get_action_events_by_course tira excepción en
        // Moodle para usuarios no matriculados en el curso (admin sin rol de
        // alumno), un caso real que no debería romper el plan en sí.
        getStudyPlan(courseId)
            .then((planData) => { if (!cancelled) setTopics(planData?.topics || []); })
            .catch(() => { if (!cancelled) setError(L.error); })
            .finally(() => { if (!cancelled) setLoading(false); });

        getUpcomingEvents(courseId, 7)
            .then((events) => { if (!cancelled) setNextEvent(events?.[0] || null); })
            .catch(() => { /* banner de deadline es secundario — falla en silencio */ });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    useEffect(() => {
        let cancelled = false;
        listCourseSections(courseId).then((list) => {
            if (!cancelled) setSections(list || []);
        }).catch(() => {
            if (!cancelled) setSections([]);
        });
        return () => { cancelled = true; };
    }, [courseId]);

    if (loading) {
        return (
            <div className="nexusai-studyplan nexusai-studyplan--loading">
                <div className="nexusai-quiz__spinner" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="nexusai-alert nexusai-alert--error" role="alert">
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="nexusai-studyplan">
            {nextEvent && (
                <div className="nexusai-studyplan__banner">
                    <IconCalendar size={16} />
                    <span>{L.eventIn(nextEvent.name, daysUntil(nextEvent.timesort))}</span>
                </div>
            )}

            <div className="nexusai-studyplan__review">
                <h3 className="nexusai-studyplan__review-title">{L.reviewTitle}</h3>
                <p className="nexusai-studyplan__review-hint">{L.reviewHint}</p>

                <div className="nexusai-studyplan__review-controls">
                    {sections.length > 0 && (
                        <select
                            className="nexusai-studyplan__review-select"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            disabled={summaryLoading}
                        >
                            <option value="">{L.allSections}</option>
                            {sections.map((s) => (
                                <option key={s.section} value={s.section}>{s.name}</option>
                            ))}
                        </select>
                    )}
                    <button
                        type="button"
                        className="nexusai-studyplan__review-btn"
                        onClick={handleGenerateSummary}
                        disabled={summaryLoading}
                    >
                        {summaryLoading ? L.generating : L.generate}
                    </button>
                </div>

                {summaryLoading && (
                    <div className="nexusai-studyplan__review-loading">
                        <div className="nexusai-quiz__spinner" />
                    </div>
                )}

                {summaryError && (
                    <div className="nexusai-alert nexusai-alert--error" role="alert">
                        <span>{summaryError}</span>
                    </div>
                )}

                {summary && !summaryLoading && (
                    <div className="nexusai-studyplan__review-result">
                        <p className="nexusai-studyplan__review-text">{summary.summary}</p>
                        <p className="nexusai-studyplan__review-sources">
                            {L.sourcesLabel(summary.total_documents)}:{" "}
                            {summary.documents_used.map((d) => d.filename).join(", ")}
                        </p>
                    </div>
                )}
            </div>

            {!topics || topics.length === 0 ? (
                <div className="nexusai-studyplan__empty">
                    <div className="nexusai-studyplan__empty-icon">
                        <IconBook size={32} />
                    </div>
                    <p className="nexusai-studyplan__empty-title">{L.empty}</p>
                    <p className="nexusai-studyplan__empty-hint">{L.emptyHint}</p>
                </div>
            ) : (
                <div className="nexusai-studyplan__list">
                    {topics.map((t, i) => (
                        <div key={i} className="nexusai-studyplan__card">
                            <div className="nexusai-studyplan__card-top">
                                <IconTarget size={16} />
                                <span className="nexusai-studyplan__card-topic">{t.topic}</span>
                            </div>
                            {t.reason && <p className="nexusai-studyplan__card-reason">{t.reason}</p>}
                            <div className="nexusai-studyplan__card-meta">
                                {t.quiz_error_count > 0 && <span>{L.quizErrors(t.quiz_error_count)}</span>}
                                {t.gap_count > 0 && <span>{L.gaps(t.gap_count)}</span>}
                            </div>
                            <button
                                type="button"
                                className="nexusai-studyplan__card-btn"
                                onClick={() => onPracticeTopic?.(t.suggested_quiz_topic || t.topic)}
                            >
                                {L.practice}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
