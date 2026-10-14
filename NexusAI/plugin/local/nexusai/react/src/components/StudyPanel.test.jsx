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
import { render, screen } from "@testing-library/react";
import StudyPanel from "./StudyPanel.jsx";

vi.mock("../api/quiz.js", () => ({
    getStudyStreak: vi.fn(),
}));
// StudyPlanPanel/QuizPanel/ReviewPanel tienen sus propias dependencias
// pesadas (varios api/*.js) — se mockean para aislar la lógica propia de
// StudyPanel (la racha), no la de los hijos.
vi.mock("./QuizPanel.jsx", () => ({ default: () => <div>QuizPanel mock</div> }));
vi.mock("./ReviewPanel.jsx", () => ({ default: () => <div>ReviewPanel mock</div> }));
vi.mock("./StudyPlanPanel.jsx", () => ({ default: () => <div>StudyPlanPanel mock</div> }));

import { getStudyStreak } from "../api/quiz.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("StudyPanel — racha de estudio (SP-16, #354)", () => {
    it("shows the streak banner when current_streak > 0", async () => {
        getStudyStreak.mockResolvedValue({ current_streak: 3, practiced_today: true });

        render(<StudyPanel courseId={5} />);

        expect(await screen.findByText("3 días seguidos")).toBeInTheDocument();
    });

    it("uses the singular form for a 1-day streak", async () => {
        getStudyStreak.mockResolvedValue({ current_streak: 1, practiced_today: true });

        render(<StudyPanel courseId={5} />);

        expect(await screen.findByText("1 día seguido")).toBeInTheDocument();
    });

    it("hides the streak banner when current_streak is 0", async () => {
        getStudyStreak.mockResolvedValue({ current_streak: 0, practiced_today: false });

        render(<StudyPanel courseId={5} />);

        await screen.findByText("StudyPlanPanel mock");
        expect(screen.queryByText(/seguido/)).not.toBeInTheDocument();
    });

    it("does not break the rest of the panel if the streak fetch fails", async () => {
        getStudyStreak.mockRejectedValue(new Error("network down"));

        render(<StudyPanel courseId={5} />);

        expect(await screen.findByText("StudyPlanPanel mock")).toBeInTheDocument();
        expect(screen.queryByText(/seguido/)).not.toBeInTheDocument();
    });
});
