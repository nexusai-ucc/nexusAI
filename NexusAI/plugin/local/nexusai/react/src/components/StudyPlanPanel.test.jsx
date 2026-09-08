import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudyPlanPanel from "./StudyPlanPanel.jsx";

vi.mock("../api/quiz.js", () => ({
    getStudyPlan: vi.fn(),
    dismissStudyPlanTopic: vi.fn(),
}));
vi.mock("../api/calendar.js", () => ({
    getUpcomingEvents: vi.fn(),
}));
vi.mock("../api/summary.js", () => ({
    getPreExamSummary: vi.fn(),
}));
vi.mock("../api/courseSections.js", () => ({
    listCourseSections: vi.fn(),
}));

import { getStudyPlan, dismissStudyPlanTopic } from "../api/quiz.js";
import { getUpcomingEvents } from "../api/calendar.js";
import { getPreExamSummary } from "../api/summary.js";
import { listCourseSections } from "../api/courseSections.js";

const TOPIC = {
    topic: "Derivadas trigonométricas",
    quiz_error_count: 3,
    gap_count: 1,
    reason: "Fallaste 3 preguntas de práctica.",
    suggested_quiz_topic: "derivadas trigonométricas",
    quiz_error_ids: ["qe-1", "qe-2", "qe-3"],
    gap_question_ids: ["gq-1"],
};

beforeEach(() => {
    vi.clearAllMocks();
    listCourseSections.mockResolvedValue([]);
});

describe("StudyPlanPanel — carga inicial", () => {
    it("shows a loading spinner before the plan resolves", async () => {
        let resolvePlan;
        getStudyPlan.mockReturnValue(new Promise((r) => { resolvePlan = r; }));
        getUpcomingEvents.mockResolvedValue([]);

        const { container } = render(<StudyPlanPanel courseId={5} />);
        expect(container.querySelector(".nexusai-studyplan--loading")).not.toBeNull();

        resolvePlan({ topics: [] });
        await waitFor(() => expect(container.querySelector(".nexusai-studyplan--loading")).toBeNull());
    });

    it("shows the error state when getStudyPlan fails", async () => {
        getStudyPlan.mockRejectedValue(new Error("boom"));
        getUpcomingEvents.mockResolvedValue([]);

        render(<StudyPlanPanel courseId={5} />);

        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar tu plan de estudio.");
    });

    it("still renders the study plan when the calendar call fails (isolated fetches)", async () => {
        getStudyPlan.mockResolvedValue({ topics: [TOPIC] });
        getUpcomingEvents.mockRejectedValue(new Error("no enrolment in this course"));

        render(<StudyPlanPanel courseId={5} />);

        expect(await screen.findByText("Derivadas trigonométricas")).toBeInTheDocument();
        // El banner de calendario simplemente no aparece — no hay error visible por esto.
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the empty state when there are no pending topics", async () => {
        getStudyPlan.mockResolvedValue({ topics: [] });
        getUpcomingEvents.mockResolvedValue([]);

        render(<StudyPlanPanel courseId={5} />);

        expect(await screen.findByText("¡Vas bien!")).toBeInTheDocument();
    });
});

describe("StudyPlanPanel — banner de calendario", () => {
    it("shows the upcoming-event banner phrased for today when timesort is now", async () => {
        getStudyPlan.mockResolvedValue({ topics: [] });
        getUpcomingEvents.mockResolvedValue([{ name: "Entrega TP2", timesort: Math.floor(Date.now() / 1000) }]);

        render(<StudyPlanPanel courseId={5} />);

        expect(await screen.findByText("Entrega TP2 es hoy")).toBeInTheDocument();
    });
});

