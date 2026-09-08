import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyticsDashboardPanel from "./AnalyticsDashboardPanel.jsx";

vi.mock("./api.js", () => ({
    getAnalyticsDashboard: vi.fn(),
}));

import { getAnalyticsDashboard } from "./api.js";

const FULL_DATA = {
    top_queries: [{ question: "¿qué entra en el parcial?", count: 6 }],
    daily_message_counts: [
        { date: "2026-09-01", message_count: 4 },
        { date: "2026-09-02", message_count: 8 },
    ],
    quiz_score_distribution: {
        total_attempts: 10,
        average_score: 0.75,
        buckets: [
            { range: "0-20", count: 0 },
            { range: "20-40", count: 1 },
            { range: "40-60", count: 2 },
            { range: "60-80", count: 3 },
            { range: "80-100", count: 4 },
        ],
    },
    gaps_ratio: { gaps_detected: 3, questions_answered: 27, ratio: 0.1 },
    feedback_ratio: { helpful_count: 8, total_rated: 10, useful_pct: 80 },
    topics_consulted: 5,
};

const EMPTY_DATA = {
    top_queries: [],
    daily_message_counts: [],
    quiz_score_distribution: { total_attempts: 0, average_score: 0, buckets: [] },
    gaps_ratio: { gaps_detected: 0, questions_answered: 0, ratio: 0 },
    feedback_ratio: { helpful_count: 0, total_rated: 0, useful_pct: 0 },
    topics_consulted: 0,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("AnalyticsDashboardPanel — loading & error", () => {
    it("shows a loading state before the response resolves", async () => {
        let resolvePromise;
        getAnalyticsDashboard.mockReturnValue(new Promise((r) => { resolvePromise = r; }));

        render(<AnalyticsDashboardPanel courseId={3} />);
        expect(screen.getByText("Cargando analytics...")).toBeInTheDocument();

        resolvePromise(EMPTY_DATA);
        await waitFor(() => expect(screen.queryByText("Cargando analytics...")).not.toBeInTheDocument());
    });

    it("shows a friendly error message when the fetch fails", async () => {
        getAnalyticsDashboard.mockRejectedValue(new Error("network down"));

        render(<AnalyticsDashboardPanel courseId={3} />);

        expect(await screen.findByRole("alert")).toBeInTheDocument();
    });
});

describe("AnalyticsDashboardPanel — empty state", () => {
    it("shows the empty-state message when every metric is zero, including feedback votes", async () => {
        getAnalyticsDashboard.mockResolvedValue(EMPTY_DATA);

        render(<AnalyticsDashboardPanel courseId={3} />);

        expect(await screen.findByText(/Todavía no hay actividad suficiente/)).toBeInTheDocument();
        expect(screen.queryByText("Quizzes de práctica")).not.toBeInTheDocument();
    });

    it("does NOT show the empty state when only feedback votes are non-zero", async () => {
        getAnalyticsDashboard.mockResolvedValue({ ...EMPTY_DATA, feedback_ratio: { helpful_count: 1, total_rated: 1, useful_pct: 100 } });

        render(<AnalyticsDashboardPanel courseId={3} />);

        expect(await screen.findByText("Quizzes de práctica")).toBeInTheDocument();
        expect(screen.queryByText(/Todavía no hay actividad suficiente/)).not.toBeInTheDocument();
    });
});

describe("AnalyticsDashboardPanel — with data", () => {
    it("renders the stat cards, including the ASIST-01 feedback-ratio card", async () => {
        getAnalyticsDashboard.mockResolvedValue(FULL_DATA);

        render(<AnalyticsDashboardPanel courseId={3} />);

        expect(await screen.findByText("Quizzes de práctica")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument(); // total_attempts
        expect(screen.getByText("80%")).toBeInTheDocument(); // useful_pct
        expect(screen.getByText(/Respuestas útiles \(10 votos\)/)).toBeInTheDocument();
    });

    it("shows an em-dash placeholder for feedback ratio when nobody has voted yet", async () => {
        getAnalyticsDashboard.mockResolvedValue({ ...FULL_DATA, feedback_ratio: { helpful_count: 0, total_rated: 0, useful_pct: 0 } });

        render(<AnalyticsDashboardPanel courseId={3} />);

        await screen.findByText("Quizzes de práctica");
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByText("Respuestas útiles")).toBeInTheDocument(); // sin sufijo "(N votos)"
    });

    it("re-fetches with the new window when a days filter button is clicked", async () => {
        getAnalyticsDashboard.mockResolvedValue(FULL_DATA);
        const user = userEvent.setup();

        render(<AnalyticsDashboardPanel courseId={3} />);
        await waitFor(() => expect(getAnalyticsDashboard).toHaveBeenCalledWith(3, 30));

        await user.click(screen.getByRole("button", { name: "Últimos 7 días" }));

        await waitFor(() => expect(getAnalyticsDashboard).toHaveBeenCalledWith(3, 7));
    });

    // ANALYTICS-04 (#371): con days=365 el gráfico de uso diario tiene un
    // punto por día — todas las columnas deben renderizarse (el scroll
    // horizontal, no el aplastamiento, es lo que las mantiene legibles).
    it("renders one bar per day even with a full year of daily data", async () => {
        const manyDays = {
            ...FULL_DATA,
            daily_message_counts: Array.from({ length: 365 }, (_, i) => ({
                date: `2026-${String((i % 12) + 1).padStart(2, "0")}-01`,
                message_count: i % 15,
            })),
        };
        getAnalyticsDashboard.mockResolvedValue(manyDays);

        render(<AnalyticsDashboardPanel courseId={3} />);

        await screen.findByText("Uso diario");
        const bars = document.querySelectorAll(".nexusai-analytics__bars--daily .nexusai-analytics__bar");
        expect(bars).toHaveLength(365);
    });
});
