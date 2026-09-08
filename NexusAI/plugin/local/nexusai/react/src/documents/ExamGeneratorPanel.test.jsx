import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExamGeneratorPanel from "./ExamGeneratorPanel.jsx";

vi.mock("./api.js", () => ({
    listDocuments: vi.fn(),
    listGaps: vi.fn(),
    getFaqTopics: vi.fn(),
}));
vi.mock("../api/quiz.js", () => ({
    generateExam: vi.fn(),
}));
vi.mock("./gift.js", () => ({
    downloadGiftFile: vi.fn(),
}));

import { listDocuments, listGaps, getFaqTopics } from "./api.js";
import { generateExam } from "../api/quiz.js";
import { downloadGiftFile } from "./gift.js";

const DOCS = {
    items: [
        { id: "doc-1", filename: "apunte1.pdf", status: "indexed" },
        { id: "doc-2", filename: "apunte2.pdf", status: "indexed" },
        { id: "doc-3", filename: "sin-indexar.pdf", status: "pending" },
    ],
};

const EXAM_RESULT = {
    questions: [
        {
            question_type: "multiple_choice",
            question: "¿Qué es una derivada?",
            options: ["A", "B", "C", "D"],
            correct_index: 1,
            explanation: "Porque sí.",
            source_filename: "apunte1.pdf",
        },
    ],
};

beforeEach(() => {
    vi.clearAllMocks();
    listDocuments.mockResolvedValue(DOCS);
    listGaps.mockResolvedValue({ items: [] });
    getFaqTopics.mockResolvedValue({ topics: [] });
    generateExam.mockResolvedValue(EXAM_RESULT);
});

