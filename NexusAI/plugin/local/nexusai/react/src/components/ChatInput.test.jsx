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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "./ChatInput.jsx";

vi.mock("../api/voice.js", () => ({
    transcribeAudio: vi.fn(),
}));

import { transcribeAudio } from "../api/voice.js";

// VOICE-01 (#314): grabar con MediaRecorder es una API nativa del browser —
// jsdom no la implementa, así que se stubea con un fake mínimo. `onstop`
// dispara sincrónicamente al llamar `.stop()` para simplificar los tests
// (el componente igual pasa por transcribeAudio de forma async real).
class FakeMediaRecorder {
    constructor() {
        this.state = "inactive";
        this.mimeType = "audio/webm";
        this.ondataavailable = null;
        this.onstop = null;
    }
    start() {
        this.state = "recording";
    }
    stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["fake-audio-chunk"]) });
        this.onstop?.();
    }
}

function stubMicSupport({ granted = true } = {}) {
    window.MediaRecorder = FakeMediaRecorder;
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] };
    Object.defineProperty(navigator, "mediaDevices", {
        value: {
            getUserMedia: granted
                ? vi.fn().mockResolvedValue(fakeStream)
                : vi.fn().mockRejectedValue(new Error("Permission denied")),
        },
        configurable: true,
    });
}

function clearMicSupport() {
    delete window.MediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    clearMicSupport();
});

describe("ChatInput — envío de texto (comportamiento existente)", () => {
    it("envía con el botón y limpia el composer", async () => {
        const user = userEvent.setup();
        const onSend = vi.fn();

        render(<ChatInput onSend={onSend} courseId={5} />);
        await user.type(screen.getByLabelText("Tu pregunta"), "Hola");
        await user.click(screen.getByLabelText("Enviar mensaje"));

        expect(onSend).toHaveBeenCalledWith("Hola");
        expect(screen.getByLabelText("Tu pregunta")).toHaveValue("");
    });
});

describe("ChatInput — micrófono (VOICE-01, #314)", () => {
    it("no muestra el botón de micrófono si el navegador no soporta MediaRecorder", () => {
        clearMicSupport();
        render(<ChatInput onSend={vi.fn()} courseId={5} />);

        expect(screen.queryByLabelText("Grabar pregunta por voz")).not.toBeInTheDocument();
    });

    it("graba y transcribe: el texto llena el textarea sin auto-enviar", async () => {
        stubMicSupport();
        transcribeAudio.mockResolvedValue("¿Qué entra en el parcial?");
        const user = userEvent.setup();
        const onSend = vi.fn();

        render(<ChatInput onSend={onSend} courseId={5} />);

        await user.click(screen.getByLabelText("Grabar pregunta por voz"));
        await screen.findByLabelText("Detener grabación");
        await user.click(screen.getByLabelText("Detener grabación"));

        await waitFor(() => expect(screen.getByLabelText("Tu pregunta")).toHaveValue("¿Qué entra en el parcial?"));
        expect(onSend).not.toHaveBeenCalled();
        expect(transcribeAudio).toHaveBeenCalledWith(5, expect.any(Blob));
    });

    it("agrega el texto transcripto al final si ya había algo escrito", async () => {
        stubMicSupport();
        transcribeAudio.mockResolvedValue("y las derivadas");
        const user = userEvent.setup();

        render(<ChatInput onSend={vi.fn()} courseId={5} />);
        await user.type(screen.getByLabelText("Tu pregunta"), "Quiero repasar límites");

        await user.click(screen.getByLabelText("Grabar pregunta por voz"));
        await user.click(await screen.findByLabelText("Detener grabación"));

        await waitFor(() =>
            expect(screen.getByLabelText("Tu pregunta")).toHaveValue("Quiero repasar límites y las derivadas")
        );
    });

    it("muestra un error claro si se deniega el permiso de micrófono, sin romper el input de texto", async () => {
        stubMicSupport({ granted: false });
        const user = userEvent.setup();

        render(<ChatInput onSend={vi.fn()} courseId={5} />);
        await user.click(screen.getByLabelText("Grabar pregunta por voz"));

        expect(await screen.findByRole("alert")).toHaveTextContent(/no se pudo acceder al micrófono/i);

        // El input de texto sigue funcionando con normalidad.
        await user.type(screen.getByLabelText("Tu pregunta"), "sigo pudiendo escribir");
        expect(screen.getByLabelText("Tu pregunta")).toHaveValue("sigo pudiendo escribir");
    });

    it("muestra un error claro si la transcripción falla, sin bloquear el envío de texto normal", async () => {
        stubMicSupport();
        transcribeAudio.mockRejectedValue(new Error("503"));
        const user = userEvent.setup();
        const onSend = vi.fn();

        render(<ChatInput onSend={onSend} courseId={5} />);
        await user.click(screen.getByLabelText("Grabar pregunta por voz"));
        await user.click(await screen.findByLabelText("Detener grabación"));

        expect(await screen.findByRole("alert")).toHaveTextContent(/no se pudo transcribir/i);

        await user.type(screen.getByLabelText("Tu pregunta"), "pregunta escrita a mano");
        await user.click(screen.getByLabelText("Enviar mensaje"));
        expect(onSend).toHaveBeenCalledWith("pregunta escrita a mano");
    });

    it("avisa si la transcripción vuelve vacía en vez de no hacer nada", async () => {
        stubMicSupport();
        transcribeAudio.mockResolvedValue("   ");
        const user = userEvent.setup();

        render(<ChatInput onSend={vi.fn()} courseId={5} />);
        await user.click(screen.getByLabelText("Grabar pregunta por voz"));
        await user.click(await screen.findByLabelText("Detener grabación"));

        expect(await screen.findByRole("alert")).toHaveTextContent(/no se escuchó ninguna pregunta/i);
        expect(screen.getByLabelText("Tu pregunta")).toHaveValue("");
        // Se puede volver a grabar.
        expect(screen.getByLabelText("Grabar pregunta por voz")).toBeEnabled();
    });
});

describe("ChatInput — marcador de texto pegado según el idioma", () => {
    const LONG_PASTE = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n");

    async function pasteLongText(user, props) {
        const onSend = vi.fn();
        render(<ChatInput onSend={onSend} {...props} />);
        const textarea = screen.getByRole("textbox");
        await user.click(textarea);
        await user.paste(LONG_PASTE);
        return { onSend, textarea };
    }

    it("shows the English marker for lang 'en' and expands it on send", async () => {
        const user = userEvent.setup();
        const { onSend, textarea } = await pasteLongText(user, { lang: "en" });

        expect(textarea.value).toBe("[📋 Pasted #1 — 20 lines]");
        expect(textarea.value).not.toMatch(/Pegado|líneas/);

        await user.click(screen.getByRole("button", { name: /send/i }));
        expect(onSend).toHaveBeenCalledWith(LONG_PASTE);
    });

    it("shows the Spanish marker for lang 'es' and expands it on send", async () => {
        const user = userEvent.setup();
        const { onSend, textarea } = await pasteLongText(user, { lang: "es" });

        expect(textarea.value).toBe("[📋 Pegado #1 — 20 líneas]");

        await user.click(screen.getByRole("button", { name: /enviar/i }));
        expect(onSend).toHaveBeenCalledWith(LONG_PASTE);
    });
});
