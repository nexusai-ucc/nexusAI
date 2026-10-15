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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewPanel from "./ReviewPanel.jsx";
import HistoryDropdown from "./HistoryDropdown.jsx";

// TPC-05 (#577): repaso de errores y desplegable del historial del alumno.

vi.mock("../api/quiz.js", () => ({
    listQuizErrors: vi.fn(),
    clearQuizErrors: vi.fn(),
    getReviewSuggestions: vi.fn(),
}));
vi.mock("../api/history.js", () => ({
    listSessions: vi.fn(),
    deleteSession: vi.fn(),
}));

import { listQuizErrors, clearQuizErrors, getReviewSuggestions } from "../api/quiz.js";
import { listSessions, deleteSession } from "../api/history.js";

const DOC_UUID = "123e4567-e89b-12d3-a456-426614174000";

const mcError = {
    id: "e1",
    question_type: "multiple_choice",
    question: "¿Qué estructura es LIFO?",
    options: ["Cola", "Pila"],
    correct_index: 1,
    user_selected_index: 0,
    explanation: "La pila: último en entrar, primero en salir.",
    source_filename: "u2.pdf",
    source_document_id: DOC_UUID,
    created_at: "2026-10-01T10:00:00Z",
};
const openError = {
    id: "e2",
    question_type: "open",
    question: "Explicá la recursión.",
    options: [],
    user_answer: "Es un bucle.",
    ai_feedback: "Confundís recursión con iteración.",
    ai_score: 0.25,
    explanation: "Una función que se llama a sí misma.",
    created_at: "2026-10-02T10:00:00Z",
};

beforeEach(() => {
    vi.resetAllMocks();
});

describe("ReviewPanel", () => {
    it("muestra las sugerencias y las preguntas falladas, marcando la correcta y la elegida", async () => {
        // Arrange.
        listQuizErrors.mockResolvedValue({ total: 2, items: [mcError, openError] });
        getReviewSuggestions.mockResolvedValue({
            suggestions: [{ topic: "Pilas", error_count: 3, suggestion: "Repasá la unidad 2.", source_filename: "u2.pdf", source_document_id: DOC_UUID }],
        });

        // Act.
        const { container } = render(<ReviewPanel courseId={4} sesskey="sk" />);

        // Assert.
        expect(await screen.findByText("Repasá la unidad 2.")).toBeInTheDocument();
        expect(screen.getByText("3 errores")).toBeInTheDocument();
        expect(screen.getByText("¿Qué estructura es LIFO?")).toBeInTheDocument();
        expect(container.querySelector(".nexusai-review__opt--correct")).toHaveTextContent("Pila");
        expect(container.querySelector(".nexusai-review__opt--wrong")).toHaveTextContent("Cola");
        expect(screen.getByText("Es un bucle.")).toBeInTheDocument();
    });

    it("al expandir una pregunta abierta muestra la evaluación de la IA y su puntaje", async () => {
        // Arrange.
        const user = userEvent.setup();
        listQuizErrors.mockResolvedValue({ total: 1, items: [openError] });
        getReviewSuggestions.mockResolvedValue({ suggestions: [] });
        render(<ReviewPanel courseId={4} />);

        // Act.
        await user.click(await screen.findByRole("button", { name: "Ver explicación" }));

        // Assert.
        expect(screen.getByText("Confundís recursión con iteración.")).toBeInTheDocument();
        expect(screen.getByText("25% de la respuesta correcta")).toBeInTheDocument();
        expect(screen.getByText(/Todavía no hay suficientes errores/)).toBeInTheDocument();
    });

    it("abre el archivo fuente solo si el id es un UUID y hay sesskey", async () => {
        // Arrange.
        const user = userEvent.setup();
        const open = vi.spyOn(window, "open").mockImplementation(() => null);
        listQuizErrors.mockResolvedValue({ total: 1, items: [mcError] });
        getReviewSuggestions.mockResolvedValue({ suggestions: [] });
        render(<ReviewPanel courseId={4} sesskey="sk" />);

        // Act.
        await user.click(await screen.findByRole("button", { name: /u2\.pdf/ }));

        // Assert.
        expect(open).toHaveBeenCalledWith(expect.stringContaining(`document_id=${DOC_UUID}`), "_blank", "noopener,noreferrer");
        open.mockRestore();
    });

    it("borrar el historial pide confirmación y deja el estado vacío", async () => {
        // Arrange.
        const user = userEvent.setup();
        listQuizErrors.mockResolvedValue({ total: 1, items: [mcError] });
        getReviewSuggestions.mockResolvedValue({ suggestions: [] });
        clearQuizErrors.mockResolvedValue({ deleted: 1 });
        render(<ReviewPanel courseId={4} />);
        await user.click(await screen.findByRole("button", { name: "Borrar historial" }));

        // Act.
        await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Borrar todo" }));

        // Assert.
        expect(clearQuizErrors).toHaveBeenCalledWith(4);
        expect(await screen.findByText("¡Sin errores recientes!")).toBeInTheDocument();
    });

    it("carga más errores cuando hay más que los mostrados", async () => {
        // Arrange.
        const user = userEvent.setup();
        listQuizErrors
            .mockResolvedValueOnce({ total: 2, items: [mcError] })
            .mockResolvedValueOnce({ total: 2, items: [openError] });
        getReviewSuggestions.mockResolvedValue({ suggestions: [] });
        render(<ReviewPanel courseId={4} lang="en" />);

        // Act.
        await user.click(await screen.findByRole("button", { name: "Load more (1 / 2)" }));

        // Assert.
        expect(await screen.findByText("Explicá la recursión.")).toBeInTheDocument();
        expect(listQuizErrors).toHaveBeenLastCalledWith(4, 90, 100, 1);
    });

    it("si falla la carga muestra el error", async () => {
        // Arrange.
        listQuizErrors.mockRejectedValue(new Error("network"));
        getReviewSuggestions.mockRejectedValue(new Error("network"));

        // Act.
        render(<ReviewPanel courseId={4} />);

        // Assert.
        expect(await screen.findByRole("alert")).toBeInTheDocument();
    });
});

