import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import BudgetBar from "./BudgetBar.jsx";

function status(percent, remaining, questions = 12) {
    return {
        role: "student",
        source: "backend",
        hourly: { limit: 8000, used: 0, remaining: 8000, percentused: 0, resetsinsec: 600, questionsleft: 40 },
        daily: { limit: 40000, used: 40000 - remaining, remaining, percentused: percent, resetsinsec: 3600, questionsleft: questions },
    };
}

describe("BudgetBar (DATA-05)", () => {
    it("shows the approximate questions left", async () => {
        render(<BudgetBar courseId={3} fetchStatus={vi.fn().mockResolvedValue(status(20, 32000))} />);
        expect(await screen.findByText("Te quedan unas 12 preguntas hoy")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
    });

    it("warns from 80%", async () => {
        render(<BudgetBar courseId={3} fetchStatus={vi.fn().mockResolvedValue(status(85, 6000, 3))} />);
        expect(await screen.findByText(/Usaste el 85% del límite de hoy/)).toBeInTheDocument();
    });

    it("says when the limit renews once it is used up", async () => {
        render(<BudgetBar courseId={3} fetchStatus={vi.fn().mockResolvedValue(status(100, 0, 0))} />);
        expect(await screen.findByText(/Llegaste al límite. Se renueva a las/)).toBeInTheDocument();
    });

    it("shows nothing when there is no status (outside Moodle or error)", async () => {
        const fetch = vi.fn().mockResolvedValue(null);
        const { container } = render(<BudgetBar courseId={3} fetchStatus={fetch} />);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });

    it("asks again when refreshKey changes", async () => {
        const fetch = vi.fn().mockResolvedValue(status(10, 36000));
        const { rerender } = render(<BudgetBar courseId={3} refreshKey={0} fetchStatus={fetch} />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        rerender(<BudgetBar courseId={3} refreshKey={1} fetchStatus={fetch} />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    });
});
