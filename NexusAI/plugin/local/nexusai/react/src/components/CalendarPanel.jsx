/**
 * CalendarPanel — próximos exámenes y entregas del curso (CAL-01 + CAL-02 + CAL-04).
 *
 * CAL-01: Los eventos vienen de la webservice nativa core_calendar_get_action_events_by_course.
 * CAL-02: El alumno puede configurar alertas por evento (sin alerta / 1 / 3 / 7 días antes).
 *         Las alertas se persisten en FastAPI. Un banner muestra los eventos cuyo momento
 *         de alerta ya llegó (calculado client-side).
 * CAL-04: getUpcomingEvents (api/calendar.js) también trae avisos genéricos
 *         de curso (sin Tarea/Quiz asociado) — se distinguen acá con la
 *         entrada "course" de TYPE_LABELS. Las alertas de CAL-02 aplican
 *         igual a estos eventos, sin ningún cambio (ya tienen una fecha real).
 */

import { useEffect, useState } from "react";
import { getUpcomingEvents } from "../api/calendar.js";
import {
    listCalendarAlerts,
    saveCalendarAlert,
    getCalendarFeedUrl,
    revokeCalendarFeed,
} from "../api/calendarAlerts.js";
import { IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconDownload } from "./icons.jsx";
import { useToast } from "./Toast.jsx";
import { getFriendlyErrorMessage } from "./errors.js";

