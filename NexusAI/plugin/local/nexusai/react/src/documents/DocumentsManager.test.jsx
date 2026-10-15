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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentsManager from "./DocumentsManager.jsx";

// TPC-05 (#577): panel del docente (documents.php): carga del material,
// subida a una unidad, cola de subidas y navegación entre herramientas.

vi.mock("./api.js", () => ({
    listDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    reindexDocument: vi.fn(),
    replaceDocument: vi.fn(),
    getDocumentPreview: vi.fn(),
    listGaps: vi.fn(),
    archiveGap: vi.fn(),
    getFaqTopics: vi.fn(),
    getAnalyticsDashboard: vi.fn(),
    formatBytes: (n) => `${n} B`,
}));
vi.mock("../api/courseSections.js", () => ({ listCourseSections: vi.fn() }));
vi.mock("../api/search.js", () => ({ searchMaterial: vi.fn() }));

import { listDocuments, uploadDocument, listGaps, getFaqTopics } from "./api.js";
import { listCourseSections } from "../api/courseSections.js";

const doc = (id, filename, status = "indexed") => ({
    id, filename, status, mime_type: "application/pdf", updated_at: "2026-10-01T10:00:00Z",
});

function renderManager(props = {}) {
    return render(<DocumentsManager courseid={4} userid={2} sesskey="sk" courseFullname="Algoritmos" {...props} />);
}

beforeEach(() => {
    vi.resetAllMocks();
    listCourseSections.mockResolvedValue([{ section: 0, name: "General" }, { section: 1, name: "Unidad 1" }]);
    listGaps.mockResolvedValue({ total: 0, items: [] });
    getFaqTopics.mockResolvedValue({ total_questions: 0, topics: [] });
});

describe("DocumentsManager", () => {
    it("muestra el material indexado del curso y su cantidad", async () => {
        // Arrange.
        listDocuments.mockResolvedValue({ total: 2, items: [doc("d1", "u1.pdf"), doc("d2", "u2.pdf")] });

        // Act.
        renderManager();

        // Assert.
        expect(await screen.findByText("Material indexado (2)")).toBeInTheDocument();
        expect(screen.getByText("u1.pdf")).toBeInTheDocument();
        expect(screen.getByText("Algoritmos")).toBeInTheDocument();
        expect(listDocuments).toHaveBeenCalledWith(4, 30, 0);
    });

    it("sube los archivos a la unidad elegida, ocultos si se destilda la visibilidad", async () => {
        // Arrange.
        const user = userEvent.setup();
        listDocuments.mockResolvedValue({ total: 0, items: [] });
        uploadDocument.mockResolvedValue(doc("d9", "nuevo.pdf", "pending"));
        const { container } = renderManager();
        await screen.findByText("Material indexado (0)");
        await user.selectOptions(await screen.findByLabelText("Unidad del aula"), "1");
        await user.click(screen.getByLabelText("Visible para alumnos"));

        // Act.
        await user.upload(container.querySelector('input[type="file"]'), new File(["%PDF"], "nuevo.pdf", { type: "application/pdf" }));

        // Assert.
        await waitFor(() => expect(uploadDocument).toHaveBeenCalledWith(4, expect.any(File), 1, false));
        expect(await screen.findByText("Material indexado (1)")).toBeInTheDocument();
    });

    it("un archivo ya indexado (409) avisa en vez de mostrar un error", async () => {
        // Arrange.
        const user = userEvent.setup();
        listDocuments.mockResolvedValue({ total: 0, items: [] });
        uploadDocument.mockRejectedValue(new Error("HTTP 409: duplicate"));
        const { container } = renderManager();
        await user.selectOptions(await screen.findByLabelText("Unidad del aula"), "0");

        // Act.
        await user.upload(container.querySelector('input[type="file"]'), new File(["%PDF"], "repetido.pdf", { type: "application/pdf" }));

        // Assert.
        expect(await screen.findByText('"repetido.pdf" ya se encuentra indexado en este curso.')).toBeInTheDocument();
    });

    it("un error de subida queda en la cola y se puede descartar", async () => {
        // Arrange.
        const user = userEvent.setup();
        listDocuments.mockResolvedValue({ total: 0, items: [] });
        uploadDocument.mockRejectedValue(new Error("boom"));
        const { container } = renderManager();
        await user.selectOptions(await screen.findByLabelText("Unidad del aula"), "0");
        await user.upload(container.querySelector('input[type="file"]'), new File(["%PDF"], "malo.pdf", { type: "application/pdf" }));

        // Act.
        await user.click(await screen.findByRole("button", { name: "Descartar error de malo.pdf" }));

        // Assert.
        expect(screen.queryByRole("button", { name: "Descartar error de malo.pdf" })).not.toBeInTheDocument();
    });

    it("carga más documentos cuando hay más que los mostrados", async () => {
        // Arrange.
        const user = userEvent.setup();
        listDocuments
            .mockResolvedValueOnce({ total: 2, items: [doc("d1", "u1.pdf")] })
            .mockResolvedValueOnce({ total: 2, items: [doc("d2", "u2.pdf")] });
        renderManager({ lang: "en" });

        // Act.
        await user.click(await screen.findByRole("button", { name: "Load more (1 of 2)" }));

        // Assert.
        expect(await screen.findByText("u2.pdf")).toBeInTheDocument();
        expect(listDocuments).toHaveBeenLastCalledWith(4, 30, 1);
    });

    it("si no se pueden cargar los documentos muestra el error", async () => {
        // Arrange.
        listDocuments.mockRejectedValue(new Error("network"));

        // Act.
        renderManager();

        // Assert.
        expect(await screen.findByRole("dialog")).toHaveTextContent(/No se pudieron cargar los documentos/);
    });

    it("navega a las preguntas de alumnos y a la ayuda", async () => {
        // Arrange.
        const user = userEvent.setup();
        listDocuments.mockResolvedValue({ total: 0, items: [] });
        renderManager();
        await screen.findByText("Material indexado (0)");

        // Act.
        await user.click(screen.getByRole("button", { name: /Preguntas de alumnos/ }));
        await screen.findByText("No hay suficientes preguntas registradas en este período.");
        await user.click(screen.getByRole("button", { name: "Sin responder" }));
        const questionsLoaded = await screen.findByText("No hay gaps registrados en este período.");
        await user.click(screen.getByRole("button", { name: /Ayuda/ }));

        // Assert.
        expect(questionsLoaded).toBeTruthy();
        expect(listGaps).toHaveBeenCalled();
        expect(screen.queryByText("Material indexado (0)")).not.toBeInTheDocument();
    });

    it("abre directamente la pestaña pedida por initialTab", async () => {
        // Arrange.
        listDocuments.mockResolvedValue({ total: 0, items: [] });

        // Act.
        renderManager({ initialTab: "questions" });

        // Assert.
        expect(await screen.findByText("No hay suficientes preguntas registradas en este período.")).toBeInTheDocument();
        expect(getFaqTopics).toHaveBeenCalledWith(4, 30);
    });
});