describe("ExamGeneratorPanel — setup wizard", () => {
    it("loads only indexed documents and lets the teacher select some", async () => {
        render(<ExamGeneratorPanel courseId={7} />);

        await waitFor(() => expect(listDocuments).toHaveBeenCalledWith(7));
        expect(await screen.findByText("apunte1.pdf")).toBeInTheDocument();
        expect(screen.getByText("apunte2.pdf")).toBeInTheDocument();
        // El documento no indexado no se ofrece como opción.
        expect(screen.queryByText("sin-indexar.pdf")).not.toBeInTheDocument();
    });

    it("keeps 'Siguiente' disabled until at least one document is selected", async () => {
        const user = userEvent.setup();
        render(<ExamGeneratorPanel courseId={7} />);

        const checkbox = await screen.findByLabelText(/apunte1\.pdf/);
        const nextBtn = screen.getByRole("button", { name: "Siguiente" });
        expect(nextBtn).toBeDisabled();

        await user.click(checkbox);
        expect(nextBtn).toBeEnabled();
    });

    it("advances to the configure step and back", async () => {
        const user = userEvent.setup();
        render(<ExamGeneratorPanel courseId={7} />);

        await user.click(await screen.findByLabelText(/apunte1\.pdf/));
        await user.click(screen.getByRole("button", { name: "Siguiente" }));

        expect(screen.getByText("Configurá el examen")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Atrás" }));
        expect(screen.getByText(/Elegí los archivos/)).toBeInTheDocument();
    });
});

describe("ExamGeneratorPanel — generate + preview", () => {
    async function goToConfigureStep(user) {
        render(<ExamGeneratorPanel courseId={7} />);
        await user.click(await screen.findByLabelText(/apunte1\.pdf/));
        await user.click(screen.getByRole("button", { name: "Siguiente" }));
    }

    it("calls generateExam with the selected document ids and config, then shows the preview", async () => {
        const user = userEvent.setup();
        await goToConfigureStep(user);

        await user.click(screen.getByRole("button", { name: /Generar examen/ }));

        await waitFor(() => expect(generateExam).toHaveBeenCalledTimes(1));
        const args = generateExam.mock.calls[0][0];
        expect(args.courseId).toBe(7);
        expect(args.documentIds).toEqual(["doc-1"]);
        expect(args.questionType).toBe("multiple_choice");
        expect(args.difficulty).toBe("medium");
        expect(args.numQuestions).toBe(10);
        expect(args.focusTopics).toEqual([]); // includeFocusTopics nunca se tildó

        expect(await screen.findByText(/Banco generado \(1 preguntas\)/)).toBeInTheDocument();
        expect(screen.getByDisplayValue("¿Qué es una derivada?")).toBeInTheDocument();
    });

    it("shows a friendly error and lets the teacher go back to setup when generation fails", async () => {
        generateExam.mockRejectedValue(new Error("boom"));
        const user = userEvent.setup();
        await goToConfigureStep(user);

        await user.click(screen.getByRole("button", { name: /Generar examen/ }));

        expect(await screen.findByRole("alert")).toHaveTextContent(/No se pudo generar el examen/);

        await user.click(screen.getByRole("button", { name: "Volver" }));
        expect(screen.getByText(/Elegí los archivos/)).toBeInTheDocument();
    });

    it("removing a question in the preview updates the count and drops it from export", async () => {
        generateExam.mockResolvedValue({
            questions: [
                { ...EXAM_RESULT.questions[0], question: "Pregunta A" },
                { ...EXAM_RESULT.questions[0], question: "Pregunta B" },
            ],
        });
        const user = userEvent.setup();
        await goToConfigureStep(user);
        await user.click(screen.getByRole("button", { name: /Generar examen/ }));

        expect(await screen.findByText(/Banco generado \(2 preguntas\)/)).toBeInTheDocument();

        const removeButtons = screen.getAllByRole("button", { name: "Eliminar pregunta" });
        await user.click(removeButtons[0]);

        expect(screen.getByText(/Banco generado \(1 preguntas\)/)).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Pregunta A")).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("Pregunta B")).toBeInTheDocument();
    });

    it("editing a multiple_choice option text updates that option only", async () => {
        const user = userEvent.setup();
        await goToConfigureStep(user);
        await user.click(screen.getByRole("button", { name: /Generar examen/ }));
        await screen.findByText(/Banco generado/);

        const optionInput = screen.getByDisplayValue("B");
        await user.clear(optionInput);
        await user.type(optionInput, "Opción editada");

        expect(screen.getByDisplayValue("Opción editada")).toBeInTheDocument();
        expect(screen.getByDisplayValue("A")).toBeInTheDocument(); // no se tocó
    });

    it("exports via downloadGiftFile with a course-scoped filename", async () => {
        const user = userEvent.setup();
        await goToConfigureStep(user);
        await user.click(screen.getByRole("button", { name: /Generar examen/ }));
        await screen.findByText(/Banco generado/);

        await user.click(screen.getByRole("button", { name: /Exportar como GIFT/ }));

        expect(downloadGiftFile).toHaveBeenCalledTimes(1);
        const [questionsArg, filenameArg] = downloadGiftFile.mock.calls[0];
        expect(questionsArg).toHaveLength(1);
        expect(filenameArg).toBe("examen-nexusai-curso-7.txt");
    });
});

describe("ExamGeneratorPanel — temas con dificultad detectada (DOC-D09)", () => {
    it("fetches and merges Gaps + FAQ topics only when the checkbox is toggled on, deduped and sorted by count", async () => {
        listGaps.mockResolvedValue({ items: [{ question: "¿Qué es una integral?", count: 5 }] });
        getFaqTopics.mockResolvedValue({
            topics: [
                { topic: "¿Qué es una integral?", count: 1 }, // dup del de gaps, distinto count
                { topic: "Regla de la cadena", count: 9 },
            ],
        });
        const user = userEvent.setup();
        render(<ExamGeneratorPanel courseId={7} />);
        await user.click(await screen.findByLabelText(/apunte1\.pdf/));
        await user.click(screen.getByRole("button", { name: "Siguiente" }));

        expect(listGaps).not.toHaveBeenCalled(); // no se pide hasta tildar el checkbox

        await user.click(screen.getByLabelText(/Incluir temas con dificultad detectada/));

        await waitFor(() => expect(listGaps).toHaveBeenCalledWith(7, 30, 30, false, 0));
        const topicItems = await screen.findAllByRole("listitem");
        const focusLabels = topicItems
            .map((li) => li.textContent)
            .filter((t) => t.includes("Regla de la cadena") || t.includes("¿Qué es una integral?"));
        // Deduplicado a 1 sola entrada de "¿Qué es una integral?" (no 2), y
        // "Regla de la cadena" (count 9) antes que la integral (count 5).
        expect(focusLabels.filter((t) => t.includes("¿Qué es una integral?"))).toHaveLength(1);
        expect(focusLabels[0]).toContain("Regla de la cadena");
    });
});
