/**
 * CalendarPanel — próximos exámenes y entregas del curso (CAL-01 + CAL-02).
 *
 * CAL-01: Los eventos vienen de la webservice nativa core_calendar_get_action_events_by_course.
 * CAL-02: El alumno puede configurar alertas por evento (sin alerta / 1 / 3 / 7 días antes).
 *         Las alertas se persisten en FastAPI. Un banner muestra los eventos cuyo momento
 *         de alerta ya llegó (calculado client-side).
 */

import { useEffect, useState } from "react";
import { getUpcomingEvents } from "../api/calendar.js";
import { listCalendarAlerts, saveCalendarAlert } from "../api/calendarAlerts.js";
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
    // alerts: { [eventId]: daysBefore }
    const [alerts, setAlerts] = useState({});
    const [savingAlert, setSavingAlert] = useState({});

    const userId = window.M?.cfg?.userId ?? 1;

    const L = lang === "es" ? {
        title:        "Próximos vencimientos",
        rangeLabel:   "Mostrar:",
        range30:      "Próximos 30 días",
        range90:      "Próximos 90 días",
        empty:        "No hay exámenes ni entregas próximos.",
        emptyHint:    "Cuando tu docente cargue fechas en el curso, las vas a ver acá con la opción de que te avisemos antes.",
        error:        "No se pudo cargar el calendario del curso.",
        openInMoodle: "Ver en Moodle",
        alertLabel:   "Alertarme:",
        alertNone:    "Sin alerta",
        alert1:       "1 día antes",
        alert3:       "3 días antes",
        alert7:       "7 días antes",
        bannerPrefix: "Próximo",
        bannerPrefixPlural: "Próximos",
    } : {
        title:        "Upcoming deadlines",
        rangeLabel:   "Show:",
        range30:      "Next 30 days",
        range90:      "Next 90 days",
        empty:        "No upcoming exams or assignments.",
        emptyHint:    "Once your teacher adds dates to the course, you'll see them here with the option to get reminded ahead of time.",
        error:        "Could not load the course calendar.",
        openInMoodle: "Open in Moodle",
        alertLabel:   "Alert me:",
        alertNone:    "No alert",
        alert1:       "1 day before",
        alert3:       "3 days before",
        alert7:       "7 days before",
        bannerPrefix: "Upcoming",
        bannerPrefixPlural: "Upcoming",
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

    useEffect(() => {
        let cancelled = false;
        listCalendarAlerts(userId, courseId)
            .then((list) => {
                if (cancelled) return;
                const map = {};
                list.forEach((a) => { map[a.event_id] = a.days_before; });
                setAlerts(map);
            })
            .catch(() => { /* silencioso — las alertas son opcionales */ });
        return () => { cancelled = true; };
    }, [courseId, userId]);

    async function handleAlertChange(event, daysBefore) {
        const eventId = event.id;
        setSavingAlert((prev) => ({ ...prev, [eventId]: true }));
        setAlerts((prev) => ({ ...prev, [eventId]: daysBefore }));
        try {
            await saveCalendarAlert({
                userId,
                courseId,
                eventId,
                eventName:      event.name,
                eventTimestamp: event.timestart,
                daysBefore,
            });
        } catch {
            // Revertir estado si falla
            setAlerts((prev) => ({ ...prev, [eventId]: alerts[eventId] ?? 0 }));
        } finally {
            setSavingAlert((prev) => ({ ...prev, [eventId]: false }));
        }
    }

    const nowSec = Date.now() / 1000;
    const dueAlerts = events.filter((ev) => {
        const db = alerts[ev.id];
        if (!db) return false;
        return nowSec >= ev.timestart - db * 86400;
    });

    return (
        <div className="nexusai-calendar">
            {dueAlerts.length > 0 && (
                <div className="nexusai-calendar__alert-banner" role="alert">
                    <span className="nexusai-calendar__alert-banner-prefix">
                        ⚠ {dueAlerts.length > 1 ? L.bannerPrefixPlural : L.bannerPrefix}:
                    </span>
                    {dueAlerts.map((ev) => (
                        <span key={ev.id} className="nexusai-calendar__alert-badge">{ev.name}</span>
                    ))}
                </div>
            )}

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
                    <p className="nexusai-calendar__empty-hint">{L.emptyHint}</p>
                </div>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="nexusai-calendar__list">
                    {events.map((e) => (
                        <div key={e.id} className="nexusai-calendar-item-wrapper">
                            <a
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
                            <div className="nexusai-calendar__alert-row">
                                <label
                                    htmlFor={`cal-alert-${e.id}`}
                                    className="nexusai-calendar__alert-label"
                                >
                                    {L.alertLabel}
                                </label>
                                <select
                                    id={`cal-alert-${e.id}`}
                                    className="nexusai-calendar__alert-select"
                                    value={alerts[e.id] ?? 0}
                                    disabled={!!savingAlert[e.id]}
                                    onChange={(ev) => handleAlertChange(e, Number(ev.target.value))}
                                >
                                    <option value={0}>{L.alertNone}</option>
                                    <option value={1}>{L.alert1}</option>
                                    <option value={3}>{L.alert3}</option>
                                    <option value={7}>{L.alert7}</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
