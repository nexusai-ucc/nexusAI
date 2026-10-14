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

import { useEffect, useState } from "react";
import { getBudgetStatus } from "../api/budget.js";

// DATA-05 (#525): the student sees how much of their token limit is left. A
// number of tokens tells them nothing, so the percentage of the day and an
// approximate number of questions are shown. Warning from 80 %; when it runs
// out, at what time it renews.
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
