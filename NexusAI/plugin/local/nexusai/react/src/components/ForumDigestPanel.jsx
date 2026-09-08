/**
 * ForumDigestPanel — resumen semanal del foro para el docente (FOR-06,
 * #367) + badge de urgencia por hilo (FOR-05, #366) — panel teacherOnly,
 * accesible desde NavMenu igual que ReviewPanel/OnboardingPanel.
 *
 * Un solo fetch combinado (`local_nexusai_forum_weekly_digest`): el mismo
 * backend que arma el resumen de la semana ya calcula, por hilo, si algún
 * post parece urgente/frustrado (heurística sin LLM) — ver docstring del
 * router Python para el porqué de combinarlos en un solo endpoint.
 */

import { useEffect, useState } from "react";
import { getWeeklyDigest } from "../api/forumDigest.js";
import { IconAlertTriangle, IconMessageSquare } from "./icons.jsx";
import { getFriendlyErrorMessage } from "./errors.js";

const DIGEST_DAYS = 7;

export default function ForumDigestPanel({ courseId, wwwroot, lang = "es" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const L = lang === "es" ? {
        title:      "Resumen semanal del foro",
        intro:      "Actividad de todos los foros del curso en los últimos 7 días, para no tener que revisar hilo por hilo.",
        empty:      "No hubo actividad nueva en el foro esta semana.",
        error:      "No se pudo cargar el resumen del foro.",
        urgent:     "Parece urgente",
        posts:      (n) => `${n} post${n === 1 ? "" : "s"} nuevo${n === 1 ? "" : "s"}`,
        openInMoodle: "Ver hilo",
    } : {
        title:      "Weekly forum digest",
        intro:      "Activity across all course forums in the last 7 days, so you don't have to review thread by thread.",
        empty:      "No new forum activity this week.",
        error:      "Could not load the forum digest.",
        urgent:     "Looks urgent",
        posts:      (n) => `${n} new post${n === 1 ? "" : "s"}`,
        openInMoodle: "View thread",
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getWeeklyDigest(courseId, DIGEST_DAYS)
            .then((response) => { if (!cancelled) setData(response); })
            .catch((err) => { if (!cancelled) setError(getFriendlyErrorMessage(err, L.error, lang)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const discussions = data?.discussions || [];

    return (
        <div className="nexusai-forumdigest">
            <p className="nexusai-forumdigest__intro">{L.intro}</p>

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

            {!loading && !error && discussions.length === 0 && (
                <p className="nexusai-forumdigest__empty">{L.empty}</p>
            )}

            {!loading && !error && discussions.length > 0 && (
                <>
                    {data.summary && (
                        <div className="nexusai-forumdigest__summary">
                            <p>{data.summary}</p>
                        </div>
                    )}

                    <div className="nexusai-forumdigest__list">
                        {discussions.map((d) => (
                            <div
                                key={d.discussion_id}
                                className={`nexusai-forumdigest__item ${d.urgent ? "nexusai-forumdigest__item--urgent" : ""}`}
                            >
                                <div className="nexusai-forumdigest__item-icon">
                                    <IconMessageSquare size={15} />
                                </div>
                                <div className="nexusai-forumdigest__item-body">
                                    <div className="nexusai-forumdigest__item-row">
                                        <span className="nexusai-forumdigest__item-name">{d.discussion_name}</span>
                                        {d.urgent && (
                                            <span className="nexusai-forumdigest__urgent-badge">
                                                <IconAlertTriangle size={11} /> {L.urgent}
                                            </span>
                                        )}
                                    </div>
                                    <span className="nexusai-forumdigest__item-meta">
                                        {d.forum_name} · {L.posts(d.post_count)}
                                    </span>
                                </div>
                                {wwwroot && (
                                    <a
                                        className="nexusai-forumdigest__item-link"
                                        href={`${wwwroot}/mod/forum/discuss.php?d=${d.discussion_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {L.openInMoodle}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
