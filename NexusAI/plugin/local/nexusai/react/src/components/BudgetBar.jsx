import { useEffect, useState } from "react";
import { getBudgetStatus } from "../api/budget.js";

// DATA-05 (#525): el alumno ve cuánto le queda de su límite de tokens. Un
// número de tokens no le dice nada, así que se muestra el porcentaje del día y
// una cantidad aproximada de preguntas. Aviso desde el 80 %; al agotarse, a qué
// hora se renueva.
const WARN_AT = 80;

function renewTime(seconds, lang) {
    const when = new Date(Date.now() + seconds * 1000);
    return when.toLocaleTimeString(lang === "es" ? "es-AR" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function BudgetBar({ courseId, refreshKey = 0, lang = "es", fetchStatus = getBudgetStatus }) {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        let cancelled = false;
        if (!(Number(courseId) > 0)) return undefined;
        fetchStatus(courseId).then((s) => {
            if (!cancelled) setStatus(s);
        });
        return () => { cancelled = true; };
    }, [courseId, refreshKey, fetchStatus]);

    if (!status?.daily) return null;

    const daily = status.daily;
    const hourly = status.hourly;
    const percent = Math.max(0, Math.min(100, daily.percentused ?? 0));
    const exhausted = daily.remaining <= 0 || (hourly && hourly.remaining <= 0);
    const warning = !exhausted && percent >= WARN_AT;
    const window = daily.remaining <= 0 ? daily : hourly;

    const L = lang === "es" ? {
        title: "Tu límite del asistente",
        left: (n) => `Te quedan unas ${n} preguntas hoy`,
        warn: (p) => `Usaste el ${p}% del límite de hoy.`,
        out: (t) => `Llegaste al límite. Se renueva a las ${t}.`,
    } : {
        title: "Your assistant limit",
        left: (n) => `About ${n} questions left today`,
        warn: (p) => `You have used ${p}% of today's limit.`,
        out: (t) => `You reached the limit. It renews at ${t}.`,
    };

    const text = exhausted
        ? L.out(renewTime(window?.resetsinsec ?? 0, lang))
        : warning
            ? `${L.warn(percent)} ${L.left(daily.questionsleft)}`
            : L.left(daily.questionsleft);

    const state = exhausted ? "out" : warning ? "warn" : "ok";

    return (
        <div className={`nexusai-budget nexusai-budget--${state}`} role="status" aria-label={L.title}>
            <div
                className="nexusai-budget__track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={L.title}
            >
                <div className="nexusai-budget__fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="nexusai-budget__text">{text}</span>
        </div>
    );
}
