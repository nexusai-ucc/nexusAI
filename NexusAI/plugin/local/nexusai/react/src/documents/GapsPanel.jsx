/**
 * GapsPanel — vista del docente con preguntas que el material no respondió.
 *
 * Feedback loop pedagógico: muestra los temas que los alumnos consultan pero
 * que el material indexado no cubre bien. Datos vienen del backend Python
 * a través de la external function `local_nexusai_gaps_list`.
 */

import { useEffect, useState } from "react";
import { listGaps, archiveGap } from "./api.js";
import { IconCheck, IconArchive } from "../components/icons.jsx";

function relativeTime(iso) {
    if (!iso) return "";
    try {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr  = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (sec < 60)  return "hace un instante";
        if (min < 60)  return `hace ${min} min`;
        if (hr < 24)   return `hace ${hr}h`;
        if (day < 7)   return `hace ${day} día${day === 1 ? "" : "s"}`;
        return date.toLocaleDateString("es-AR");
    } catch {
        return "";
    }
}

function similarityLabel(sim) {
    if (sim === null || sim === undefined) {
        return { text: "sin match", color: "#dc2626" };
    }
    if (sim < 0.25) return { text: "match nulo",  color: "#dc2626" };
    if (sim < 0.4)  return { text: "match débil", color: "#d97706" };
    return { text: "match parcial", color: "#65a30d" };
}

// UX-15 (#385): cantidad de gaps que se piden por página, tanto en la
// carga inicial como en cada "Cargar más".
const PAGE_SIZE = 30;

export default function GapsPanel({ courseId }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);
    const [showArchived, setShowArchived] = useState(false);
    const [archivingIdx, setArchivingIdx] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        listGaps(courseId, days, PAGE_SIZE, showArchived, 0)
            .then((data) => {
                if (!cancelled) {
                    setItems(data?.items || []);
                    setTotal(data?.total || 0);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando gaps");
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [courseId, days, showArchived]);

    const hasMore = items.length < total;

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await listGaps(courseId, days, PAGE_SIZE, showArchived, items.length);
            setItems((prev) => [...prev, ...(data?.items || [])]);
            setTotal(data?.total ?? total);
        } catch (err) {
            setError(err.message || "Error cargando más gaps");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleToggleArchive = async (item, idx) => {
        const nextArchived = !item.is_archived;
        setArchivingIdx(idx);
        try {
            await archiveGap(courseId, item.question_ids, nextArchived);
            if (!showArchived) {
                // Vista default: un gap recién archivado deja de matchear el
                // filtro (archived_at IS NULL), así que sale de la lista.
                setItems((prev) => prev.filter((_, i) => i !== idx));
                setTotal((prev) => Math.max(0, prev - 1));
            } else {
                setItems((prev) =>
                    prev.map((g, i) => (i === idx ? { ...g, is_archived: nextArchived } : g))
                );
            }
        } catch (err) {
            setError(err.message || "No se pudo archivar el gap");
        } finally {
            setArchivingIdx(null);
        }
    };

    return (
        <div className="nexusai-gaps">
            <p className="nexusai-documents__intro">
                Preguntas que los alumnos hicieron y que el material indexado no pudo responder bien.
                Útil para descubrir qué temas pedir o agregar a tus archivos del curso.
            </p>

            <div className="nexusai-gaps__filter">
                <span className="nexusai-gaps__filter-label">Mostrar:</span>
                {[7, 30, 90, 365].map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={`nexusai-gaps__filter-btn ${days === d ? "nexusai-gaps__filter-btn--active" : ""}`}
                        onClick={() => setDays(d)}
                    >
                        {d === 7 && "Últimos 7 días"}
                        {d === 30 && "Último mes"}
                        {d === 90 && "Últimos 3 meses"}
                        {d === 365 && "Último año"}
                    </button>
                ))}
                <label className="nexusai-gaps__archived-toggle">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                    />
                    Ver archivadas
                </label>
            </div>

            {loading && <div className="nexusai-loading">Cargando gaps...</div>}

            {error && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && items.length === 0 && (
                <div className="nexusai-gaps__empty">
                    <div className="nexusai-gaps__empty-icon">
                        <IconCheck size={20} />
                    </div>
                    <p className="nexusai-gaps__empty-title">No hay gaps registrados en este período.</p>
                    <p className="nexusai-gaps__empty-sub">
                        El material respondió bien todas las consultas que llegaron al asistente.
                    </p>
                </div>
            )}

            {!loading && !error && items.length > 0 && (
                <div className="nexusai-gaps__list">
                    <h3 className="nexusai-documents__heading">
                        Preguntas sin respuesta ({total})
                    </h3>
                    {items.map((g, i) => {
                        const sim = similarityLabel(g.avg_similarity);
                        return (
                            <div
                                key={i}
                                className={`nexusai-gap-item ${g.is_archived ? "nexusai-gap-item--archived" : ""}`}
                            >
                                <div className="nexusai-gap-item__row">
                                    <span className="nexusai-gap-item__question">
                                        “{g.question}”
                                        {g.is_archived && (
                                            <span className="nexusai-gap-item__archived-badge">Archivada</span>
                                        )}
                                    </span>
                                    <span className="nexusai-gap-item__count">
                                        ×{g.count}
                                    </span>
                                </div>
                                <div className="nexusai-gap-item__meta">
                                    <span style={{ color: sim.color, fontWeight: 600 }}>
                                        {sim.text}
                                    </span>
                                    <span className="nexusai-gap-item__sep">·</span>
                                    <span>{relativeTime(g.last_asked_at)}</span>
                                    {g.avg_similarity !== null && g.avg_similarity !== undefined && (
                                        <>
                                            <span className="nexusai-gap-item__sep">·</span>
                                            <span>similaridad promedio {Math.round(g.avg_similarity * 100)}%</span>
                                        </>
                                    )}
                                    <span className="nexusai-gap-item__sep">·</span>
                                    <button
                                        type="button"
                                        className="nexusai-gap-item__archive-btn"
                                        onClick={() => handleToggleArchive(g, i)}
                                        disabled={archivingIdx === i}
                                    >
                                        <IconArchive size={12} />
                                        {archivingIdx === i
                                            ? "..."
                                            : g.is_archived ? "Desarchivar" : "Archivar"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <button
                            type="button"
                            className="nexusai-gaps__load-more"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                        >
                            {loadingMore ? "Cargando..." : `Cargar más (${items.length} de ${total})`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
