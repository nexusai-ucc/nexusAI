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

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TypingIndicator from "./TypingIndicator.jsx";

describe("TypingIndicator", () => {
    it("labels the indicator in English when lang is 'en'", () => {
        render(<TypingIndicator lang="en" />);
        expect(screen.getByLabelText("The assistant is typing")).toBeTruthy();
    });

    it("labels the indicator in Spanish by default and for lang 'es'", () => {
        const { unmount } = render(<TypingIndicator />);
        expect(screen.getByLabelText("El asistente está escribiendo")).toBeTruthy();
        unmount();
        render(<TypingIndicator lang="es" />);
        expect(screen.getByLabelText("El asistente está escribiendo")).toBeTruthy();
    });
});
