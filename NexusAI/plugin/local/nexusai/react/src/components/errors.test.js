import { describe, it, expect } from "vitest";
import { getFriendlyErrorMessage } from "./errors.js";

// UX-08 (#348): getFriendlyErrorMessage() es el único punto donde el frontend
// decide qué mostrarle al alumno/docente cuando una llamada al backend falla.
// Cubre los códigos de error más frecuentes contra la API (401/403 caen en el
// bucket 4xx genérico, 429 y 5xx tienen mensaje curado propio) y el fallback
// para errores sin código HTTP reconocible (timeouts, errores de red).
describe("getFriendlyErrorMessage", () => {
    it("devuelve el mensaje curado de rate limit en 429, ignorando el detail crudo", () => {
        const err = new Error('Error del backend NexusAI: HTTP 429: {"detail":"quota exceeded for provider X"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "Se alcanzó el límite de uso por ahora. Probá de nuevo en unos minutos."
        );
    });

    it("devuelve el mensaje curado de infraestructura en 500-599, ignorando el detail crudo", () => {
        const err = new Error('Error del backend NexusAI: HTTP 503: {"detail":"LLM provider timeout"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe(
            "El asistente no está disponible en este momento. Probá de nuevo en unos minutos."
        );
    });

    it("en 401 (sesión no autorizada) usa el detail del backend si viene informativo", () => {
        const err = new Error('Error del backend NexusAI: HTTP 401: {"detail":"Sesión expirada, volvé a ingresar"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("Sesión expirada, volvé a ingresar");
    });

    it("en 401 sin JSON {detail} muestra el texto crudo después de 'HTTP 401:', no el fallback", () => {
        // OJO: este test antes se llamaba "cae al fallback del caller" pero
        // afirmaba exactamente lo contrario — el nombre no coincidía con lo
        // que en realidad verifica (hallazgo de la auditoría /audit sobre
        // esta PR). El comportamiento real: cualquier 4xx sin JSON
        // `{"detail":...}` parseable cae al regex genérico `HTTP\s+\d+[:\s]+(.+)`
        // y le muestra al alumno el texto técnico crudo de la excepción — no
        // hay ningún camino hoy que use el fallback del caller para un 4xx
        // con texto después del código. Ver el siguiente test para el caso
        // (más angosto) donde sí se usa el fallback.
        const err = new Error("HTTP 401: Unauthorized");
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("Unauthorized");
    });

    it("en 401 sin ningún texto después del código (ni JSON ni texto plano) sí cae al fallback del caller", () => {
        const err = new Error("HTTP 401");
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("fallback");
    });

    it("en 403 (sin permisos) usa el detail del backend", () => {
        const err = new Error('Error del backend NexusAI: HTTP 403: {"detail":"No tenés acceso a este curso"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("No tenés acceso a este curso");
    });

    it("en 422 (ej. tema no encontrado en el material) muestra el detail, es información para el usuario", () => {
        const err = new Error('Error del backend NexusAI: HTTP 422: {"detail":"tema no encontrado en el material del curso"}');
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("tema no encontrado en el material del curso");
    });

    it("sin código HTTP reconocible (timeout / error de red) usa el fallback del caller", () => {
        const err = new Error("Failed to fetch");
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("fallback");
    });

    it("acepta un error sin .message (string plano) sin romper", () => {
        expect(getFriendlyErrorMessage("boom", "fallback")).toBe("fallback");
    });

    it("respeta el idioma inglés para los mensajes curados", () => {
        const err = new Error("HTTP 429: rate limited");
        expect(getFriendlyErrorMessage(err, "fallback", "en")).toBe(
            "Usage limit reached for now. Try again in a few minutes."
        );
    });
});

// FEAT-06 (#481, límite diario de consultas): el backend distingue el
// límite por minuto del límite diario con un `detail.message` propio (ver
// services/api/app/shared/rate_limit.py::check_rate_limit, _MESSAGES) — un
// `detail` ESTRUCTURADO (objeto, no string), a diferencia del caso genérico
// de arriba ("ignorando el detail crudo"). Antes de este fix,
// getFriendlyErrorMessage() mandaba CUALQUIER 429 al mismo mensaje curado
// genérico sin mirar el detail — el alumno nunca veía la diferencia entre
// "esperá un minuto" y "volvé mañana".
describe("getFriendlyErrorMessage — límite diario vs. límite por minuto (429 propio)", () => {
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
});