describe("HistoryDropdown", () => {
    const session = (id, preview, count = 2) => ({
        id,
        last_message_preview: preview,
        message_count: count,
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });

    it("cerrado no muestra nada ni pide datos", () => {
        // Act.
        const { container } = render(<HistoryDropdown open={false} courseId={4} />);

        // Assert.
        expect(container).toBeEmptyDOMElement();
        expect(listSessions).not.toHaveBeenCalled();
    });

    it("lista las conversaciones y elegir una avisa al chat", async () => {
        // Arrange.
        const user = userEvent.setup();
        const onSelect = vi.fn();
        listSessions.mockResolvedValue({ sessions: [session("s1", "¿Qué es una pila?", 1), session("s2", null)] });
        render(<HistoryDropdown open courseId={4} currentSessionId="s1" onSelectSession={onSelect} />);

        // Act.
        await user.click(await screen.findByText("¿Qué es una pila?"));

        // Assert.
        expect(onSelect).toHaveBeenCalledWith("s1");
        expect(screen.getByText("1 mensaje")).toBeInTheDocument();
        expect(screen.getByText("(sin mensajes)")).toBeInTheDocument();
    });

    it("cambiar a todos mis cursos vuelve a pedir el historial sin filtrar por curso", async () => {
        // Arrange.
        const user = userEvent.setup();
        listSessions.mockResolvedValue({ sessions: [] });
        render(<HistoryDropdown open courseId={4} lang="en" />);
        await screen.findByText(/No saved conversations yet/);

        // Act.
        await user.click(screen.getByRole("button", { name: "All my courses" }));

        // Assert.
        await waitFor(() => expect(listSessions).toHaveBeenLastCalledWith({ courseId: 4, scopeCourse: false, limit: 20 }));
    });

    it("borrar una conversación pide confirmación, la saca de la lista y avisa", async () => {
        // Arrange.
        const user = userEvent.setup();
        const onDeleted = vi.fn();
        listSessions.mockResolvedValue({ sessions: [session("s1", "Borrame")] });
        deleteSession.mockResolvedValue({ success: true });
        render(<HistoryDropdown open courseId={4} onSessionDeleted={onDeleted} />);
        await user.click(await screen.findByRole("button", { name: "Borrar conversación" }));

        // Act.
        await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Eliminar" }));

        // Assert.
        expect(deleteSession).toHaveBeenCalledWith({ courseId: 4, sessionId: "s1" });
        await waitFor(() => expect(screen.queryByText("Borrame")).not.toBeInTheDocument());
        expect(onDeleted).toHaveBeenCalledWith("s1");
    });

    it("con 20 conversaciones (el límite inicial) ofrece cargar más", async () => {
        // Arrange.
        const user = userEvent.setup();
        const twenty = Array.from({ length: 20 }, (_, i) => session(`s${i}`, `Charla ${i}`));
        listSessions.mockResolvedValueOnce({ sessions: twenty }).mockResolvedValueOnce({ sessions: [...twenty, session("s20", "Charla 20")] });
        render(<HistoryDropdown open courseId={4} />);

        // Act.
        await user.click(await screen.findByRole("button", { name: "Cargar más sesiones" }));

        // Assert.
        expect(await screen.findByText("Charla 20")).toBeInTheDocument();
        expect(listSessions).toHaveBeenLastCalledWith({ courseId: 4, scopeCourse: true, limit: 40 });
    });

    it("si falla la carga muestra el error", async () => {
        // Arrange.
        listSessions.mockRejectedValue(new Error("network"));

        // Act.
        render(<HistoryDropdown open courseId={4} />);

        // Assert.
        expect(await screen.findByText(/No se pudo cargar el historial|conexión|red/i)).toBeInTheDocument();
    });
});