const TYPE_LABELS = {
    mod_assign: { es: "Entrega", en: "Assignment" },
    mod_quiz:   { es: "Examen",  en: "Quiz" },
    course:     { es: "Aviso del curso", en: "Course notice" },
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

// CAL-05 (#364): grilla de mes, alternativa a la lista. Helper puro
// (testeable sin DOM) — agrupa los MISMOS `events` ya cargados por día
// calendario, sin pedir nada nuevo al backend (no hay forma de pedirle a
// getUpcomingEvents un mes arbitrario; el criterio de aceptación pide
// los mismos eventos en ambas vistas, no un rango de datos distinto).
const WEEKDAY_LABELS = {
    es: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
    en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

function dayKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function buildMonthGrid(year, month, events) {
    const eventsByDay = {};
    for (const e of events) {
        const key = dayKey(new Date(e.timesort * 1000));
        if (!eventsByDay[key]) eventsByDay[key] = [];
        eventsByDay[key].push(e);
    }

    // Lunes como primer día de la semana: getDay() da 0=domingo..6=sábado,
    // se rota para que 0=lunes..6=domingo.
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;

    const todayKey = dayKey(new Date());
    const cursor = new Date(year, month, 1 - firstWeekday);

    const weeks = [];
    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const key = dayKey(cursor);
            week.push({
                date: new Date(cursor),
                inMonth: cursor.getMonth() === month,
                isToday: key === todayKey,
                events: eventsByDay[key] || [],
            });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
}

export default function CalendarPanel({ courseId, lang = "es" }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);
    // alerts: { [eventId]: daysBefore }
    const [alerts, setAlerts] = useState({});
    const [savingAlert, setSavingAlert] = useState({});

    // CAL-07 (#377): feed .ics suscribible.
    const [feedOpen, setFeedOpen] = useState(false);
    const [feedUrl, setFeedUrl] = useState(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const [feedError, setFeedError] = useState(null);
    const [feedCopied, setFeedCopied] = useState(false);
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    const [revoking, setRevoking] = useState(false);

    // CAL-06 (#365): descarga puntual del mismo feed (?download=1 — ya
    // soportado por calendar_feed.php desde el PR #437, pensado para esto).
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState(null);

    // CAL-05 (#364): toggle lista/grilla + mes mostrado en la grilla.
    const [view, setView] = useState("list"); // "list" | "grid"
    const [gridMonth, setGridMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const userId = window.M?.cfg?.userId ?? 1;
    const { showSuccess, showError } = useToast();

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
        alertSaved:   "Alerta guardada",
        alertError:   "No se pudo guardar la alerta. Intentá de nuevo.",
        feedToggle:   "Suscribir a mi calendario",
        feedHide:     "Ocultar",
        feedHelp:     "Copiá esta URL y agregala en Google Calendar o Apple Calendar como \"Suscribirse a un calendario\". Los eventos nuevos del curso van a aparecer solos.",
        feedCopy:     "Copiar",
        feedCopied:   "¡Copiado!",
        feedLoadErr:  "No se pudo generar la URL del feed.",
        feedRevoke:   "Generar una URL nueva",
        feedRevokeHint: "Si compartiste la URL por error, generá una nueva. La anterior deja de funcionar (en todos tus cursos).",
        feedRevokeConfirm: "Confirmar",
        feedCancel:   "Cancelar",
        feedRevoking: "Generando...",
        exportIcs:    "Exportar a .ics",
        exporting:    "Generando...",
        viewList:     "Lista",
        viewGrid:     "Mes",
        prevMonth:    "Mes anterior",
        nextMonth:    "Mes siguiente",
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
        alertSaved:   "Alert saved",
        alertError:   "Couldn't save the alert. Try again.",
        feedToggle:   "Subscribe in my calendar",
        feedHide:     "Hide",
        feedHelp:     "Copy this URL and add it in Google Calendar or Apple Calendar as \"Subscribe to calendar\". New course events will show up automatically.",
        feedCopy:     "Copy",
        feedCopied:   "Copied!",
        feedLoadErr:  "Could not generate the feed URL.",
        feedRevoke:   "Generate a new URL",
        feedRevokeHint: "If you shared the URL by mistake, generate a new one. The old one stops working (across all your courses).",
        feedRevokeConfirm: "Confirm",
        feedCancel:   "Cancel",
        feedRevoking: "Generating...",
        exportIcs:    "Export to .ics",
        exporting:    "Generating...",
        viewList:     "List",
        viewGrid:     "Month",
        prevMonth:    "Previous month",
        nextMonth:    "Next month",
    };

    const openFeed = async () => {
        if (feedOpen) { setFeedOpen(false); return; }
        setFeedOpen(true);
        setConfirmRevoke(false);
        if (feedUrl || feedLoading) return;
        setFeedLoading(true);
        setFeedError(null);
        try {
            setFeedUrl(await getCalendarFeedUrl(courseId));
        } catch (err) {
            setFeedError(err.message || L.feedLoadErr);
        } finally {
            setFeedLoading(false);
        }
    };

    const copyFeed = async () => {
        try {
            await navigator.clipboard.writeText(feedUrl);
            setFeedCopied(true);
            setTimeout(() => setFeedCopied(false), 2000);
        } catch {
            /* el input es seleccionable a mano como fallback */
        }
    };

    const doRevoke = async () => {
        setRevoking(true);
        setFeedError(null);
        try {
            setFeedUrl(await revokeCalendarFeed(courseId));
            setConfirmRevoke(false);
        } catch (err) {
            setFeedError(err.message || L.feedLoadErr);
        } finally {
            setRevoking(false);
        }
    };

    // CAL-06 (#365): descarga puntual — reusa la misma URL de feed que
    // "Suscribirme" (la cachea en feedUrl si todavía no se pidió, para no
    // duplicar la llamada si el alumno después abre esa sección).
    const exportIcs = async () => {
        setExporting(true);
        setExportError(null);
        try {
            const url = feedUrl || await getCalendarFeedUrl(courseId);
            if (!feedUrl) setFeedUrl(url);
            window.open(`${url}&download=1`, "_blank", "noopener,noreferrer");
        } catch (err) {
            setExportError(err.message || L.feedLoadErr);
        } finally {
            setExporting(false);
        }
    };

    const changeMonth = (delta) => {
        setGridMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getUpcomingEvents(courseId, days)
            .then((data) => { if (!cancelled) setEvents(data || []); })
            .catch((err) => { if (!cancelled) setError(getFriendlyErrorMessage(err, L.error, lang)); })
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
            showSuccess(L.alertSaved);
        } catch {
            // Revertir estado si falla
            setAlerts((prev) => ({ ...prev, [eventId]: alerts[eventId] ?? 0 }));
            showError(L.alertError);
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

            {!loading && !error && (
                <div className="nexusai-calendar__viewbtns">
                    <button
                        type="button"
                        className={`nexusai-calendar__rangebtn ${view === "list" ? "nexusai-calendar__rangebtn--active" : ""}`}
                        onClick={() => setView("list")}
                    >
                        {L.viewList}
                    </button>
                    <button
                        type="button"
                        className={`nexusai-calendar__rangebtn ${view === "grid" ? "nexusai-calendar__rangebtn--active" : ""}`}
                        onClick={() => setView("grid")}
                    >
                        {L.viewGrid}
                    </button>
                </div>
            )}

            {!loading && !error && view === "list" && events.length === 0 && (
                <div className="nexusai-calendar__empty">
                    <IconCheck size={20} />
                    <p>{L.empty}</p>
                    <p className="nexusai-calendar__empty-hint">{L.emptyHint}</p>
                </div>
            )}

            {!loading && !error && view === "list" && events.length > 0 && (
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

            {!loading && !error && view === "grid" && (
                <div className="nexusai-calendar__grid-wrap">
                    <div className="nexusai-calendar__grid-nav">
                        <button
                            type="button"
                            className="nexusai-calendar__grid-navbtn"
                            onClick={() => changeMonth(-1)}
                            aria-label={L.prevMonth}
                        >
                            <IconChevronLeft size={14} />
                        </button>
                        <span className="nexusai-calendar__grid-monthlabel">
                            {gridMonth.toLocaleDateString(lang === "es" ? "es-AR" : "en-US", { month: "long", year: "numeric" })}
                        </span>
                        <button
                            type="button"
                            className="nexusai-calendar__grid-navbtn"
                            onClick={() => changeMonth(1)}
                            aria-label={L.nextMonth}
                        >
                            <IconChevronRight size={14} />
                        </button>
                    </div>
                    <div className="nexusai-calendar__grid">
                        {WEEKDAY_LABELS[lang === "es" ? "es" : "en"].map((wd, i) => (
                            <span key={i} className="nexusai-calendar__grid-weekday">{wd}</span>
                        ))}
                        {buildMonthGrid(gridMonth.getFullYear(), gridMonth.getMonth(), events).flat().map((cell, i) => (
                            <div
                                key={i}
                                className={[
                                    "nexusai-calendar__grid-cell",
                                    !cell.inMonth ? "nexusai-calendar__grid-cell--outside" : "",
                                    cell.isToday ? "nexusai-calendar__grid-cell--today" : "",
                                ].filter(Boolean).join(" ")}
                                title={cell.events.length ? cell.events.map((e) => e.name).join(", ") : undefined}
                            >
                                <span className="nexusai-calendar__grid-daynum">{cell.date.getDate()}</span>
                                {cell.events.length > 0 && (
                                    <div className="nexusai-calendar__grid-dots">
                                        {cell.events.slice(0, 3).map((e, di) => (
                                            <span
                                                key={di}
                                                className={`nexusai-calendar__grid-dot nexusai-calendar__grid-dot--${e.component || "default"}`}
                                            />
                                        ))}
                                        {cell.events.length > 3 && (
                                            <span className="nexusai-calendar__grid-more">+{cell.events.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className="nexusai-calendar__feed">
                    <div className="nexusai-calendar__feed-actions">
                        <button
                            type="button"
                            className="nexusai-calendar__feed-toggle"
                            onClick={openFeed}
                            aria-expanded={feedOpen}
                        >
                            {feedOpen ? L.feedHide : L.feedToggle}
                        </button>
                        <button
                            type="button"
                            className="nexusai-calendar__export-btn"
                            onClick={exportIcs}
                            disabled={exporting}
                        >
                            <IconDownload size={13} /> {exporting ? L.exporting : L.exportIcs}
                        </button>
                    </div>
                    {exportError && (
                        <p className="nexusai-calendar__feed-status nexusai-calendar__feed-status--error">
                            {exportError}
                        </p>
                    )}

                    {feedOpen && (
                        <div className="nexusai-calendar__feed-body">
                            {feedLoading && <p className="nexusai-calendar__feed-status">…</p>}
                            {feedError && (
                                <p className="nexusai-calendar__feed-status nexusai-calendar__feed-status--error">
                                    {feedError}
                                </p>
                            )}
                            {feedUrl && (
                                <>
                                    <p className="nexusai-calendar__feed-help">{L.feedHelp}</p>
                                    <div className="nexusai-calendar__feed-url-row">
                                        <input
                                            type="text"
                                            className="nexusai-calendar__feed-url"
                                            value={feedUrl}
                                            readOnly
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <button
                                            type="button"
                                            className="nexusai-calendar__feed-copy"
                                            onClick={copyFeed}
                                        >
                                            {feedCopied ? L.feedCopied : L.feedCopy}
                                        </button>
                                    </div>

                                    <p className="nexusai-calendar__feed-revoke-hint">{L.feedRevokeHint}</p>
                                    {confirmRevoke ? (
                                        <div className="nexusai-calendar__feed-revoke-actions">
                                            <button
                                                type="button"
                                                className="nexusai-calendar__feed-revoke nexusai-calendar__feed-revoke--danger"
                                                onClick={doRevoke}
                                                disabled={revoking}
                                            >
                                                {revoking ? L.feedRevoking : L.feedRevokeConfirm}
                                            </button>
                                            <button
                                                type="button"
                                                className="nexusai-calendar__feed-revoke"
                                                onClick={() => setConfirmRevoke(false)}
                                                disabled={revoking}
                                            >
                                                {L.feedCancel}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className="nexusai-calendar__feed-revoke"
                                            onClick={() => setConfirmRevoke(true)}
                                        >
                                            {L.feedRevoke}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
