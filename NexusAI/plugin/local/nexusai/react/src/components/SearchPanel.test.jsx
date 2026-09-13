import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPanel from "./SearchPanel.jsx";

vi.mock("../api/search.js", () => ({
    searchMaterial: vi.fn(),
}));
vi.mock("../api/summary.js", () => ({
    summarizeDocument: vi.fn(),
}));
vi.mock("../api/courseSections.js", () => ({
    listCourseSections: vi.fn(),
}));

import { searchMaterial } from "../api/search.js";
import { listCourseSections } from "../api/courseSections.js";

const RESULT = {
    query: "derivadas",
    total: 1,
    results: [
        { document_filename: "apunte1.pdf", chunk_index: 0, content: "Una derivada mide el cambio.", document_id: "doc-1", mime_type: "application/pdf" },
    ],
};
const EMPTY_RESULT = { query: "algo raro", total: 0, results: [] };

beforeEach(() => {
    vi.clearAllMocks();
    listCourseSections.mockResolvedValue([]);
    localStorage.clear();
});

describe("SearchPanel — historial de búsquedas recientes (BUS-06, #361)", () => {
    it("does not show any recent-searches list before the first search", () => {
        render(<SearchPanel courseId={5} sesskey="abc" />);
        expect(screen.queryByText("Búsquedas recientes")).not.toBeInTheDocument();
    });

    it("saves a successful search and offers it as a suggestion when the input is refocused empty", async () => {
        searchMaterial.mockResolvedValue(RESULT);
        const user = userEvent.setup();
        render(<SearchPanel courseId={5} sesskey="abc" />);

        await user.type(screen.getByPlaceholderText("Buscá en el material del curso..."), "derivadas");
        await user.click(screen.getByRole("button", { name: "Buscar" }));
        await waitFor(() => expect(searchMaterial).toHaveBeenCalledTimes(1));

        // Limpiar el input y reenfocarlo — deberían aparecer las sugerencias.
        const input = screen.getByPlaceholderText("Buscá en el material del curso...");
        await user.clear(input);
        await user.click(input);

        expect(await screen.findByText("Búsquedas recientes")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "derivadas" })).toBeInTheDocument();
    });

    it("clicking a recent search re-runs it immediately", async () => {
        searchMaterial.mockResolvedValue(RESULT);
        const user = userEvent.setup();
        render(<SearchPanel courseId={5} sesskey="abc" />);

        const input = screen.getByPlaceholderText("Buscá en el material del curso...");
        await user.type(input, "derivadas");
        await user.click(screen.getByRole("button", { name: "Buscar" }));
        await waitFor(() => expect(searchMaterial).toHaveBeenCalledTimes(1));

        await user.clear(input);
        await user.click(input);
        await user.click(await screen.findByRole("button", { name: "derivadas" }));

        await waitFor(() => expect(searchMaterial).toHaveBeenCalledTimes(2));
        expect(searchMaterial).toHaveBeenLastCalledWith(expect.objectContaining({ query: "derivadas" }));
    });

    it("does not mix recent-search history between different courses", async () => {
        searchMaterial.mockResolvedValue(RESULT);
        const user = userEvent.setup();
        const { unmount } = render(<SearchPanel courseId={1} sesskey="abc" />);

        await user.type(screen.getByPlaceholderText("Buscá en el material del curso..."), "curso uno");
        await user.click(screen.getByRole("button", { name: "Buscar" }));
        await waitFor(() => expect(searchMaterial).toHaveBeenCalledTimes(1));
        unmount();

        render(<SearchPanel courseId={2} sesskey="abc" />);
        await user.click(screen.getByPlaceholderText("Buscá en el material del curso..."));

        expect(screen.queryByText("Búsquedas recientes")).not.toBeInTheDocument();
    });

    it("does not break rendering when localStorage throws (blocked/private mode)", async () => {
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = () => { throw new Error("blocked"); };
        try {
            expect(() => render(<SearchPanel courseId={5} sesskey="abc" />)).not.toThrow();
        } finally {
            Storage.prototype.getItem = originalGetItem;
        }
    });
});

describe("SearchPanel — estado vacío accionable (BUS-07, #362)", () => {
    it("shows an 'ask the assistant' button on zero results and calls onGoToChat when clicked", async () => {
        searchMaterial.mockResolvedValue(EMPTY_RESULT);
        const onGoToChat = vi.fn();
        const user = userEvent.setup();
        render(<SearchPanel courseId={5} sesskey="abc" onGoToChat={onGoToChat} />);

        await user.type(screen.getByPlaceholderText("Buscá en el material del curso..."), "algo raro");
        await user.click(screen.getByRole("button", { name: "Buscar" }));

        const cta = await screen.findByRole("button", { name: "Preguntarle al asistente" });
        await user.click(cta);

        expect(onGoToChat).toHaveBeenCalledTimes(1);
    });

    it("does not render the CTA button when onGoToChat is not provided", async () => {
        searchMaterial.mockResolvedValue(EMPTY_RESULT);
        const user = userEvent.setup();
        render(<SearchPanel courseId={5} sesskey="abc" />);

        await user.type(screen.getByPlaceholderText("Buscá en el material del curso..."), "algo raro");
        await user.click(screen.getByRole("button", { name: "Buscar" }));

        await screen.findByText(/No se encontraron resultados/);
        expect(screen.queryByRole("button", { name: "Preguntarle al asistente" })).not.toBeInTheDocument();
    });
});
