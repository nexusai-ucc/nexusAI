import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BarChart from "./BarChart.jsx";

// ANALYTICS-04 (#371): tooltip real al hover/foco + soporte de muchos
// puntos de datos (scroll horizontal ya lo maneja el CSS de
// `.nexusai-analytics__bars--daily`, acá se prueba el componente en sí).

const DAILY_ITEMS = [
    { key: "2026-09-01", value: 4, date: "2026-09-01" },
    { key: "2026-09-02", value: 8, date: "2026-09-02" },
];

describe("BarChart", () => {
    it("renders one column per item, with height proportional to maxValue", () => {
        render(
            <BarChart
                variant="daily"
                maxValue={8}
                items={DAILY_ITEMS}
                formatTooltip={(item) => `${item.date}: ${item.value}`}
            />
        );

        const bars = screen.getAllByRole("img");
        expect(bars).toHaveLength(2);
        expect(bars[0]).toHaveStyle({ height: "50%" });
        expect(bars[1]).toHaveStyle({ height: "100%" });
    });

    it("does not show a tooltip until the bar is hovered or focused", () => {
        render(
            <BarChart
                variant="daily"
                maxValue={8}
                items={DAILY_ITEMS}
                formatTooltip={(item) => `${item.date}: ${item.value}`}
            />
        );

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the exact-value tooltip on hover, and hides it again on mouse-leave", () => {
        render(
            <BarChart
                variant="daily"
                maxValue={8}
                items={DAILY_ITEMS}
                formatTooltip={(item) => `${item.date}: ${item.value}`}
            />
        );

        const [firstCol] = document.querySelectorAll(".nexusai-analytics__bar-col");
        fireEvent.mouseEnter(firstCol);
        expect(screen.getByRole("tooltip")).toHaveTextContent("2026-09-01: 4");

        fireEvent.mouseLeave(firstCol);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("shows the tooltip on keyboard focus (accessible without a mouse), and hides it on blur", () => {
        render(
            <BarChart
                variant="daily"
                maxValue={8}
                items={DAILY_ITEMS}
                formatTooltip={(item) => `${item.date}: ${item.value}`}
            />
        );

        const bars = screen.getAllByRole("img");
        fireEvent.focus(bars[1]);
        expect(screen.getByRole("tooltip")).toHaveTextContent("2026-09-02: 8");

        fireEvent.blur(bars[1]);
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("renders many data points (365-day window) without dropping any column, for horizontal scroll", () => {
        const manyItems = Array.from({ length: 365 }, (_, i) => ({
            key: `d${i}`,
            value: i % 10,
            date: `day-${i}`,
        }));

        render(
            <BarChart
                variant="daily"
                maxValue={9}
                items={manyItems}
                formatTooltip={(item) => `${item.date}: ${item.value}`}
            />
        );

        expect(screen.getAllByRole("img")).toHaveLength(365);
    });

    it("renders an optional label under each column (used for quiz-score buckets)", () => {
        render(
            <BarChart
                variant="buckets"
                maxValue={4}
                items={[{ key: "0-20", value: 0, range: "0-20" }, { key: "80-100", value: 4, range: "80-100" }]}
                formatTooltip={(item) => `${item.range}: ${item.value}`}
                formatLabel={(item) => item.range}
            />
        );

        expect(screen.getByText("0-20")).toBeInTheDocument();
        expect(screen.getByText("80-100")).toBeInTheDocument();
    });
});
