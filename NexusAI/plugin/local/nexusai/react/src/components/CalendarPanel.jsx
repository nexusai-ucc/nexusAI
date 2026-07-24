/**
 * CalendarPanel — próximos exámenes y entregas del curso (CAL-01).
 *
 * Los datos vienen directo de la webservice nativa de Moodle
 * `core_calendar_get_action_events_by_course` (ver api/calendar.js) — no hay
 * backend Python ni PHP propio involucrados en esta feature.
 */

import { useEffect, useState } from "react";
import { getUpcomingEvents } from "../api/calendar.js";
import { IconCalendar, IconCheck } from "./icons.jsx";

const TYPE_LABELS = {
    mod_assign: { es: "Entrega", en: "Assignment" },
    mod_quiz:   { es: "Examen",  en: "Quiz" },
};

function eventTypeLabel(component, lang) {
    const entry = TYPE_LABELS[component];
    if (!entry) return lang === "es" ? "Evento" : "Event";
    return entry[lang === "es" ? "es" : "en"];
}

function formatDate(timestampSec) {
    try {
        return new Date(timestampSec * 1000).toLocaleDateString(undefined, {
            weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        });
    } catch {
        return "";
    }
}

export default function CalendarPanel({ courseId, lang = "es" }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);

    const L = lang === "es" ? {
        title:      "Próximos vencimientos",
        rangeLabel: "Mostrar:",
        range30:    "Próximos 30 días",
        range90:    "Próximos 90 días",
        empty:      "No hay exámenes ni entregas en este período.",
        error:      "No se pudo cargar el calendario del curso.",
        openInMoodle: "Ver en Moodle",
    } : {
        title:      "Upcoming deadlines",
        rangeLabel: "Show:",
        range30:    "Next 30 days",
        range90:    "Next 90 days",
        empty:      "No exams or assignments due in this period.",
        error:      "Could not load the course calendar.",
        openInMoodle: "Open in Moodle",
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getUpcomingEvents(courseId, days)
            .then((data) => { if (!cancelled) setEvents(data || []); })
            .catch((err) => { if (!cancelled) setError(err.message || L.error); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, days]);

    return (
        <div className="nexusai-calendar">
            <div className="nexusai-calendar__rangebtns">
                <span className="nexusai-quiz__label">{L.rangeLabel}</span>
                {[30, 90].map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={`nexusai-calendar__rangebtn ${days === d ? "nexusai-calendar__rangebtn--active" : ""}`}
                        onClick={() => setDays(d)}
                    >
                        {d === 30 ? L.range30 : L.range90}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="nexusai-quiz nexusai-quiz--center">
                    <div className="nexusai-quiz__spinner" />
                </div>
            )}

            {!loading && error && (
                <div className="nexusai-error" role="alert">
                    <p className="nexusai-error__text">{error}</p>
                </div>
            )}

            {!loading && !error && events.length === 0 && (
                <div className="nexusai-calendar__empty">
                    <IconCheck size={20} />
                    <p>{L.empty}</p>
                </div>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="nexusai-calendar__list">
                    {events.map((e) => (
                        <a
                            key={e.id}
                            className="nexusai-calendar-item"
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={L.openInMoodle}
                        >
                            <div className="nexusai-calendar-item__icon">
                                <IconCalendar size={16} />
                            </div>
                            <div className="nexusai-calendar-item__body">
                                <div className="nexusai-calendar-item__row">
                                    <span className="nexusai-calendar-item__name">{e.name}</span>
                                    <span className="nexusai-calendar-item__badge">
                                        {eventTypeLabel(e.component, lang)}
                                    </span>
                                </div>
                                <span className="nexusai-calendar-item__date">{formatDate(e.timesort)}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
