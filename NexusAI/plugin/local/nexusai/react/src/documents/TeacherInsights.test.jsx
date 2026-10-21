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
import GapsPanel from "./GapsPanel.jsx";
import FaqDashboardPanel from "./FaqDashboardPanel.jsx";
import { toCsv, downloadCsvFile } from "./csv.js";

// TPC-05 (#577): paneles de "vacíos de contenido" y "preguntas frecuentes"
// del docente, más el exportador CSV que comparten.

vi.mock("./api.js", () => ({
    listGaps: vi.fn(),
    archiveGap: vi.fn(),
    getFaqTopics: vi.fn(),
}));

import { listGaps, archiveGap, getFaqTopics } from "./api.js";

const HOUR = 3600 * 1000;
const gap = (question, extra = {}) => ({
    question,
    count: 2,
    last_asked_at: new Date(Date.now() - 2 * HOUR).toISOString(),
    avg_similarity: 0.3,
    question_ids: [`id-${question}`],
    is_archived: false,
    ...extra,
});

beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
});

describe("csv", () => {
    it("escapa comas, comillas y saltos de línea, y agrega el BOM de UTF-8", () => {
        // Act.
        const csv = toCsv(["Tema", "Cantidad"], [["Pilas, colas", 3], ['Dijo "hola"', 1], ["dos\nlíneas", null]]);

        // Assert.
        expect(csv.startsWith("﻿")).toBe(true);
        expect(csv).toContain('"Pilas, colas",3');
        expect(csv).toContain('"Dijo ""hola""",1');
        expect(csv).toContain('"dos\nlíneas",');
    });

    it("descarga el archivo con el nombre pedido sin dejar el link en la página", () => {
        // Arrange.
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        // Act.
        downloadCsvFile(["a"], [["1"]], "datos.csv");

        // Assert.
        expect(click).toHaveBeenCalledTimes(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
        expect(document.querySelector("a[download]")).toBeNull();
        click.mockRestore();
    });
});

describe("GapsPanel", () => {
    it("lista las preguntas sin respuesta con su nivel de similitud", async () => {
        // Arrange.
        listGaps.mockResolvedValue({
            total: 3,
            items: [gap("¿Entra el tema 7?", { avg_similarity: null }), gap("¿Hay recuperatorio?", { avg_similarity: 0.1 }), gap("¿Qué es HNSW?", { avg_similarity: 0.6 })],
        });

        // Act.
        render(<GapsPanel courseId={4} />);

        // Assert.
        expect(await screen.findByText("Preguntas sin respuesta (3)")).toBeInTheDocument();
        expect(screen.getByText("sin match")).toBeInTheDocument();
        expect(screen.getByText("match nulo")).toBeInTheDocument();
        expect(screen.getByText("match parcial")).toBeInTheDocument();
        expect(screen.getAllByText("hace 2h")).toHaveLength(3);
        expect(listGaps).toHaveBeenCalledWith(4, 30, 30, false, 0);
    });

    it("cambiar el período o ver archivadas vuelve a pedir los datos", async () => {
        // Arrange.
        const user = userEvent.setup();
        listGaps.mockResolvedValue({ total: 0, items: [] });
        render(<GapsPanel courseId={4} />);
        await screen.findByText("No hay gaps registrados en este período.");

        // Act.
        await user.click(screen.getByRole("button", { name: "Últimos 7 días" }));
        await user.click(screen.getByRole("checkbox"));

        // Assert.
        await waitFor(() => expect(listGaps).toHaveBeenLastCalledWith(4, 7, 30, true, 0));
    });

    it("archivar saca la pregunta de la lista y descuenta el total", async () => {
        // Arrange.
        const user = userEvent.setup();
        listGaps.mockResolvedValue({ total: 2, items: [gap("A"), gap("B")] });
        archiveGap.mockResolvedValue({ affected: 1 });
        render(<GapsPanel courseId={4} />);
        await screen.findByText("Preguntas sin respuesta (2)");

        // Act.
        await user.click(screen.getByRole("button", { name: "Archivar la pregunta: A" }));

        // Assert.
        expect(archiveGap).toHaveBeenCalledWith(4, ["id-A"], true);
        expect(await screen.findByText("Preguntas sin respuesta (1)")).toBeInTheDocument();
        expect(screen.queryByText(/“A”/)).not.toBeInTheDocument();
    });

    it("con archivadas visibles, desarchivar solo cambia la marca", async () => {
        // Arrange.
        const user = userEvent.setup();
        listGaps.mockResolvedValue({ total: 1, items: [gap("C", { is_archived: true })] });
        archiveGap.mockResolvedValue({ affected: 1 });
        render(<GapsPanel courseId={4} lang="en" />);
        await user.click(await screen.findByRole("checkbox"));
        await screen.findByText("Archived");

        // Act.
        await user.click(screen.getByRole("button", { name: "Unarchive the question: C" }));

        // Assert.
        await waitFor(() => expect(screen.queryByText("Archived")).not.toBeInTheDocument());
        expect(screen.getByText("Unanswered questions (1)")).toBeInTheDocument();
    });

    it("carga más páginas mientras haya más resultados que los mostrados", async () => {
        // Arrange.
        const user = userEvent.setup();
        listGaps
            .mockResolvedValueOnce({ total: 2, items: [gap("Primera")] })
            .mockResolvedValueOnce({ total: 2, items: [gap("Segunda")] });
        render(<GapsPanel courseId={4} />);
        await screen.findByText(/Primera/);

        // Act.
        await user.click(screen.getByRole("button", { name: /Cargar más/ }));

        // Assert.
        expect(await screen.findByText(/Segunda/)).toBeInTheDocument();
        expect(listGaps).toHaveBeenLastCalledWith(4, 30, 30, false, 1);
    });

    it("exporta las preguntas a CSV", async () => {
        // Arrange.
        const user = userEvent.setup();
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        listGaps.mockResolvedValue({ total: 1, items: [gap("Exportame")] });
        render(<GapsPanel courseId={4} />);
        await screen.findByText(/Exportame/);

        // Act.
        await user.click(screen.getByRole("button", { name: /Exportar CSV/ }));

        // Assert.
        expect(click).toHaveBeenCalledTimes(1);
        click.mockRestore();
    });

    it("muestra un error si no se pueden cargar o archivar", async () => {
        // Arrange.
        listGaps.mockRejectedValue(new Error("network"));

        // Act.
        render(<GapsPanel courseId={4} />);

        // Assert.
        expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudieron cargar/);
    });
});

