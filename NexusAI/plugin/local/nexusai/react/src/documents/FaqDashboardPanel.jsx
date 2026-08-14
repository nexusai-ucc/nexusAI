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
import { IconHelpCircle } from "../components/icons.jsx";

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
                    setError(err.message || "Error cargando preguntas frecuentes");
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, [courseId, days]);

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

            {loading && <div className="nexusai-loading">Cargando preguntas frecuentes...</div>}

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
                    <h3 className="nexusai-documents__heading">
                        Temas más consultados ({totalQuestions} preguntas)
                    </h3>
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
