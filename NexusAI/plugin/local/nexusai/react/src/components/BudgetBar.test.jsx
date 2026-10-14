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