describe("FaqDashboardPanel", () => {
    it("muestra los temas más consultados con sus preguntas de ejemplo", async () => {
        // Arrange.
        getFaqTopics.mockResolvedValue({
            total_questions: 5,
            topics: [{ topic: "Parcial", count: 5, example_questions: ["¿Cuándo es el parcial?"] }],
        });

        // Act.
        render(<FaqDashboardPanel courseId={4} />);

        // Assert.
        expect(await screen.findByText("Temas más consultados (5 preguntas)")).toBeInTheDocument();
        expect(screen.getByText("Parcial")).toBeInTheDocument();
        expect(screen.getByText(/¿Cuándo es el parcial\?/)).toBeInTheDocument();
    });

    it("sin preguntas muestra el estado vacío y el período se puede cambiar", async () => {
        // Arrange.
        const user = userEvent.setup();
        getFaqTopics.mockResolvedValue({ total_questions: 0, topics: [] });
        render(<FaqDashboardPanel courseId={4} lang="en" />);
        await screen.findByText("Not enough questions recorded for this period yet.");

        // Act.
        await user.click(screen.getByRole("button", { name: "Last year" }));

        // Assert.
        await waitFor(() => expect(getFaqTopics).toHaveBeenLastCalledWith(4, 365));
    });

    it("exporta los temas y avisa si falla la carga", async () => {
        // Arrange.
        const user = userEvent.setup();
        const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
        getFaqTopics.mockResolvedValueOnce({ total_questions: 2, topics: [{ topic: "Grafos", count: 2, example_questions: [] }] });
        const { unmount } = render(<FaqDashboardPanel courseId={4} />);
        await screen.findByText("Grafos");

        // Act.
        await user.click(screen.getByRole("button", { name: /Exportar CSV/ }));
        unmount();
        getFaqTopics.mockRejectedValueOnce(new Error("boom"));
        render(<FaqDashboardPanel courseId={4} />);

        // Assert.
        expect(click).toHaveBeenCalledTimes(1);
        expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudieron cargar/);
        click.mockRestore();
    });
});
