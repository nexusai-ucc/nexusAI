/**
 * FaqDashboardPanel — vista del docente con las preguntas más repetidas de
 * sus alumnos, agrupadas por tema (DOC-D02).
 *
 * No hay clustering semántico en el schema: el backend agrupa primero por
 * texto normalizado y le pide a un LLM que sintetice esos grupos en temas.
 * Datos vienen de la external function `local_nexusai_analytics_faq_topics`.
 */

import { useEffect, useState } from "react";
import { getFaqTopics } from "./api.js";
import { downloadCsvFile } from "./csv.js";
import { IconHelpCircle, IconDownload } from "../components/icons.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";
import Skeleton, { SkeletonScreen } from "../components/Skeleton.jsx";

// UX-12 (#370): silueta de carga — grilla de cards de tema, cada una con
// título + un par de líneas de preguntas de ejemplo.
function FaqSkeleton({ lang = "es" }) {
    return (
        <SkeletonScreen label={lang === "es" ? "Cargando preguntas frecuentes..." : "Loading frequently asked questions..."}>
            <div className="nexusai-skeleton-faq__grid">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="nexusai-skeleton-faq__card">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Skeleton width={14} height={14} radius="50%" />
                            <Skeleton width="55%" height={13} />
                            <Skeleton width={28} height={13} style={{ marginLeft: "auto" }} />
                        </div>
                        <Skeleton width="90%" height={10} />
                        <Skeleton width="70%" height={10} />
                    </div>
                ))}
            </div>
        </SkeletonScreen>
    );
}

export default function FaqDashboardPanel({ courseId, lang = "es" }) {
    const [topics, setTopics] = useState([]);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);

    const L = lang === "es" ? {
        intro:        "Preguntas más repetidas de tus alumnos, agrupadas por tema. Útil para detectar qué conceptos generan más dudas y priorizar el repaso en clase.",
        filterAria:   "Filtrar preguntas frecuentes por período",
        show:         "Mostrar:",
        last7:        "Últimos 7 días",
        last30:       "Último mes",
        last90:       "Últimos 3 meses",
        last365:      "Último año",
        loadError:    "No se pudieron cargar las preguntas frecuentes.",
        emptyTitle:   "No hay suficientes preguntas registradas en este período.",
        emptySub:     "A medida que tus alumnos usen el chat, vas a ver acá los temas que más consultan.",
        topicsHeading:(n) => `Temas más consultados (${n} preguntas)`,
        exportCsv:    "Exportar CSV",
        csvTopic:     "Tema",
        csvCount:     "Cantidad de preguntas",
    } : {
        intro:        "The most repeated questions from your students, grouped by topic. Useful to spot which concepts cause the most confusion and prioritize what to review in class.",
        filterAria:   "Filter frequently asked questions by period",
        show:         "Show:",
        last7:        "Last 7 days",
        last30:       "Last month",
        last90:       "Last 3 months",
        last365:      "Last year",
        loadError:    "Couldn't load the frequently asked questions.",
        emptyTitle:   "Not enough questions recorded for this period yet.",
        emptySub:     "As your students use the chat, you'll see the topics they ask about most here.",
        topicsHeading:(n) => `Most consulted topics (${n} questions)`,
        exportCsv:    "Export CSV",
        csvTopic:     "Topic",
        csvCount:     "Number of questions",
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getFaqTopics(courseId, days)
            .then((data) => {
                if (!cancelled) {
                    setTopics(data?.topics || []);
                    setTotalQuestions(data?.total_questions || 0);
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
    }, [courseId, days]);

    const handleExportCsv = () => {
        const rows = topics.map((t) => [t.topic, t.count]);
        downloadCsvFile(
            [L.csvTopic, L.csvCount],
            rows,
            `faq-nexusai-curso-${courseId}.csv`
        );
    };

    return (
        <div className="nexusai-faq">
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
            </div>

            {loading && <FaqSkeleton lang={lang} />}

            {error && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                </div>
            )}

            {!loading && !error && topics.length === 0 && (
                <div className="nexusai-gaps__empty">
                    <div className="nexusai-gaps__empty-icon">
                        <IconHelpCircle size={20} />
                    </div>
                    <p className="nexusai-gaps__empty-title">{L.emptyTitle}</p>
                    <p className="nexusai-gaps__empty-sub">
                        {L.emptySub}
                    </p>
                </div>
            )}

            {!loading && !error && topics.length > 0 && (
                <div className="nexusai-faq__list">
                    <div className="nexusai-gaps__list-header">
                        <h3 className="nexusai-documents__heading">
                            {L.topicsHeading(totalQuestions)}
                        </h3>
                        <button type="button" className="nexusai-btn" onClick={handleExportCsv}>
                            <IconDownload size={13} />
                            {L.exportCsv}
                        </button>
                    </div>
                    <div className="nexusai-faq__grid">
                        {topics.map((t, i) => (
                            <div key={i} className="nexusai-faq-card">
                                <div className="nexusai-faq-card__row">
                                    <IconHelpCircle size={14} />
                                    <span className="nexusai-faq-card__label">{t.topic}</span>
                                    <span className="nexusai-faq-card__count">×{t.count}</span>
                                </div>
                                {t.example_questions?.length > 0 && (
                                    <ul className="nexusai-faq-card__examples">
                                        {t.example_questions.map((q, j) => (
                                            <li key={j}>"{q}"</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
