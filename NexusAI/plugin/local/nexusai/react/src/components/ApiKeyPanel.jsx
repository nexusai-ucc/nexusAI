// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * ApiKeyPanel — "My API key" (BYOK).
 *
 * The user saves the API key of their own AI provider account. NexusAI uses it
 * only as the last resort: when the institution's models do not answer, or when
 * the user reached their limit. Three views:
 *
 *   - form:   first time, or "Change key". The key is tested by the backend
 *             before being saved; the privacy notice has to be accepted.
 *   - saved:  provider, model, a hint of the key, last test and this month's
 *             use, with "Test again", "Change key" and "Remove".
 *   - paused: the teacher turned own keys off in this course; the key stays
 *             saved for the user's other courses.
 */

import { useEffect, useState } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import { IconAlertTriangle, IconCheck, IconEye, IconEyeOff, IconInfo, IconLock } from "./icons.jsx";
import { getFriendlyErrorMessage } from "./errors.js";
import {
    KEY_MAX,
    KEY_MIN,
    KEY_PATTERN,
    MODEL_PATTERN,
    deleteUserLlm,
    getUserLlm,
    saveUserLlm,
    testUserLlm,
} from "../api/userLlm.js";

const L = {
    es: {
        loading: "Cargando…",
        loadError: "No se pudo cargar tu API key. Probá de nuevo en un rato.",
        lead: "Si cargás la key de tu propia cuenta, NexusAI sigue respondiéndote cuando la de la facultad no alcanza. El consumo se cobra en tu cuenta del proveedor.",
        whenTitle: "Se usa solo en dos casos",
        whenDown: "Los modelos de la facultad están sin cuota o caídos.",
        whenLimit: "Llegaste a tu límite de la hora o del día.",
        covers: "Cubre todo lo que NexusAI escribe: chat, quizzes, flashcards y resúmenes. La búsqueda y la voz siguen usando lo de la facultad.",
        provider: "Proveedor",
        providerHelp: "Lista cerrada: NexusAI no se conecta a direcciones que escriba el usuario.",
        model: "Modelo",
        modelHelp: "El nombre exacto del modelo, como figura en tu cuenta del proveedor.",
        modelInvalid: "Escribí el nombre del modelo sin espacios.",
        key: "API key",
        keyInvalid: `La key tiene que tener entre ${KEY_MIN} y ${KEY_MAX} caracteres, sin espacios ni acentos.`,
        showKey: "Mostrar la key",
        hideKey: "Ocultar la key",
        privacy: (p) => `Cuando se use tu key, tu pregunta y los fragmentos del material del curso que sirven para responderla se envían a ${p} con tu cuenta, bajo sus condiciones de uso.`,
        ack: "Entiendo y quiero usar mi key.",
        save: "Probar y guardar",
        testing: "Probando…",
        cancel: "Cancelar",
        encrypted: "Se guarda cifrada en Moodle y no se vuelve a mostrar completa.",
        saved: (p) => `Listo: ${p} respondió y tu key quedó guardada.`,
        connected: "Conectada",
        paused: "Pausada en este curso",
        unreadable: "Hay que cargarla de nuevo",
        unreadableBody: "No se pudo leer tu key guardada (por ejemplo, si se restauró el sitio). Mientras tanto NexusAI usa solo los modelos de la facultad.",
        modelLabel: "Modelo",
        keyLabel: "Key",
        tested: "Probada",
        never: "todavía no",
        used: "Usada este mes",
        usage: (r, t) => `${r} ${r === 1 ? "respuesta" : "respuestas"} · ${t} tokens`,
        testAgain: "Probar de nuevo",
        testOk: (p) => `${p} respondió bien.`,
        change: "Cambiar key",
        remove: "Quitar",
        removeTitle: "¿Quitar tu API key?",
        removeBody: "Desde ahora NexusAI usa solo los modelos de la facultad. Podés volver a cargarla cuando quieras.",
        removeConfirm: "Quitar",
        removed: "Tu key se quitó.",
        savedInfo: "Se usa solo si los modelos de la facultad no responden o si llegaste a tu límite. Mientras tengas límite disponible, seguís usando lo de la facultad.",
        notCounted: "Las respuestas con tu key no descuentan de tu límite de la facultad y no suman al costo de la facultad.",
        pausedTitle: "En este curso no se usan keys propias.",
        pausedBody: "El docente lo desactivó para que el material del curso no salga a otros proveedores. Tu key sigue guardada y se usa en tus otros cursos.",
        siteOff: "El administrador desactivó las API keys propias en este sitio.",
        failed: "No se pudo guardar la key.",
    },
    en: {
        loading: "Loading…",
        loadError: "Your API key could not be loaded. Try again in a while.",
        lead: "If you add the key of your own account, NexusAI keeps answering when the institution's runs short. The usage is charged to your provider account.",
        whenTitle: "It is used in two cases only",
        whenDown: "The institution's models are out of quota or down.",
        whenLimit: "You reached your hourly or daily limit.",
        covers: "It covers everything NexusAI writes: chat, quizzes, flashcards and summaries. Search and voice keep using the institution's.",
        provider: "Provider",
        providerHelp: "Closed list: NexusAI never connects to an address a user types.",
        model: "Model",
        modelHelp: "The exact model name, as it appears in your provider account.",
        modelInvalid: "Type the model name without spaces.",
        key: "API key",
        keyInvalid: `The key must have between ${KEY_MIN} and ${KEY_MAX} characters, without spaces or accented letters.`,
        showKey: "Show the key",
        hideKey: "Hide the key",
        privacy: (p) => `When your key is used, your question and the excerpts of the course material that help answer it are sent to ${p} under your account and its terms of use.`,
        ack: "I understand and want to use my key.",
        save: "Test and save",
        testing: "Testing…",
        cancel: "Cancel",
        encrypted: "It is stored encrypted in Moodle and never shown in full again.",
        saved: (p) => `Done: ${p} answered and your key was saved.`,
        connected: "Connected",
        paused: "Paused in this course",
        unreadable: "Needs to be added again",
        unreadableBody: "Your saved key could not be read (for example after the site was restored). Meanwhile NexusAI uses only the institution's models.",
        modelLabel: "Model",
        keyLabel: "Key",
        tested: "Tested",
        never: "not yet",
        used: "Used this month",
        usage: (r, t) => `${r} ${r === 1 ? "answer" : "answers"} · ${t} tokens`,
        testAgain: "Test again",
        testOk: (p) => `${p} answered fine.`,
        change: "Change key",
        remove: "Remove",
        removeTitle: "Remove your API key?",
        removeBody: "From now on NexusAI uses only the institution's models. You can add it again any time.",
        removeConfirm: "Remove",
        removed: "Your key was removed.",
        savedInfo: "It is used only if the institution's models do not answer or you reached your limit. While you have limit left, you keep using the institution's.",
        notCounted: "Answers with your key do not count towards your limit and do not add to the institution's cost.",
        pausedTitle: "Own keys are not used in this course.",
        pausedBody: "The teacher turned it off so the course material does not go to other providers. Your key stays saved and is used in your other courses.",
        siteOff: "The administrator turned off own API keys on this site.",
        failed: "The key could not be saved.",
    },
};

