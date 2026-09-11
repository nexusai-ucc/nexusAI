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

    it("en 401 sin detail parseable cae al fallback del caller", () => {
        const err = new Error("HTTP 401: Unauthorized");
        expect(getFriendlyErrorMessage(err, "fallback")).toBe("Unauthorized");
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
