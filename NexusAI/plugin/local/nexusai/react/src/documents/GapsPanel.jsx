/**
 * GapsPanel — vista del docente con preguntas que el material no respondió.
 *
 * Feedback loop pedagógico: muestra los temas que los alumnos consultan pero
 * que el material indexado no cubre bien. Datos vienen del backend Python
 * a través de la external function `local_nexusai_gaps_list`.
 */

import { useEffect, useState } from "react";
import { listGaps, archiveGap } from "./api.js";
import { downloadCsvFile } from "./csv.js";
import { IconCheck, IconArchive, IconDownload } from "../components/icons.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";

function relativeTime(iso, lang = "es") {
    if (!iso) return "";
    try {
        const date = new Date(iso);
        const diffMs = Date.now() - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr  = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (lang === "es") {
            if (sec < 60)  return "hace un instante";
            if (min < 60)  return `hace ${min} min`;
            if (hr < 24)   return `hace ${hr}h`;
            if (day < 7)   return `hace ${day} día${day === 1 ? "" : "s"}`;
            return date.toLocaleDateString("es-AR");
        }
        if (sec < 60)  return "just now";
        if (min < 60)  return `${min} min ago`;
        if (hr < 24)   return `${hr}h ago`;
        if (day < 7)   return `${day} day${day === 1 ? "" : "s"} ago`;
        return date.toLocaleDateString("en-US");
    } catch {
        return "";
    }
}

function similarityLabel(sim, lang = "es") {
    if (lang === "es") {
        if (sim === null || sim === undefined) return { text: "sin match", level: "high" };
        if (sim < 0.25) return { text: "match nulo",  level: "high" };
        if (sim < 0.4)  return { text: "match débil", level: "mid" };
        return { text: "match parcial", level: "low" };
    }
    if (sim === null || sim === undefined) return { text: "no match", level: "high" };
    if (sim < 0.25) return { text: "no match",     level: "high" };
    if (sim < 0.4)  return { text: "weak match",   level: "mid" };
    return { text: "partial match", level: "low" };
}

// UX-15 (#385): cantidad de gaps que se piden por página, tanto en la
// carga inicial como en cada "Cargar más".
const PAGE_SIZE = 30;

