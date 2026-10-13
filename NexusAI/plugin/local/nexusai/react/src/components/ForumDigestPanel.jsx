/**
 * ForumDigestPanel — weekly forum digest for the teacher (FOR-06,
 * #367) + urgency badge per thread (FOR-05, #366) — teacherOnly panel,
 * reachable from NavMenu like ReviewPanel/OnboardingPanel.
 *
 * A single combined fetch (`local_nexusai_forum_weekly_digest`): the same
 * backend call that builds the week's digest already works out, per thread,
 * whether a post looks urgent/frustrated (heuristic, no LLM) — see the
 * Python router's docstring for why they are combined in one endpoint.
 *
 * FOR-07 (#378): field to set a webhook URL
 * (Slack/Discord/Teams) — when one is stored, the backend also forwards the
 * digest there besides showing it here (silent if the webhook fails, it does
 * not affect this panel).
 */

import { useEffect, useState } from "react";
import { getWeeklyDigest, getForumWebhook, saveForumWebhook } from "../api/forumDigest.js";
import { IconAlertTriangle, IconMessageSquare } from "./icons.jsx";
import { getFriendlyErrorMessage } from "./errors.js";

const DIGEST_DAYS = 7;

export default function ForumDigestPanel({ courseId, wwwroot, lang = "es" }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookSavedUrl, setWebhookSavedUrl] = useState("");
    const [savingWebhook, setSavingWebhook] = useState(false);
    const [webhookSaved, setWebhookSaved] = useState(false);
    const [webhookError, setWebhookError] = useState(null);

    const L = lang === "es" ? {
        title:      "Resumen semanal del foro",
        intro:      "Actividad de todos los foros del curso en los últimos 7 días, para no tener que revisar hilo por hilo.",
        empty:      "No hubo actividad nueva en el foro esta semana.",
        error:      "No se pudo cargar el resumen del foro.",
        urgent:     "Parece urgente",
        posts:      (n) => `${n} post${n === 1 ? "" : "s"} nuevo${n === 1 ? "" : "s"}`,
        openInMoodle: "Ver hilo",
        webhookLabel: "Notificar también a un webhook (Slack, Discord, Teams)",
        webhookPlaceholder: "https://hooks.slack.com/services/...",
        webhookSave: "Guardar",
        webhookSaving: "Guardando…",
        webhookSaved: "Guardado",
        webhookError: "No se pudo guardar la URL del webhook.",
    } : {
        title:      "Weekly forum digest",
        intro:      "Activity across all course forums in the last 7 days, so you don't have to review thread by thread.",
        empty:      "No new forum activity this week.",
        error:      "Could not load the forum digest.",
        urgent:     "Looks urgent",
        posts:      (n) => `${n} new post${n === 1 ? "" : "s"}`,
        openInMoodle: "View thread",
        webhookLabel: "Also notify a webhook (Slack, Discord, Teams)",
        webhookPlaceholder: "https://hooks.slack.com/services/...",
        webhookSave: "Save",
        webhookSaving: "Saving…",
        webhookSaved: "Saved",
        webhookError: "Could not save the webhook URL.",
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

    useEffect(() => {
        let cancelled = false;
        getForumWebhook(courseId).then((url) => {
            if (!cancelled) {
                setWebhookUrl(url || "");
                setWebhookSavedUrl(url || "");
            }
        }).catch(() => { /* best-effort preload, without blocking the rest of the panel */ });
        return () => { cancelled = true; };
    }, [courseId]);

    const handleSaveWebhook = async () => {
        setSavingWebhook(true);
        setWebhookError(null);
        setWebhookSaved(false);
        try {
            const saved = await saveForumWebhook(courseId, webhookUrl.trim());
            setWebhookSavedUrl(saved || "");
            setWebhookSaved(true);
        } catch (err) {
            setWebhookError(getFriendlyErrorMessage(err, L.webhookError, lang));
        } finally {
            setSavingWebhook(false);
        }
    };

    const discussions = data?.discussions || [];

    return (
        <div className="nexusai-forumdigest">
            <p className="nexusai-forumdigest__intro">{L.intro}</p>

            <div className="nexusai-forumdigest__webhook">
                <label className="nexusai-forumdigest__webhook-label" htmlFor="nexusai-forumdigest-webhook-input">
                    {L.webhookLabel}
                </label>
                <div className="nexusai-forumdigest__webhook-row">
                    <input
                        id="nexusai-forumdigest-webhook-input"
                        type="url"
                        className="nexusai-forumdigest__webhook-input"
                        placeholder={L.webhookPlaceholder}
                        value={webhookUrl}
                        onChange={(e) => { setWebhookUrl(e.target.value); setWebhookSaved(false); }}
                    />
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--confirm"
                        disabled={savingWebhook || webhookUrl.trim() === webhookSavedUrl}
                        onClick={handleSaveWebhook}
                    >
                        {savingWebhook ? L.webhookSaving : L.webhookSave}
                    </button>
                </div>
                {webhookSaved && <span className="nexusai-forumdigest__webhook-confirm">{L.webhookSaved}</span>}
                {webhookError && <span className="nexusai-forumdigest__webhook-error">{webhookError}</span>}
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
