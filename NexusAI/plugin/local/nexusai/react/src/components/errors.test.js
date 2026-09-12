import { describe, it, expect } from "vitest";
import { getFriendlyErrorMessage } from "./errors.js";

// FEAT-06 (#481, límite diario de consultas): el backend distingue el
// límite por minuto del límite diario con un `detail.message` propio (ver
// services/api/app/shared/rate_limit.py::check_rate_limit, _MESSAGES).
// Antes de este fix, getFriendlyErrorMessage() mandaba CUALQUIER 429 al
// mismo mensaje curado genérico sin mirar el detail — el alumno nunca veía
// la diferencia entre "esperá un minuto" y "volvé mañana".
describe("getFriendlyErrorMessage — límite diario vs. límite por minuto (429)", () => {
    it("muestra el mensaje específico del límite por minuto", () => {
        const err = new Error(
            'Error del backend NexusAI: HTTP 429: {"detail":{"error":"rate_limit_exceeded","scope":"minute","message":"Superaste el límite de 20 consultas por minuto. Esperá un momento y volvé a intentarlo.","limit":20,"window_sec":60}}'
        );
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "Superaste el límite de 20 consultas por minuto. Esperá un momento y volvé a intentarlo."
        );
    });

    it("muestra el mensaje específico del límite diario — distinto al de por minuto", () => {
        const err = new Error(
            'Error del backend NexusAI: HTTP 429: {"detail":{"error":"rate_limit_exceeded","scope":"daily","message":"Alcanzaste tu límite de 50 consultas de hoy. Volvé a intentarlo mañana.","limit":50,"window_sec":86400}}'
        );
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "Alcanzaste tu límite de 50 consultas de hoy. Volvé a intentarlo mañana."
        );
    });

    it("un 429 que no es de nuestro propio rate limiter (ej. cuota del proveedor LLM) sigue usando el mensaje curado genérico", () => {
        const err = new Error(
            'Error del backend NexusAI: HTTP 429: {"detail":"Rate limit reached for requests, please try again later."}'
        );
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos."
        );
    });

    it("un 429 sin ningún detail parseable también cae al mensaje curado genérico, no al fallback del caller", () => {
        const err = new Error("HTTP 429: Too Many Requests");
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos."
        );
    });

    it("5xx sigue usando el mensaje curado de infraestructura, sin cambios", () => {
        const err = new Error('Error del backend NexusAI: HTTP 503: {"detail":"LLM provider timeout"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "El asistente no está disponible en este momento. Probá de nuevo en unos minutos."
        );
    });
});
