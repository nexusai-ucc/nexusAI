/**
 * AnalyticsDashboardPanel — vista del docente con métricas agregadas del
 * curso (ANALYTICS-01/02): preguntas más frecuentes, uso diario, distribución
 * de puntajes de quiz y ratio de vacíos de contenido.
 *
 * Datos vienen de la external function `local_nexusai_analytics_dashboard`,
 * que a su vez llama a GET /api/v1/admin/analytics del backend. No hay
 * clustering ni síntesis por LLM acá (a diferencia de FaqDashboardPanel) —
 * son agregaciones directas ya calculadas por el backend.
 *
 * Las "barras" son CSS puro (alto/ancho en %), mismo criterio liviano que el
 * resto del plugin — no se agrega ninguna librería de gráficos.
 */

import { useEffect, useState } from "react";
import { getAnalyticsDashboard } from "./api.js";
import { IconBarChart } from "../components/icons.jsx";

export default function AnalyticsDashboardPanel({ courseId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [days, setDays] = useState(30);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getAnalyticsDashboard(courseId, days)
            .then((response) => {
                if (!cancelled) {
                    setData(response);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando el dashboard de analytics");
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [courseId, days]);

    const topQueries = data?.top_queries || [];
    const dailyCounts = data?.daily_message_counts || [];
    const quizDist = data?.quiz_score_distribution || { total_attempts: 0, average_score: 0, buckets: [] };
    const gapsRatio = data?.gaps_ratio || { gaps_detected: 0, questions_answered: 0, ratio: 0 };

    const maxDaily = Math.max(1, ...dailyCounts.map((d) => d.message_count));
    const maxBucket = Math.max(1, ...quizDist.buckets.map((b) => b.count));
    const totalGapsBase = gapsRatio.gaps_detected + gapsRatio.questions_answered;
    const ratioPct = Math.round((gapsRatio.ratio || 0) * 100);
    const ratioLevel = ratioPct >= 30 ? "high" : ratioPct >= 15 ? "mid" : "low";

    const isEmpty = !loading && !error &&
        topQueries.length === 0 &&
        dailyCounts.every((d) => d.message_count === 0) &&
        quizDist.total_attempts === 0 &&
        totalGapsBase === 0;

    return (
        <div className="nexusai-analytics">
            <p className="nexusai-documents__intro">
                Visión agregada de la actividad del curso: qué preguntan tus alumnos, cuánto
                usan el asistente, cómo les va en los quizzes de práctica, y cuántas preguntas
                el material no pudo responder bien.
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

            {loading && <div className="nexusai-loading">Cargando analytics...</div>}

            {error && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                </div>
            )}

            {isEmpty && (
                <div className="nexusai-gaps__empty">
                    <div className="nexusai-gaps__empty-icon">
                        <IconBarChart size={20} />
                    </div>
                    <p className="nexusai-gaps__empty-title">Todavía no hay actividad suficiente en este período.</p>
                    <p className="nexusai-gaps__empty-sub">
                        A medida que tus alumnos usen el asistente y hagan quizzes, vas a ver acá
                        las métricas del curso.
                    </p>
                </div>
            )}

            {!loading && !error && !isEmpty && (
                <div className="nexusai-analytics__grid">
                    {/* Top queries */}
                    <section className="nexusai-analytics__section">
                        <h3 className="nexusai-documents__heading">Preguntas más frecuentes</h3>
                        {topQueries.length === 0 ? (
                            <p className="nexusai-analytics__section-empty">Sin preguntas registradas en este período.</p>
                        ) : (
                            <ul className="nexusai-analytics__query-list">
                                {topQueries.map((q, i) => (
                                    <li key={i} className="nexusai-faq-topic">
                                        <div className="nexusai-faq-topic__row">
                                            <span className="nexusai-faq-topic__label">{q.question}</span>
                                            <span className="nexusai-faq-topic__count">×{q.count}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Uso diario */}
                    <section className="nexusai-analytics__section">
                        <h3 className="nexusai-documents__heading">Uso diario</h3>
                        {dailyCounts.length === 0 ? (
                            <p className="nexusai-analytics__section-empty">Sin actividad registrada en este período.</p>
                        ) : (
                            <div className="nexusai-analytics__bars nexusai-analytics__bars--daily">
                                {dailyCounts.map((d) => (
                                    <div key={d.date} className="nexusai-analytics__bar-col" title={`${d.date}: ${d.message_count}`}>
                                        <div
                                            className="nexusai-analytics__bar"
                                            style={{ height: `${Math.round((d.message_count / maxDaily) * 100)}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Distribución de puntajes de quiz */}
                    <section className="nexusai-analytics__section">
                        <h3 className="nexusai-documents__heading">Distribución de puntajes de quiz</h3>
                        {quizDist.total_attempts === 0 ? (
                            <p className="nexusai-analytics__section-empty">Todavía no hay intentos de quiz registrados.</p>
                        ) : (
                            <>
                                <div className="nexusai-analytics__score-summary">
                                    <span className="nexusai-analytics__score-avg">{quizDist.average_score.toFixed(1)}</span>
                                    <span className="nexusai-analytics__score-sub">
                                        promedio sobre {quizDist.total_attempts} intento{quizDist.total_attempts === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="nexusai-analytics__bars nexusai-analytics__bars--buckets">
                                    {quizDist.buckets.map((b) => (
                                        <div key={b.range} className="nexusai-analytics__bucket-col">
                                            <div
                                                className="nexusai-analytics__bar nexusai-analytics__bar--bucket"
                                                style={{ height: `${Math.round((b.count / maxBucket) * 100)}%` }}
                                                title={`${b.range}: ${b.count}`}
                                            />
                                            <span className="nexusai-analytics__bucket-label">{b.range}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>

                    {/* Ratio de gaps */}
                    <section className="nexusai-analytics__section">
                        <h3 className="nexusai-documents__heading">Vacíos de contenido</h3>
                        {totalGapsBase === 0 ? (
                            <p className="nexusai-analytics__section-empty">Sin datos suficientes en este período.</p>
                        ) : (
                            <div className={`nexusai-analytics__gaps-ratio nexusai-analytics__gaps-ratio--${ratioLevel}`}>
                                <span className="nexusai-analytics__gaps-ratio-pct">{ratioPct}%</span>
                                <span className="nexusai-analytics__gaps-ratio-sub">
                                    {gapsRatio.gaps_detected} de {totalGapsBase} preguntas sin responder bien
                                </span>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
