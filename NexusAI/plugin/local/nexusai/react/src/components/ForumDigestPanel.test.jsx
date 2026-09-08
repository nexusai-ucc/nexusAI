import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ForumDigestPanel from "./ForumDigestPanel.jsx";

vi.mock("../api/forumDigest.js", () => ({
    getWeeklyDigest: vi.fn(),
}));

import { getWeeklyDigest } from "../api/forumDigest.js";

const DIGEST_WITH_ACTIVITY = {
    course_id: 5,
    period_days: 7,
    discussion_count: 2,
    discussions: [
        {
            discussion_id: 1,
            discussion_name: "No entiendo nada del parcial",
            forum_name: "Consultas generales",
            post_count: 3,
            urgent: true,
        },
        {
            discussion_id: 2,
            discussion_name: "¿Cuándo entrega el TP2?",
            forum_name: "Consultas generales",
            post_count: 2,
            urgent: false,
        },
    ],
    summary: "Resumen de la semana con un hilo urgente.",
};

const DIGEST_EMPTY = {
    course_id: 5,
    period_days: 7,
    discussion_count: 0,
    discussions: [],
    summary: null,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ForumDigestPanel — resumen semanal (FOR-06, #367)", () => {
    it("shows a loading state before the response resolves", async () => {
        let resolvePromise;
        getWeeklyDigest.mockReturnValue(new Promise((r) => { resolvePromise = r; }));

        const { container } = render(<ForumDigestPanel courseId={5} />);
        expect(container.querySelector(".nexusai-quiz__spinner")).not.toBeNull();

        resolvePromise(DIGEST_EMPTY);
        await waitFor(() => expect(container.querySelector(".nexusai-quiz__spinner")).toBeNull());
    });

    it("shows a friendly error message when the fetch fails", async () => {
        getWeeklyDigest.mockRejectedValue(new Error("network down"));

        render(<ForumDigestPanel courseId={5} />);

        expect(await screen.findByRole("alert")).toBeInTheDocument();
    });

    it("shows the empty-state message when there is no activity in the window", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_EMPTY);

        render(<ForumDigestPanel courseId={5} />);

        expect(await screen.findByText("No hubo actividad nueva en el foro esta semana.")).toBeInTheDocument();
    });

    it("fetches a 7-day window", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_EMPTY);

        render(<ForumDigestPanel courseId={5} />);

        await waitFor(() => expect(getWeeklyDigest).toHaveBeenCalledWith(5, 7));
    });

    it("renders the LLM summary and one item per discussion", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_WITH_ACTIVITY);

        render(<ForumDigestPanel courseId={5} />);

        expect(await screen.findByText("Resumen de la semana con un hilo urgente.")).toBeInTheDocument();
        expect(screen.getByText("No entiendo nada del parcial")).toBeInTheDocument();
        expect(screen.getByText("¿Cuándo entrega el TP2?")).toBeInTheDocument();
        expect(screen.getByText("Consultas generales · 3 posts nuevos")).toBeInTheDocument();
        expect(screen.getByText("Consultas generales · 2 posts nuevos")).toBeInTheDocument();
    });

    it("shows the urgent badge only on discussions flagged as urgent", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_WITH_ACTIVITY);

        render(<ForumDigestPanel courseId={5} />);

        await screen.findByText("No entiendo nada del parcial");
        expect(screen.getAllByText("Parece urgente")).toHaveLength(1);
    });

    it("links to the discussion in Moodle when wwwroot is provided", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_WITH_ACTIVITY);

        render(<ForumDigestPanel courseId={5} wwwroot="https://moodle.example" />);

        const link = await screen.findAllByRole("link", { name: "Ver hilo" });
        expect(link[0]).toHaveAttribute("href", "https://moodle.example/mod/forum/discuss.php?d=1");
    });

    it("does not render discussion links when wwwroot is not provided", async () => {
        getWeeklyDigest.mockResolvedValue(DIGEST_WITH_ACTIVITY);

        render(<ForumDigestPanel courseId={5} />);

        await screen.findByText("No entiendo nada del parcial");
        expect(screen.queryByRole("link", { name: "Ver hilo" })).not.toBeInTheDocument();
    });
});