describe("StudyPlanPanel — temas del plan", () => {
    it("calls onPracticeTopic with the suggested quiz topic when 'Practicar este tema' is clicked", async () => {
        getStudyPlan.mockResolvedValue({ topics: [TOPIC] });
        getUpcomingEvents.mockResolvedValue([]);
        const onPracticeTopic = vi.fn();
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} onPracticeTopic={onPracticeTopic} />);
        await screen.findByText("Derivadas trigonométricas");

        await user.click(screen.getByRole("button", { name: /^Practicar este tema/ }));

        expect(onPracticeTopic).toHaveBeenCalledWith("derivadas trigonométricas");
    });

    it("dismisses a topic by its underlying row ids and removes it from the list on success", async () => {
        getStudyPlan.mockResolvedValue({ topics: [TOPIC] });
        getUpcomingEvents.mockResolvedValue([]);
        dismissStudyPlanTopic.mockResolvedValue({ affected: 4 });
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} />);
        await screen.findByText("Derivadas trigonométricas");

        await user.click(screen.getByRole("button", { name: /^Ya lo entendí/ }));

        expect(dismissStudyPlanTopic).toHaveBeenCalledWith(5, ["qe-1", "qe-2", "qe-3"], ["gq-1"]);
        await waitFor(() => expect(screen.queryByText("Derivadas trigonométricas")).not.toBeInTheDocument());
    });

    it("keeps the topic visible if dismissing fails, so the student can retry", async () => {
        getStudyPlan.mockResolvedValue({ topics: [TOPIC] });
        getUpcomingEvents.mockResolvedValue([]);
        dismissStudyPlanTopic.mockRejectedValue(new Error("network error"));
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} />);
        await screen.findByText("Derivadas trigonométricas");

        await user.click(screen.getByRole("button", { name: /^Ya lo entendí/ }));

        await waitFor(() => expect(screen.getByRole("button", { name: /^Ya lo entendí/ })).toBeEnabled());
        expect(screen.getByText("Derivadas trigonométricas")).toBeInTheDocument();
    });
});

describe("StudyPlanPanel — resumen de repaso (BUS-04)", () => {
    it("generates a summary for the whole course by default (section = null)", async () => {
        getStudyPlan.mockResolvedValue({ topics: [] });
        getUpcomingEvents.mockResolvedValue([]);
        getPreExamSummary.mockResolvedValue({
            summary: "Texto resumido.",
            total_documents: 2,
            documents_used: [{ filename: "a.pdf" }, { filename: "b.pdf" }],
        });
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} />);
        await screen.findByText("¡Vas bien!");

        await user.click(screen.getByRole("button", { name: "Generar resumen" }));

        expect(getPreExamSummary).toHaveBeenCalledWith(5, null);
        expect(await screen.findByText("Texto resumido.")).toBeInTheDocument();
        expect(screen.getByText(/Basado en 2 documentos: a.pdf, b.pdf/)).toBeInTheDocument();
    });

    it("shows the review-empty message when the backend has no material to summarize", async () => {
        getStudyPlan.mockResolvedValue({ topics: [] });
        getUpcomingEvents.mockResolvedValue([]);
        getPreExamSummary.mockResolvedValue({ summary: null });
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} />);
        await screen.findByText("¡Vas bien!");

        await user.click(screen.getByRole("button", { name: "Generar resumen" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(/No hay material indexado/);
    });

    it("sends the selected section number when the student picks one from the dropdown", async () => {
        getStudyPlan.mockResolvedValue({ topics: [] });
        getUpcomingEvents.mockResolvedValue([]);
        listCourseSections.mockResolvedValue([{ section: 2, name: "Unidad 2" }]);
        getPreExamSummary.mockResolvedValue({ summary: "ok", total_documents: 1, documents_used: [{ filename: "x.pdf" }] });
        const user = userEvent.setup();

        render(<StudyPlanPanel courseId={5} />);
        await screen.findByText("¡Vas bien!");

        const select = await screen.findByDisplayValue("Todo el curso");
        await user.selectOptions(select, "2");
        await user.click(screen.getByRole("button", { name: "Generar resumen" }));

        expect(getPreExamSummary).toHaveBeenCalledWith(5, 2);
    });
});
