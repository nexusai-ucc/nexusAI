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
import { getCalendarFeed, revokeCalendarFeed } from "../api/calendarFeed.js";
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

    // CAL-07: feed .ics suscribible — se carga solo cuando el alumno abre la
    // sección (evita crear un token en cada page load si nunca la usa).
    const [feedOpen, setFeedOpen] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedUrl, setFeedUrl] = useState(null);
    const [feedEnabled, setFeedEnabled] = useState(true);
    const [feedError, setFeedError] = useState(null);
    const [feedCopied, setFeedCopied] = useState(false);
    const [feedRegenerating, setFeedRegenerating] = useState(false);

    const userId = window.M?.cfg?.userId ?? 1;

    const L = lang === "es" ? {
        title:        "Próximos vencimientos",
        rangeLabel:   "Mostrar:",
        range30:      "Próximos 30 días",
        range90:      "Próximos 90 días",
        empty:        "No hay exámenes ni entregas en este período.",
        error:        "No se pudo cargar el calendario del curso.",
        openInMoodle: "Ver en Moodle",
        alertLabel:   "Alertarme:",
        alertNone:    "Sin alerta",
        alert1:       "1 día antes",
        alert3:       "3 días antes",
        alert7:       "7 días antes",
        bannerPrefix: "Próximo",
        bannerPrefixPlural: "Próximos",
        feedToggle:      "Suscribite a tu calendario",
        feedIntro:       "Recibí los exámenes y entregas de todos tus cursos directo en Google Calendar o Apple Calendar — se actualiza solo, sin tener que volver a exportar.",
        feedLoadingMsg:  "Generando tu link...",
        feedCopy:        "Copiar link",
        feedCopied:      "¡Copiado!",
        feedRegenerate:  "Generar nuevo link",
        feedDisabled:    "El calendario de este sitio no tiene la exportación habilitada. Pedile al administrador que la active en Site administration → Calendar.",
        feedErrorMsg:    "No se pudo generar el link de suscripción.",
    } : {
        title:        "Upcoming deadlines",
        rangeLabel:   "Show:",
        range30:      "Next 30 days",
        range90:      "Next 90 days",
        empty:        "No exams or assignments due in this period.",
        error:        "Could not load the course calendar.",
        openInMoodle: "Open in Moodle",
        alertLabel:   "Alert me:",
        alertNone:    "No alert",
        alert1:       "1 day before",
        alert3:       "3 days before",
        alert7:       "7 days before",
        bannerPrefix: "Upcoming",
        bannerPrefixPlural: "Upcoming",
        feedToggle:      "Subscribe to your calendar",
        feedIntro:       "Get exams and assignments from all your courses straight into Google Calendar or Apple Calendar — it refreshes on its own, no need to export again.",
        feedLoadingMsg:  "Generating your link...",
        feedCopy:        "Copy link",
        feedCopied:      "Copied!",
        feedRegenerate:  "Generate new link",
        feedDisabled:    "This site has calendar export disabled. Ask an administrator to enable it under Site administration → Calendar.",
        feedErrorMsg:    "Could not generate the subscription link.",
    };

    useEffect(() => {
        if (!feedOpen || feedUrl || feedError) return;
        let cancelled = false;
        setFeedLoading(true);
        getCalendarFeed()
            .then((data) => {
                if (cancelled) return;
                setFeedEnabled(!!data?.enabled);
                setFeedUrl(data?.url || null);
            })
            .catch((err) => { if (!cancelled) setFeedError(err.message || String(err)); })
            .finally(() => { if (!cancelled) setFeedLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedOpen]);

    async function handleCopyFeedUrl() {
        if (!feedUrl) return;
        try {
            await navigator.clipboard.writeText(feedUrl);
            setFeedCopied(true);
            setTimeout(() => setFeedCopied(false), 2000);
        } catch {
            // Clipboard API puede fallar en contextos raros — el link ya
            // queda visible en pantalla para copiarlo a mano.
        }
    }

    async function handleRegenerateFeedUrl() {
        setFeedRegenerating(true);
        setFeedError(null);
        try {
            await revokeCalendarFeed();
            const data = await getCalendarFeed();
            setFeedEnabled(!!data?.enabled);
            setFeedUrl(data?.url || null);
        } catch (err) {
            setFeedError(err.message || String(err));
        } finally {
            setFeedRegenerating(false);
        }
    }

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

            <div className="nexusai-calendar__feed">
                <button
                    type="button"
                    className="nexusai-calendar__feed-toggle"
                    onClick={() => setFeedOpen((v) => !v)}
                >
                    <IconCalendar size={13} />
                    {L.feedToggle}
                </button>

                {feedOpen && (
                    <div className="nexusai-calendar__feed-panel">
                        <p className="nexusai-calendar__feed-intro">{L.feedIntro}</p>

                        {feedLoading && (
                            <p className="nexusai-calendar__feed-status">{L.feedLoadingMsg}</p>
                        )}

                        {!feedLoading && feedError && (
                            <p className="nexusai-calendar__feed-status nexusai-calendar__feed-status--error">
                                {L.feedErrorMsg}
                            </p>
                        )}

                        {!feedLoading && !feedError && feedEnabled === false && (
                            <p className="nexusai-calendar__feed-status nexusai-calendar__feed-status--error">
                                {L.feedDisabled}
                            </p>
                        )}

                        {!feedLoading && !feedError && feedEnabled && feedUrl && (
                            <>
                                <div className="nexusai-calendar__feed-urlrow">
                                    <input
                                        type="text"
                                        className="nexusai-calendar__feed-url"
                                        value={feedUrl}
                                        readOnly
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button
                                        type="button"
                                        className="nexusai-calendar__feed-copybtn"
                                        onClick={handleCopyFeedUrl}
                                    >
                                        {feedCopied ? L.feedCopied : L.feedCopy}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="nexusai-calendar__feed-regenbtn"
                                    onClick={handleRegenerateFeedUrl}
                                    disabled={feedRegenerating}
                                >
                                    {feedRegenerating ? "..." : L.feedRegenerate}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

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
