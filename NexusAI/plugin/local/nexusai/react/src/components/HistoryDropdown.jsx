/**
 * HistoryDropdown — sidebar/dropdown con la lista de sesiones previas del alumno.
 *
 * Click en un item → carga los mensajes y le pide a ChatApp que retome esa sesión.
 *
 * Lazy loading: la lista se pide solo cuando el usuario abre el dropdown,
 * no en cada render.
 */

import { useEffect, useState } from "react";
import { listSessions } from "../api/history.js";

function relativeTime(iso, lang = "es") {
    if (!iso) return "";
    try {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr  = Math.floor(min / 60);
        const day = Math.floor(hr / 24);

        const T = lang === "es"
            ? { now: "ahora", min: "min", hr: "h", day: "d" }
            : { now: "now",   min: "min", hr: "h", day: "d" };

        if (sec < 60)  return T.now;
        if (min < 60)  return `${min}${T.min}`;
        if (hr < 24)   return `${hr}${T.hr}`;
        return `${day}${T.day}`;
    } catch {
        return "";
    }
}

export default function HistoryDropdown({ open, onClose, courseId, currentSessionId, onSelectSession, lang = "es" }) {
    const [sessions, setSessions] = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [scopeCourse, setScopeCourse] = useState(true);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        listSessions({ courseId, scopeCourse, limit: 20 })
            .then((data) => { if (!cancelled) setSessions(data?.sessions || []); })
            .catch((err) => { if (!cancelled) setError(err.message || "Error"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, courseId, scopeCourse]);

    if (!open) return null;

    const labels = lang === "es"
        ? {
            title:       "Historial",
            empty:       "Todavía no tenés conversaciones previas.",
            loading:     "Cargando...",
            scopeCourse: "Este curso",
            scopeAll:    "Todos mis cursos",
            messagesPl:  "mensajes",
            messageSg:   "mensaje",
        }
        : {
            title:       "History",
            empty:       "No previous conversations yet.",
            loading:     "Loading...",
            scopeCourse: "This course",
            scopeAll:    "All my courses",
            messagesPl:  "messages",
            messageSg:   "message",
        };

    return (
        <div className="nexusai-history">
            <div className="nexusai-history__header">
                <span className="nexusai-history__title">{labels.title}</span>
                <button
                    type="button"
                    className="nexusai-history__close"
                    onClick={onClose}
                    aria-label="Cerrar"
                >×</button>
            </div>

            <div className="nexusai-history__scope">
                <button
                    type="button"
                    className={`nexusai-history__scope-btn ${scopeCourse ? "nexusai-history__scope-btn--active" : ""}`}
                    onClick={() => setScopeCourse(true)}
                >
                    {labels.scopeCourse}
                </button>
                <button
                    type="button"
                    className={`nexusai-history__scope-btn ${!scopeCourse ? "nexusai-history__scope-btn--active" : ""}`}
                    onClick={() => setScopeCourse(false)}
                >
                    {labels.scopeAll}
                </button>
            </div>

            <div className="nexusai-history__list">
                {loading && <p className="nexusai-history__empty">{labels.loading}</p>}
                {error && <p className="nexusai-history__empty" style={{ color: "#dc2626" }}>{error}</p>}
                {!loading && !error && sessions && sessions.length === 0 && (
                    <p className="nexusai-history__empty">{labels.empty}</p>
                )}
                {!loading && !error && sessions && sessions.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        className={`nexusai-history__item ${currentSessionId === s.id ? "nexusai-history__item--active" : ""}`}
                        onClick={() => onSelectSession?.(s.id)}
                    >
                        <div className="nexusai-history__item-row">
                            <span className="nexusai-history__item-preview">
                                {s.last_message_preview || "(sin mensajes)"}
                            </span>
                            <span className="nexusai-history__item-time">
                                {relativeTime(s.updated_at, lang)}
                            </span>
                        </div>
                        <div className="nexusai-history__item-meta">
                            {s.message_count} {s.message_count === 1 ? labels.messageSg : labels.messagesPl}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
