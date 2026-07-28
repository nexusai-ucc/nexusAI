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
 */

import { useEffect, useState } from "react";
import { getStudyPlan } from "../api/quiz.js";
import { getUpcomingEvents } from "../api/calendar.js";
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

    const L = lang === "es" ? {
        empty:      "¡Vas bien!",
        emptyHint:  "No detectamos temas pendientes por ahora. Seguí practicando para mantenerlo así.",
        error:      "No se pudo cargar tu plan de estudio.",
        practice:   "Practicar este tema",
        quizErrors: (n) => `${n} error${n === 1 ? "" : "es"} de quiz`,
        gaps:       (n) => `${n} pregunta${n === 1 ? "" : "s"} sin responder`,
        eventIn:    (name, d) => (d === 0 ? `${name} es hoy` : `${name} es en ${d} día${d === 1 ? "" : "s"}`),
    } : {
        empty:      "You're doing great!",
        emptyHint:  "No pending topics detected right now. Keep practicing to stay on track.",
        error:      "Could not load your study plan.",
        practice:   "Practice this topic",
        quizErrors: (n) => `${n} quiz error${n === 1 ? "" : "s"}`,
        gaps:       (n) => `${n} unanswered question${n === 1 ? "" : "s"}`,
        eventIn:    (name, d) => (d === 0 ? `${name} is today` : `${name} is in ${d} day${d === 1 ? "" : "s"}`),
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        Promise.all([
            getStudyPlan(courseId),
            getUpcomingEvents(courseId, 7),
        ]).then(([planData, events]) => {
            if (cancelled) return;
            setTopics(planData?.topics || []);
            setNextEvent(events?.[0] || null);
        }).catch(() => {
            if (!cancelled) setError(L.error);
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
