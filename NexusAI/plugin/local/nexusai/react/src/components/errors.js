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

    if (status === 429) return msgs.rateLimit;
    if (status && status >= 500 && status < 600) return msgs.unavailable;

    if (status && status >= 400 && status < 500) {
        const detail = extractDetail(raw);
        if (detail) return detail;
    }

    return fallback;
}
