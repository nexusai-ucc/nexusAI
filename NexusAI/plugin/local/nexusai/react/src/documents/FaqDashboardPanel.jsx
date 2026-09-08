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
function FaqSkeleton() {
    return (
        <SkeletonScreen label="Cargando preguntas frecuentes...">
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

export default function FaqDashboardPanel({ courseId }) {
    const [topics, setTopics] = useState([]);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);

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
                    setError(getFriendlyErrorMessage(err, "No se pudieron cargar las preguntas frecuentes."));
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [courseId, days]);

    const handleExportCsv = () => {
        const rows = topics.map((t) => [t.topic, t.count]);
        downloadCsvFile(
            ["Tema", "Cantidad de preguntas"],
            rows,
            `faq-nexusai-curso-${courseId}.csv`
        );
    };

    return (
        <div className="nexusai-faq">
            <p className="nexusai-documents__intro">
                Preguntas más repetidas de tus alumnos, agrupadas por tema. Útil para
                detectar qué conceptos generan más dudas y priorizar el repaso en clase.
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
            </div>

            {loading && <FaqSkeleton />}

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
                    <p className="nexusai-gaps__empty-title">No hay suficientes preguntas registradas en este período.</p>
                    <p className="nexusai-gaps__empty-sub">
                        A medida que tus alumnos usen el chat, vas a ver acá los temas que más consultan.
                    </p>
                </div>
            )}

            {!loading && !error && topics.length > 0 && (
                <div className="nexusai-faq__list">
                    <div className="nexusai-gaps__list-header">
                        <h3 className="nexusai-documents__heading">
                            Temas más consultados ({totalQuestions} preguntas)
                        </h3>
                        <button type="button" className="nexusai-btn" onClick={handleExportCsv}>
                            <IconDownload size={13} />
                            Exportar CSV
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
