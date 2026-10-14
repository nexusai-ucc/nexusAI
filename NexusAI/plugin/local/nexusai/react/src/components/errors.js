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

// UX-08 (#348): friendly error messages, in one place.
//
// The backend builds error messages like this (see classes/external/backend_client.php
// + the plugin's language strings):
//   "NexusAI backend error: HTTP 503: {\"detail\":\"<raw text from the LLM provider>\"}"
//
// Before this, two components (QuizPanel.jsx and DocumentsManager.jsx) had each
// written an almost identical function to strip that format — what was left was
// the backend's `detail`, which can still be technical text from the LLM provider
// (quota exhausted, rate limit, etc.), not a message meant for the end user.
//
// getFriendlyErrorMessage() replaces those two functions:
//   - 5xx / 429 (infrastructure, quota, rate limit): always a curated message,
//     never the provider's raw detail.
//   - Known 4xx (e.g. QuizPanel's 422 "topic not found in the material"):
//     the detail is information meant for the user, it is still shown.
//   - No recognizable HTTP code (network, timeout): the fallback the caller passes.

function extractDetail(raw) {
    const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (detailMatch) return detailMatch[1].replace(/\\"/g, '"');
    const httpMatch = raw.match(/HTTP\s+\d+[:\s]+(.+)/s);
    if (httpMatch) return httpMatch[1].trim();
    return null;
}

// FEAT-06 (#481, daily limit): unlike an LLM provider's rate limit (429 with
// technical text, not fit to show), the `detail` of OUR own rate limiter
// (services/api/app/shared/rate_limit.py::check_rate_limit) is a structured
// object — {"error":"rate_limit_exceeded","scope":"minute"
// |"daily","message":"<text for the student>",...} — not a string,
// so `extractDetail()` above (which only matches `"detail":"<string>"`)
// never caught it, and `getFriendlyErrorMessage()` sent ANY 429 to the
// generic curated message without looking at the detail. That defeated the
// purpose of the daily limit: the student never saw the difference between
// "wait a minute" and "come back tomorrow", only the same generic text for both.
function extractOwnRateLimitMessage(raw) {
    const match = raw.match(/"detail"\s*:\s*(\{[^}]*\})/);
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[1]);
        if (parsed.error === "rate_limit_exceeded" && typeof parsed.message === "string") {
            return parsed.message;
        }
    } catch {
        // It was not the JSON we expected (e.g. a 429 from somewhere else) —
        // we go on with the generic curated message.
    }
    return null;
}

const INFRA_MESSAGES = {
    es: {
        rateLimit: "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos.",
        unavailable: "El asistente no está disponible en este momento. Probá de nuevo en unos minutos.",
    },
    en: {
        rateLimit: "Usage limit reached for now. Try again in a few minutes.",
        unavailable: "The assistant isn't available right now. Try again in a few minutes.",
    },
};

export function getFriendlyErrorMessage(err, fallback, lang = "es") {
    const raw = err?.message || String(err || "");
    const statusMatch = raw.match(/HTTP\s+(\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
    const msgs = INFRA_MESSAGES[lang] || INFRA_MESSAGES.es;

    if (status === 429) return extractOwnRateLimitMessage(raw) || msgs.rateLimit;
    if (status && status >= 500 && status < 600) return msgs.unavailable;

    if (status && status >= 400 && status < 500) {
        const detail = extractDetail(raw);
        if (detail) return detail;
    }

    return fallback;
}
