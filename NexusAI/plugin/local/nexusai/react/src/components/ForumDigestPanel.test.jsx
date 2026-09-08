import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForumDigestPanel from "./ForumDigestPanel.jsx";

vi.mock("../api/forumDigest.js", () => ({
    getWeeklyDigest: vi.fn(),
    getForumWebhook: vi.fn(),
    saveForumWebhook: vi.fn(),
}));

import { getWeeklyDigest, getForumWebhook, saveForumWebhook } from "../api/forumDigest.js";

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
    getForumWebhook.mockResolvedValue(null);
    saveForumWebhook.mockResolvedValue(null);
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

describe("ForumDigestPanel — webhook externo (FOR-07, #378)", () => {
    beforeEach(() => {
        getWeeklyDigest.mockResolvedValue(DIGEST_EMPTY);
    });

    it("preloads the saved webhook URL on mount", async () => {
        getForumWebhook.mockResolvedValue("https://hooks.slack.com/services/xxx");

        render(<ForumDigestPanel courseId={5} />);

        await waitFor(() => expect(getForumWebhook).toHaveBeenCalledWith(5));
        expect(await screen.findByDisplayValue("https://hooks.slack.com/services/xxx")).toBeInTheDocument();
    });

    it("saves the URL and shows a confirmation", async () => {
        const user = userEvent.setup();
        saveForumWebhook.mockResolvedValue("https://hooks.slack.com/services/yyy");

        render(<ForumDigestPanel courseId={5} />);
        await waitFor(() => expect(getForumWebhook).toHaveBeenCalled());

        const input = screen.getByPlaceholderText("https://hooks.slack.com/services/...");
        await user.type(input, "https://hooks.slack.com/services/yyy");
        await user.click(screen.getByRole("button", { name: "Guardar" }));

        await waitFor(() => expect(saveForumWebhook).toHaveBeenCalledWith(5, "https://hooks.slack.com/services/yyy"));
        expect(await screen.findByText("Guardado")).toBeInTheDocument();
    });

    it("shows an error and does not break the rest of the panel when saving fails", async () => {
        const user = userEvent.setup();
        getWeeklyDigest.mockResolvedValue(DIGEST_WITH_ACTIVITY);
        saveForumWebhook.mockRejectedValue(new Error("network down"));

        render(<ForumDigestPanel courseId={5} />);
        await waitFor(() => expect(getForumWebhook).toHaveBeenCalled());

        const input = screen.getByPlaceholderText("https://hooks.slack.com/services/...");
        await user.type(input, "https://hooks.slack.com/services/zzz");
        await user.click(screen.getByRole("button", { name: "Guardar" }));

        expect(await screen.findByText("No se pudo guardar la URL del webhook.")).toBeInTheDocument();
        // El resto del panel sigue andando — el resumen del digest se ve igual.
        expect(await screen.findByText("Resumen de la semana con un hilo urgente.")).toBeInTheDocument();
    });

    it("disables the save button while the input matches the already-saved value", async () => {
        getForumWebhook.mockResolvedValue("https://hooks.slack.com/services/xxx");

        render(<ForumDigestPanel courseId={5} />);

        await screen.findByDisplayValue("https://hooks.slack.com/services/xxx");
        expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });
});
