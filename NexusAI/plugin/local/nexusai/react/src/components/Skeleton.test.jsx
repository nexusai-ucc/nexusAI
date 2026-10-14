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
import { render } from "@testing-library/react";
import Skeleton, { SkeletonScreen, SkeletonText } from "./Skeleton.jsx";

// UX-12 (#370): el skeleton reemplaza al spinner centrado genérico. Estos
// tests fijan el contrato mínimo: bloques con la clase de shimmer + un
// texto sr-only que anuncia la carga a lectores de pantalla.

describe("Skeleton", () => {
    it("renders a shimmer block that is hidden from assistive tech", () => {
        const { container } = render(<Skeleton width={40} height={12} />);
        const block = container.querySelector(".nexusai-skeleton");
        expect(block).toBeInTheDocument();
        expect(block).toHaveAttribute("aria-hidden", "true");
        expect(block).toHaveStyle({ width: "40px", height: "12px" });
    });

    it("SkeletonText renders the requested number of lines", () => {
        const { container } = render(<SkeletonText lines={4} />);
        expect(container.querySelectorAll(".nexusai-skeleton")).toHaveLength(4);
    });

    it("SkeletonScreen exposes the loading label to screen readers", () => {
        const { getByText, container } = render(
            <SkeletonScreen label="Cargando analytics...">
                <Skeleton />
            </SkeletonScreen>
        );
        expect(container.querySelector('[role="status"]')).toBeInTheDocument();
        expect(getByText("Cargando analytics...")).toHaveClass("nexusai-sr-only");
    });
});
