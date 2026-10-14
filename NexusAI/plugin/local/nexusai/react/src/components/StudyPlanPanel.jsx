// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * StudyPlanPanel — personalized study plan.
 *
 * Combines quiz errors + chat questions the material could not answer well
 * (`local_nexusai_quiz_study_plan`) with the next event of the course
 * calendar (`getUpcomingEvents`, CAL-01, 100% client-side)
 * to tell the student what to review and why, without them having to
 * ask. The exam banner and the topic list are two parallel signals —
 * a specific exam is not correlated with a specific topic (see this
 * feature's plan for the reason).
 *
 * It also offers the pre-exam review summary (BUS-04): the student
 * optionally picks a section and generates a combined summary of all the
 * relevant indexed material — it reuses `getPreExamSummary`, without
 * automatically linking the banner's exam to a section (same reason as above:
 * that data does not exist today, the student picks it).
 */

import { useEffect, useState } from "react";
import { getStudyPlan, dismissStudyPlanTopic } from "../api/quiz.js";
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
    const [dismissingKey, setDismissingKey] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);
    const [summary, setSummary] = useState(null);

    const L = lang === "es" ? {
        empty:      "¡Vas bien!",
        emptyHint:  "No detectamos temas pendientes por ahora. Seguí practicando para mantenerlo así.",
        error:      "No se pudo cargar tu plan de estudio.",
        practice:   "Practicar este tema",
        dismiss:    "Ya lo entendí",
        dismissing: "Descartando...",
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
        dismiss:    "I've got this",
        dismissing: "Dismissing...",
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

    // `topic` is text the LLM generates on every call, not a stable key (see
    // StudyPlanTopic in app/quiz/router.py) — we identify each topic by the
    // real IDs behind it, not by its position in the list, so two concurrent
    // dismissals do not overwrite each other.
    const topicKey = (t) => `${(t.quiz_error_ids || []).join(",")}|${(t.gap_question_ids || []).join(",")}`;

    const handleDismissTopic = async (t) => {
        const key = topicKey(t);
        setDismissingKey(key);
        try {
            await dismissStudyPlanTopic(courseId, t.quiz_error_ids || [], t.gap_question_ids || []);
            setTopics((prev) => prev.filter((topic) => topicKey(topic) !== key));
        } catch {
            // Silent failure: the topic stays visible, the student can retry.
        } finally {
            setDismissingKey(null);
        }
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

        // Independent fetches: the calendar is a secondary signal (the
        // deadline banner) and must not take down the study plan if it fails
        // — e.g. core_calendar_get_action_events_by_course throws in Moodle
        // for users not enrolled in the course (admin without a student role),
        // a real case that should not break the plan itself.
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
            <div
                className="nexusai-studyplan nexusai-studyplan--loading"
                role="status"
                aria-label={lang === "es" ? "Cargando plan de estudio" : "Loading study plan"}
            >
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
                            aria-label={lang === "es" ? "Unidad para el resumen de repaso" : "Unit for the review summary"}
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
                    <div className="nexusai-studyplan__review-loading" role="status" aria-label={L.generating}>
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
                    {topics.map((t) => {
                        const key = topicKey(t);
                        return (
                        <div key={key} className="nexusai-studyplan__card">
                            <div className="nexusai-studyplan__card-top">
                                <IconTarget size={16} />
                                <span className="nexusai-studyplan__card-topic">{t.topic}</span>
                            </div>
                            {t.reason && <p className="nexusai-studyplan__card-reason">{t.reason}</p>}
                            <div className="nexusai-studyplan__card-meta">
                                {t.quiz_error_count > 0 && <span>{L.quizErrors(t.quiz_error_count)}</span>}
                                {t.gap_count > 0 && <span>{L.gaps(t.gap_count)}</span>}
                            </div>
                            <div className="nexusai-studyplan__card-actions">
                                <button
                                    type="button"
                                    className="nexusai-studyplan__card-btn"
                                    onClick={() => onPracticeTopic?.(t.suggested_quiz_topic || t.topic)}
                                    aria-label={`${L.practice}: ${t.topic}`}
                                >
                                    {L.practice}
                                </button>
                                <button
                                    type="button"
                                    className="nexusai-studyplan__card-btn nexusai-studyplan__card-btn--ghost"
                                    onClick={() => handleDismissTopic(t)}
                                    disabled={dismissingKey === key}
                                    aria-label={`${L.dismiss}: ${t.topic}`}
                                >
                                    {dismissingKey === key ? L.dismissing : L.dismiss}
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
