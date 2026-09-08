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
