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
 * resto del plugin — no se agrega ninguna librería de gráficos, solo un
 * componente propio (`BarChart`, ANALYTICS-04 #371) con tooltip real al
 * hover/foco y scroll horizontal para que no se aplasten con muchos puntos
 * de datos (365 días).
 *
 * ANALYTICS-03 (#316): "Exportar a PDF" reusa el mismo criterio sin
 * dependencias que SP-17 (`printQuizAsPdf` en QuizPanel.jsx) — abre una
 * ventana en blanco con HTML/CSS autocontenido y dispara window.print(),
 * en vez de agregar una librería de generación de PDF. El HTML impreso
 * arma sus propias barras estáticas (no reusa <BarChart>, cuyo tooltip
 * depende de estado de hover/foco — no tiene sentido en un documento).
 */

import { useEffect, useState } from "react";
import { getAnalyticsDashboard } from "./api.js";
import { IconBarChart, IconClipboardList, IconDownload, IconHelpCircle, IconTarget, IconThumbsUp } from "../components/icons.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";
import Skeleton, { SkeletonScreen } from "../components/Skeleton.jsx";
import BarChart from "./BarChart.jsx";

const DAYS_LABELS = {
    7: "Últimos 7 días",
    30: "Último mes",
    90: "Últimos 3 meses",
    365: "Último año",
};

export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function staticBarsHtml(items, maxValue) {
    return items
        .map((item) => {
            const pct = Math.max(0, Math.min(100, Math.round((item.value / maxValue) * 100)));
            return `<div class="bar-col"><div class="bar" style="height:${pct}%"></div><span class="bar-val">${item.value}</span><span class="bar-label">${escapeHtml(item.label)}</span></div>`;
        })
        .join("");
}

export function printAnalyticsAsPdf(report) {
    const win = window.open("", "_blank");
    if (!win) return; // popup bloqueado por el navegador

    const { courseName, days, topQueries, dailyCounts, maxDaily, quizDist, maxBucket, ratioPct, gapsRatio, feedbackRatio } = report;
    const daysLabel = DAYS_LABELS[days] || `${days} días`;

    const dailyItems = dailyCounts.map((d) => ({ value: d.message_count, label: d.date }));
    const bucketItems = quizDist.buckets.map((b) => ({ value: b.count, label: b.range }));

    const topQueriesHtml = topQueries.length
        ? `<ul>${topQueries.map((q) => `<li>${escapeHtml(q.question)} <strong>×${q.count}</strong></li>`).join("")}</ul>`
        : `<p class="empty">Sin preguntas registradas en este período.</p>`;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(courseName || "Reporte de Analytics")}</title>
<style>
    body { font-family: -apple-system, Arial, sans-serif; color: #1e293b; padding: 24px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin-bottom: 2px; }
    h2 { font-size: 13px; margin: 24px 0 8px; }
    .sub { font-size: 12px; color: #64748b; margin: 0 0 20px; }
    .section { page-break-inside: avoid; margin-bottom: 16px; }
    .empty { font-size: 12px; color: #64748b; }
    ul { margin: 0; padding-left: 20px; font-size: 13px; }
    li { margin-bottom: 4px; }
    .bars { display: flex; align-items: flex-end; gap: 4px; height: 90px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; font-size: 9px; }
    .bar { width: 100%; min-height: 2px; background: #6366f1; }
    .bar-val { margin-top: 2px; }
    .bar-label { color: #64748b; white-space: nowrap; }
    .stat { font-size: 13px; margin: 4px 0; }
    @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>${escapeHtml(courseName || "Reporte de Analytics")}</h1>
<p class="sub">Período: ${escapeHtml(daysLabel)}</p>

<div class="section">
    <h2>Preguntas más frecuentes</h2>
    ${topQueriesHtml}
</div>

<div class="section">
    <h2>Uso diario</h2>
    ${dailyItems.length ? `<div class="bars">${staticBarsHtml(dailyItems, maxDaily)}</div>` : `<p class="empty">Sin actividad registrada en este período.</p>`}
</div>

<div class="section">
    <h2>Distribución de puntajes de quiz</h2>
    ${quizDist.total_attempts > 0
        ? `<p class="stat">Promedio: ${quizDist.average_score.toFixed(1)} sobre ${quizDist.total_attempts} intento${quizDist.total_attempts === 1 ? "" : "s"}</p><div class="bars">${staticBarsHtml(bucketItems, maxBucket)}</div>`
        : `<p class="empty">Todavía no hay intentos de quiz registrados.</p>`}
</div>

<div class="section">
    <h2>Vacíos de contenido</h2>
    <p class="stat">${gapsRatio.gaps_detected + gapsRatio.questions_answered > 0 ? `${ratioPct}% — ${gapsRatio.gaps_detected} de ${gapsRatio.gaps_detected + gapsRatio.questions_answered} preguntas sin responder bien` : "Sin datos suficientes en este período."}</p>
</div>

<div class="section">
    <h2>Respuestas útiles</h2>
    <p class="stat">${feedbackRatio.total_rated > 0 ? `${feedbackRatio.useful_pct}% (${feedbackRatio.total_rated} votos)` : "Sin votos registrados."}</p>
</div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
}

// UX-12 (#370): silueta de carga — fila de cards de métricas + dos
// secciones con barras, aproximando el layout real de abajo.
function AnalyticsSkeleton() {
    return (
        <SkeletonScreen label="Cargando analytics...">
            <div className="nexusai-skeleton-analytics__stats">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="nexusai-skeleton-analytics__stat">
                        <Skeleton width={16} height={16} radius="50%" />
                        <Skeleton width="40%" height={22} />
                        <Skeleton width="80%" height={10} />
                    </div>
                ))}
            </div>
            <div className="nexusai-skeleton-analytics__grid">
                {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="nexusai-skeleton-analytics__section">
                        <Skeleton width="50%" height={14} />
                        <div className="nexusai-skeleton-analytics__bars">
                            {Array.from({ length: 7 }, (_, j) => (
                                <Skeleton key={j} height={`${30 + ((j * 37) % 60)}%`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </SkeletonScreen>
    );
}

export default function AnalyticsDashboardPanel({ courseId, courseName }) {
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
                    setError(getFriendlyErrorMessage(err, "No se pudo cargar el dashboard de analytics."));
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [courseId, days]);

    const topQueries = data?.top_queries || [];
    const dailyCounts = data?.daily_message_counts || [];
    const quizDist = data?.quiz_score_distribution || { total_attempts: 0, average_score: 0, buckets: [] };
    const gapsRatio = data?.gaps_ratio || { gaps_detected: 0, questions_answered: 0, ratio: 0 };
    // ASIST-01 (#321): % de respuestas del chat marcadas como útiles por los
    // alumnos — señal complementaria al ratio de gaps (cubre respuestas que sí
    // encontraron material relevante pero fueron malas igual).
    const feedbackRatio = data?.feedback_ratio || { helpful_count: 0, total_rated: 0, useful_pct: 0 };
    const topicsConsulted = data?.topics_consulted || 0;

    const maxDaily = Math.max(1, ...dailyCounts.map((d) => d.message_count));
    const maxBucket = Math.max(1, ...quizDist.buckets.map((b) => b.count));
    const totalGapsBase = gapsRatio.gaps_detected + gapsRatio.questions_answered;
    const ratioPct = Math.round((gapsRatio.ratio || 0) * 100);
    const ratioLevel = ratioPct >= 30 ? "high" : ratioPct >= 15 ? "mid" : "low";
    const healthPct = 100 - ratioPct;

    const isEmpty = !loading && !error &&
        topQueries.length === 0 &&
        dailyCounts.every((d) => d.message_count === 0) &&
        quizDist.total_attempts === 0 &&
        totalGapsBase === 0 &&
        feedbackRatio.total_rated === 0;

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
                {!loading && !error && !isEmpty && (
                    <button
                        type="button"
                        className="nexusai-btn"
                        onClick={() => printAnalyticsAsPdf({
                            courseName, days, topQueries, dailyCounts, maxDaily,
                            quizDist, maxBucket, ratioPct, gapsRatio, feedbackRatio,
                        })}
                    >
                        <IconDownload size={13} /> Exportar a PDF
                    </button>
                )}
            </div>

            {loading && <AnalyticsSkeleton />}

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
                <>
                    <div className="nexusai-analytics__stats">
                        <div className="nexusai-analytics__stat-card">
                            <IconClipboardList size={16} />
                            <span className="nexusai-analytics__stat-value">{quizDist.total_attempts}</span>
                            <span className="nexusai-analytics__stat-label">Quizzes de práctica</span>
                        </div>
                        <div className="nexusai-analytics__stat-card">
                            <IconTarget size={16} />
                            <span className="nexusai-analytics__stat-value">{gapsRatio.gaps_detected}</span>
                            <span className="nexusai-analytics__stat-label">Vacíos de contenido</span>
                        </div>
                        <div className="nexusai-analytics__stat-card">
                            <IconHelpCircle size={16} />
                            <span className="nexusai-analytics__stat-value">{gapsRatio.questions_answered}</span>
                            <span className="nexusai-analytics__stat-label">Preguntas al asistente</span>
                        </div>
                        <div className="nexusai-analytics__stat-card">
                            <IconBarChart size={16} />
                            <span className="nexusai-analytics__stat-value">{topicsConsulted}</span>
                            <span className="nexusai-analytics__stat-label">Temas consultados</span>
                        </div>
                        <div className="nexusai-analytics__stat-card">
                            <IconThumbsUp size={16} />
                            <span className="nexusai-analytics__stat-value">
                                {feedbackRatio.total_rated > 0 ? `${feedbackRatio.useful_pct}%` : "—"}
                            </span>
                            <span className="nexusai-analytics__stat-label">
                                Respuestas útiles{feedbackRatio.total_rated > 0 ? ` (${feedbackRatio.total_rated} votos)` : ""}
                            </span>
                        </div>
                    </div>

                    <div className={`nexusai-analytics__health nexusai-analytics__health--${ratioLevel}`}>
                        <div className="nexusai-analytics__health-head">
                            <span className="nexusai-analytics__health-title">Salud del contenido</span>
                            <span className="nexusai-analytics__health-pct">{healthPct}%</span>
                        </div>
                        <div className="nexusai-analytics__health-bar">
                            <div className="nexusai-analytics__health-fill" style={{ width: `${healthPct}%` }} />
                        </div>
                        <span className="nexusai-analytics__health-sub">
                            Basado en el ratio de vacíos de contenido detectados
                        </span>
                    </div>

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
                                <BarChart
                                    variant="daily"
                                    maxValue={maxDaily}
                                    items={dailyCounts.map((d) => ({ key: d.date, value: d.message_count, date: d.date }))}
                                    formatTooltip={(item) => `${item.date}: ${item.value}`}
                                />
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
                                    <BarChart
                                        variant="buckets"
                                        maxValue={maxBucket}
                                        items={quizDist.buckets.map((b) => ({ key: b.range, value: b.count, range: b.range }))}
                                        formatTooltip={(item) => `${item.range}: ${item.value}`}
                                        formatLabel={(item) => item.range}
                                    />
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
                </>
            )}
        </div>
    );
}
