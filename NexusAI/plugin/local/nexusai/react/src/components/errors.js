// UX-08 (#348): mensajes de error amigables, centralizados.
//
// El backend arma los mensajes de error así (ver classes/external/backend_client.php
// + lang/es/local_nexusai.php):
//   "Error del backend NexusAI: HTTP 503: {\"detail\":\"<texto crudo del proveedor LLM>\"}"
//
// Antes de esto, dos componentes (QuizPanel.jsx y DocumentsManager.jsx) habían escrito
// cada uno por separado una función casi idéntica para pelar ese formato — quedaba
// el `detail` del backend, que igual puede ser texto técnico del proveedor LLM
// (cuota agotada, rate limit, etc.), no un mensaje pensado para el usuario final.
//
// getFriendlyErrorMessage() reemplaza esas dos funciones:
//   - 5xx / 429 (infraestructura, cuota, rate limit): siempre un mensaje curado,
//     nunca el detail crudo del proveedor.
//   - 4xx conocidos (ej. 422 "tema no encontrado en el material" de QuizPanel):
//     el detail es información pensada para el usuario, se sigue mostrando.
//   - Sin código HTTP reconocible (red, timeout): el fallback que pase el caller.

function extractDetail(raw) {
    const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (detailMatch) return detailMatch[1].replace(/\\"/g, '"');
    const httpMatch = raw.match(/HTTP\s+\d+[:\s]+(.+)/s);
    if (httpMatch) return httpMatch[1].trim();
    return null;
}

// FEAT-06 (#481, límite diario): a diferencia del rate limit de un proveedor
// LLM (429 con texto técnico, no apto para mostrar), el `detail` de NUESTRO
// propio rate limiter (services/api/app/shared/rate_limit.py::check_rate_limit)
// es un objeto estructurado — {"error":"rate_limit_exceeded","scope":"minute"
// |"daily","message":"<texto en español para el alumno>",...} — no un string,
// así que `extractDetail()` de arriba (que solo matchea `"detail":"<string>"`)
// nunca lo capturaba, y `getFriendlyErrorMessage()` mandaba CUALQUIER 429 al
// mensaje curado genérico sin mirar el detail. Eso rompía la razón de ser del
// límite diario: el alumno nunca veía la diferencia entre "esperá un minuto"
// y "volvé mañana", solo el mismo texto genérico para los dos casos.
function extractOwnRateLimitMessage(raw) {
    const match = raw.match(/"detail"\s*:\s*(\{[^}]*\})/);
    if (!match) return null;
    try {
        const parsed = JSON.parse(match[1]);
        if (parsed.error === "rate_limit_exceeded" && typeof parsed.message === "string") {
            return parsed.message;
        }
    } catch {
        // No era el JSON que esperábamos (p. ej. un 429 de otro origen) —
        // seguimos con el mensaje curado genérico.
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