export default function GapsPanel({ courseId, lang = "es" }) {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);
    const [showArchived, setShowArchived] = useState(false);
    const [archivingIdx, setArchivingIdx] = useState(null);

    const L = lang === "es" ? {
        intro:        "Preguntas que los alumnos hicieron y que el material indexado no pudo responder bien. Útil para descubrir qué temas pedir o agregar a tus archivos del curso.",
        filterAria:   "Filtrar vacíos de contenido por período",
        show:         "Mostrar:",
        last7:        "Últimos 7 días",
        last30:       "Último mes",
        last90:       "Últimos 3 meses",
        last365:      "Último año",
        viewArchived: "Ver archivadas",
        loading:      "Cargando gaps...",
        loadError:    "No se pudieron cargar los vacíos de contenido.",
        loadMoreError:"No se pudieron cargar más vacíos de contenido.",
        archiveError: "No se pudo archivar el vacío de contenido.",
        emptyTitle:   "No hay gaps registrados en este período.",
        emptySub:     "El material respondió bien todas las consultas que llegaron al asistente.",
        heading:      (n) => `Preguntas sin respuesta (${n})`,
        exportCsv:    "Exportar CSV",
        archivedBadge:"Archivada",
        avgSim:       (pct) => `similaridad promedio ${pct}%`,
        archive:      "Archivar",
        unarchive:    "Desarchivar",
        archiveAria:  (archived, q) => `${archived ? "Desarchivar" : "Archivar"} la pregunta: ${q}`,
        loadMore:     (a, b) => `Cargar más (${a} de ${b})`,
        csvQuestion:  "Pregunta",
        csvSimilarity:"Similitud",
        csvLastAsked: "Última consulta",
        noMatch:      "sin match",
    } : {
        intro:        "Questions your students asked that the indexed material couldn't answer well. Useful to discover which topics to request or add to your course files.",
        filterAria:   "Filter content gaps by period",
        show:         "Show:",
        last7:        "Last 7 days",
        last30:       "Last month",
        last90:       "Last 3 months",
        last365:      "Last year",
        viewArchived: "Show archived",
        loading:      "Loading gaps...",
        loadError:    "Couldn't load the content gaps.",
        loadMoreError:"Couldn't load more content gaps.",
        archiveError: "Couldn't archive the content gap.",
        emptyTitle:   "No gaps recorded for this period.",
        emptySub:     "The material answered all the questions that reached the assistant well.",
        heading:      (n) => `Unanswered questions (${n})`,
        exportCsv:    "Export CSV",
        archivedBadge:"Archived",
        avgSim:       (pct) => `average similarity ${pct}%`,
        archive:      "Archive",
        unarchive:    "Unarchive",
        archiveAria:  (archived, q) => `${archived ? "Unarchive" : "Archive"} the question: ${q}`,
        loadMore:     (a, b) => `Load more (${a} of ${b})`,
        csvQuestion:  "Question",
        csvSimilarity:"Similarity",
        csvLastAsked: "Last asked",
        noMatch:      "no match",
    };

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
                    setError(getFriendlyErrorMessage(err, L.loadError, lang));
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
            setError(getFriendlyErrorMessage(err, L.loadMoreError, lang));
        } finally {
            setLoadingMore(false);
        }
    };

    const handleExportCsv = () => {
        const rows = items.map((g) => [
            g.question,
            g.avg_similarity === null || g.avg_similarity === undefined
                ? L.noMatch
                : `${Math.round(g.avg_similarity * 100)}%`,
            g.last_asked_at ? new Date(g.last_asked_at).toLocaleString(lang === "es" ? "es-AR" : "en-US") : "",
        ]);
        downloadCsvFile(
            [L.csvQuestion, L.csvSimilarity, L.csvLastAsked],
            rows,
            `gaps-nexusai-curso-${courseId}.csv`
        );
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
            setError(getFriendlyErrorMessage(err, L.archiveError, lang));
        } finally {
            setArchivingIdx(null);
        }
    };

    return (
        <div className="nexusai-gaps">
            <p className="nexusai-documents__intro">
                {L.intro}
            </p>

            <div className="nexusai-gaps__filter" role="group" aria-label={L.filterAria}>
                <span className="nexusai-gaps__filter-label">{L.show}</span>
                {[7, 30, 90, 365].map((d) => (
                    <button
                        key={d}
                        type="button"
                        className={`nexusai-gaps__filter-btn ${days === d ? "nexusai-gaps__filter-btn--active" : ""}`}
                        onClick={() => setDays(d)}
                        aria-pressed={days === d}
                    >
                        {d === 7 && L.last7}
                        {d === 30 && L.last30}
                        {d === 90 && L.last90}
                        {d === 365 && L.last365}
                    </button>
                ))}
                <label className="nexusai-gaps__archived-toggle">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                    />
                    {L.viewArchived}
                </label>
            </div>

            {loading && <div className="nexusai-loading" role="status">{L.loading}</div>}

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
                    <p className="nexusai-gaps__empty-title">{L.emptyTitle}</p>
                    <p className="nexusai-gaps__empty-sub">
                        {L.emptySub}
                    </p>
                </div>
            )}

            {!loading && !error && items.length > 0 && (
                <div className="nexusai-gaps__list">
                    <div className="nexusai-gaps__list-header">
                        <h3 className="nexusai-documents__heading">
                            {L.heading(total)}
                        </h3>
                        <button type="button" className="nexusai-btn" onClick={handleExportCsv}>
                            <IconDownload size={13} />
                            {L.exportCsv}
                        </button>
                    </div>
                    {items.map((g, i) => {
                        const sim = similarityLabel(g.avg_similarity, lang);
                        return (
                            <div
                                key={i}
                                className={`nexusai-gap-item ${g.is_archived ? "nexusai-gap-item--archived" : ""}`}
                            >
                                <div className="nexusai-gap-item__row">
                                    <span className="nexusai-gap-item__question">
                                        “{g.question}”
                                        {g.is_archived && (
                                            <span className="nexusai-gap-item__archived-badge">{L.archivedBadge}</span>
                                        )}
                                    </span>
                                    <span className="nexusai-gap-item__count">
                                        ×{g.count}
                                    </span>
                                </div>
                                <div className="nexusai-gap-item__meta">
                                    <span className={`nexusai-gap-item__similarity nexusai-gap-item__similarity--${sim.level}`}>
                                        {sim.text}
                                    </span>
                                    <span className="nexusai-gap-item__sep">·</span>
                                    <span>{relativeTime(g.last_asked_at, lang)}</span>
                                    {g.avg_similarity !== null && g.avg_similarity !== undefined && (
                                        <>
                                            <span className="nexusai-gap-item__sep">·</span>
                                            <span>{L.avgSim(Math.round(g.avg_similarity * 100))}</span>
                                        </>
                                    )}
                                    <span className="nexusai-gap-item__sep">·</span>
                                    <button
                                        type="button"
                                        className="nexusai-gap-item__archive-btn"
                                        onClick={() => handleToggleArchive(g, i)}
                                        disabled={archivingIdx === i}
                                        aria-label={L.archiveAria(g.is_archived, g.question)}
                                    >
                                        <IconArchive size={12} />
                                        {archivingIdx === i
                                            ? "..."
                                            : g.is_archived ? L.unarchive : L.archive}
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
                            {loadingMore ? (lang === "es" ? "Cargando..." : "Loading...") : L.loadMore(items.length, total)}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