function formatTested(timestamp, lang, never) {
    if (!timestamp) return never;
    return new Date(timestamp * 1000).toLocaleString(lang === "es" ? "es-AR" : "en-GB", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatNumber(n, lang) {
    return Number(n || 0).toLocaleString(lang === "es" ? "es-AR" : "en-GB");
}

export default function ApiKeyPanel({ courseId, lang = "es", onChange, api = null }) {
    const t = L[lang] || L.es;
    const calls = api || { getUserLlm, saveUserLlm, testUserLlm, deleteUserLlm };

    const [state, setState] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null); // {kind: "ok"|"error", text}
    const [confirmRemove, setConfirmRemove] = useState(false);

    const [provider, setProvider] = useState("openai");
    const [model, setModel] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [ack, setAck] = useState(false);
    const [touched, setTouched] = useState(false);

    const apply = (next) => {
        setState(next);
        onChange?.(next);
    };

    useEffect(() => {
        let cancelled = false;
        calls.getUserLlm(courseId)
            .then((s) => { if (!cancelled) apply(s); })
            .catch(() => { if (!cancelled) setLoadFailed(true); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    if (loadFailed) {
        return <div className="nexusai-apikey"><p className="nexusai-apikey__lead">{t.loadError}</p></div>;
    }
    if (!state) {
        return <div className="nexusai-apikey"><p className="nexusai-apikey__lead">{t.loading}</p></div>;
    }
    if (!state.siteenabled) {
        return <div className="nexusai-apikey"><p className="nexusai-apikey__lead">{t.siteOff}</p></div>;
    }

    // The server's list is the one that counts (local\user_llm::PROVIDERS).
    const providers = state.providers || [];
    const providerLabel = providers.find((p) => p.id === provider)?.label || provider;
    const modelValid = MODEL_PATTERN.test(model.trim());
    const keyValid = KEY_PATTERN.test(apiKey.trim());
    const canSave = modelValid && keyValid && ack && !busy;

    const startEditing = () => {
        setProvider(state.provider || "openai");
        setModel(state.model || "");
        setApiKey("");
        setShowKey(false);
        setAck(false);
        setTouched(false);
        setNotice(null);
        setEditing(true);
    };

    const runResult = (result, okText) => {
        apply(result.state);
        if (result.ok) {
            setNotice({ kind: "ok", text: okText });
            setEditing(false);
            setApiKey("");
        } else {
            setNotice({ kind: "error", text: result.message || t.failed });
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!canSave) return;
        setBusy(true);
        setNotice(null);
        try {
            const result = await calls.saveUserLlm({
                courseId,
                provider,
                model: model.trim(),
                apiKey: apiKey.trim(),
            });
            runResult(result, t.saved(providerLabel));
        } catch (err) {
            setNotice({ kind: "error", text: getFriendlyErrorMessage(err, t.failed, lang) });
        } finally {
            setBusy(false);
        }
    };

    const testAgain = async () => {
        setBusy(true);
        setNotice(null);
        try {
            const result = await calls.testUserLlm(courseId);
            runResult(result, t.testOk(state.providerlabel));
        } catch (err) {
            setNotice({ kind: "error", text: getFriendlyErrorMessage(err, t.failed, lang) });
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        setBusy(true);
        try {
            const next = await calls.deleteUserLlm(courseId);
            apply(next);
            setNotice({ kind: "ok", text: t.removed });
            setEditing(false);
        } catch (err) {
            setNotice({ kind: "error", text: getFriendlyErrorMessage(err, t.failed, lang) });
        } finally {
            setBusy(false);
            setConfirmRemove(false);
        }
    };

    const noticeBox = notice && (
        <div
            className={`nexusai-apikey__callout nexusai-apikey__callout--${notice.kind === "ok" ? "ok" : "danger"}`}
            role={notice.kind === "ok" ? "status" : "alert"}
        >
            {notice.kind === "ok" ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}
            <p>{notice.text}</p>
        </div>
    );

    // Saved and allowed here, but the server could not read it (the site
    // encryption key changed): it is not used until the user adds it again.
    const unreadable = state.configured && state.courseallowed && !state.active;

    const keyCard = (
        <div className="nexusai-apikey__card">
            <div className="nexusai-apikey__card-top">
                <span className="nexusai-apikey__provider">{state.providerlabel}</span>
                {!state.courseallowed ? (
                    <span className="nexusai-apikey__pill">{t.paused}</span>
                ) : unreadable ? (
                    <span className="nexusai-apikey__pill nexusai-apikey__pill--warn">{t.unreadable}</span>
                ) : (
                    <span className="nexusai-apikey__pill nexusai-apikey__pill--ok">
                        <IconCheck size={11} />
                        {t.connected}
                    </span>
                )}
            </div>
            {unreadable && <p className="nexusai-apikey__card-note">{t.unreadableBody}</p>}
            <dl className="nexusai-apikey__kv">
                <dt>{t.modelLabel}</dt>
                <dd className="nexusai-apikey__mono">{state.model}</dd>
                <dt>{t.keyLabel}</dt>
                <dd className="nexusai-apikey__mono">{state.keyhint}</dd>
                {state.courseallowed && (
                    <>
                        <dt>{t.tested}</dt>
                        <dd>{formatTested(state.timetested, lang, t.never)}</dd>
                        <dt>{t.used}</dt>
                        <dd>{t.usage(state.monthrequests, formatNumber(state.monthtokens, lang))}</dd>
                    </>
                )}
            </dl>
            <div className="nexusai-apikey__actions">
                {state.courseallowed && !unreadable && (
                    <button type="button" className="nexusai-btn nexusai-btn--secondary" onClick={testAgain} disabled={busy}>
                        {busy ? t.testing : t.testAgain}
                    </button>
                )}
                <button type="button" className="nexusai-btn nexusai-btn--secondary" onClick={startEditing} disabled={busy}>
                    {t.change}
                </button>
                <button
                    type="button"
                    className="nexusai-btn nexusai-btn--ghost"
                    onClick={() => setConfirmRemove(true)}
                    disabled={busy}
                >
                    {t.remove}
                </button>
            </div>
        </div>
    );

    const removeModal = confirmRemove && (
        <ConfirmModal
            title={t.removeTitle}
            confirmLabel={t.removeConfirm}
            cancelLabel={t.cancel}
            onConfirm={remove}
            onCancel={() => setConfirmRemove(false)}
            busy={busy}
        >
            {t.removeBody}
        </ConfirmModal>
    );

    if (!state.courseallowed && !editing) {
        return (
            <div className="nexusai-apikey">
                <div className="nexusai-apikey__callout nexusai-apikey__callout--warn">
                    <IconInfo size={14} />
                    <div>
                        <p><strong>{t.pausedTitle}</strong> {t.pausedBody}</p>
                    </div>
                </div>
                {noticeBox}
                {state.configured && keyCard}
                {removeModal}
            </div>
        );
    }

    if (state.configured && !editing) {
        return (
            <div className="nexusai-apikey">
                {noticeBox}
                {keyCard}
                <div className="nexusai-apikey__callout nexusai-apikey__callout--info">
                    <IconInfo size={14} />
                    <p>{t.savedInfo}</p>
                </div>
                <p className="nexusai-apikey__fine">
                    <IconLock size={12} />
                    <span>{t.notCounted}</span>
                </p>
                {removeModal}
            </div>
        );
    }

    return (
        <form className="nexusai-apikey" onSubmit={submit} noValidate>
            <p className="nexusai-apikey__lead">{t.lead}</p>

            <div className="nexusai-apikey__callout nexusai-apikey__callout--info">
                <IconInfo size={14} />
                <div>
                    <p><strong>{t.whenTitle}</strong></p>
                    <ul>
                        <li>{t.whenDown}</li>
                        <li>{t.whenLimit}</li>
                    </ul>
                    <p>{t.covers}</p>
                </div>
            </div>

            <div className="nexusai-apikey__field">
                <label htmlFor="nexusai-apikey-provider">{t.provider}</label>
                <select
                    id="nexusai-apikey-provider"
                    className="nexusai-apikey__control"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                >
                    {providers.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                </select>
                <p className="nexusai-apikey__help">{t.providerHelp}</p>
            </div>

            <div className="nexusai-apikey__field">
                <label htmlFor="nexusai-apikey-model">{t.model}</label>
                <input
                    id="nexusai-apikey-model"
                    className="nexusai-apikey__control nexusai-apikey__mono"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={touched && !modelValid}
                />
                <p className={`nexusai-apikey__help ${touched && !modelValid ? "nexusai-apikey__help--error" : ""}`}>
                    {touched && !modelValid ? t.modelInvalid : t.modelHelp}
                </p>
            </div>

            <div className="nexusai-apikey__field">
                <label htmlFor="nexusai-apikey-key">{t.key}</label>
                <div className="nexusai-apikey__with-btn">
                    <input
                        id="nexusai-apikey-key"
                        className="nexusai-apikey__control nexusai-apikey__mono"
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        // Not a login password: no "save password?" prompt, no autofill.
                        autoComplete="new-password"
                        spellCheck={false}
                        aria-invalid={touched && !keyValid}
                    />
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--secondary nexusai-apikey__eye"
                        onClick={() => setShowKey((v) => !v)}
                        aria-label={showKey ? t.hideKey : t.showKey}
                        title={showKey ? t.hideKey : t.showKey}
                    >
                        {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                    </button>
                </div>
                {touched && !keyValid && (
                    <p className="nexusai-apikey__help nexusai-apikey__help--error">{t.keyInvalid}</p>
                )}
            </div>

            <div className="nexusai-apikey__callout nexusai-apikey__callout--warn">
                <IconAlertTriangle size={14} />
                <div>
                    <p>{t.privacy(providerLabel)}</p>
                    <label className="nexusai-apikey__check">
                        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
                        {t.ack}
                    </label>
                </div>
            </div>

            {noticeBox}

            <div className="nexusai-apikey__actions">
                <button type="submit" className="nexusai-btn nexusai-btn--confirm" disabled={!ack || busy}>
                    {busy ? t.testing : t.save}
                </button>
                {state.configured && (
                    <button type="button" className="nexusai-btn nexusai-btn--secondary" onClick={() => { setEditing(false); setNotice(null); }} disabled={busy}>
                        {t.cancel}
                    </button>
                )}
            </div>
            <p className="nexusai-apikey__fine">
                <IconLock size={12} />
                <span>{t.encrypted}</span>
            </p>
        </form>
    );
}
