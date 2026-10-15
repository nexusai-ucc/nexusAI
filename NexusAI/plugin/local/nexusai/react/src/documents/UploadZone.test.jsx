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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadZone from "./UploadZone.jsx";

describe("UploadZone", () => {
    it("invites to drop files when enabled", () => {
        render(<UploadZone onUpload={vi.fn()} lang="en" />);
        expect(screen.getByText("Drag one or more files here")).toBeInTheDocument();
        expect(screen.getByText("or click to select")).toBeInTheDocument();
    });

    it("says it is uploading only while busy", () => {
        render(<UploadZone onUpload={vi.fn()} busy disabled lang="en" />);
        expect(screen.getByText("Uploading files...")).toBeInTheDocument();
        expect(screen.getByText("Please wait until it finishes")).toBeInTheDocument();
    });

    it("asks for a course unit when disabled without uploading", () => {
        render(<UploadZone onUpload={vi.fn()} disabled lang="en" />);
        expect(screen.getByText("Choose a course unit first")).toBeInTheDocument();
        expect(screen.queryByText("Uploading files...")).not.toBeInTheDocument();
    });

    it("does not open the file picker while disabled", async () => {
        const onUpload = vi.fn();
        render(<UploadZone onUpload={onUpload} disabled lang="en" />);
        await userEvent.click(screen.getByRole("button"));
        expect(onUpload).not.toHaveBeenCalled();
        expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
    });

    it("uses Spanish texts with lang es", () => {
        render(<UploadZone onUpload={vi.fn()} disabled lang="es" />);
        expect(screen.getByText("Primero elegí una unidad del curso")).toBeInTheDocument();
    });
});
