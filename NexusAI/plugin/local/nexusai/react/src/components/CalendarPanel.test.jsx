import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarPanel, { buildMonthGrid } from "./CalendarPanel.jsx";

vi.mock("../api/calendar.js", () => ({
    getUpcomingEvents: vi.fn(),
}));
vi.mock("../api/calendarAlerts.js", () => ({
    listCalendarAlerts: vi.fn(),
    saveCalendarAlert: vi.fn(),
    getCalendarFeedUrl: vi.fn(),
    revokeCalendarFeed: vi.fn(),
}));

import { getUpcomingEvents } from "../api/calendar.js";
import { listCalendarAlerts, getCalendarFeedUrl } from "../api/calendarAlerts.js";

function unixSecondsOn(year, month, day) {
    return Math.floor(new Date(year, month, day, 10, 0, 0).getTime() / 1000);
}

beforeEach(() => {
    vi.clearAllMocks();
    listCalendarAlerts.mockResolvedValue([]);
    window.open = vi.fn();
});

describe("buildMonthGrid — CAL-05 (#364)", () => {
    it("returns 6 weeks of 7 days each, Monday first", () => {
        const weeks = buildMonthGrid(2026, 8, []); // septiembre 2026 (mes 0-indexed)
        expect(weeks).toHaveLength(6);
        weeks.forEach((w) => expect(w).toHaveLength(7));
        // 1/9/2026 es martes -> la primera celda de la primera semana es lunes 31/8.
        expect(weeks[0][0].date.getDate()).toBe(31);
        expect(weeks[0][0].inMonth).toBe(false);
        expect(weeks[0][1].date.getDate()).toBe(1);
        expect(weeks[0][1].inMonth).toBe(true);
    });

    it("groups events by calendar day, ignoring the time component", () => {
        const events = [
            { id: 1, name: "Entrega TP1", timesort: unixSecondsOn(2026, 8, 10), component: "mod_assign" },
            { id: 2, name: "Otra cosa el mismo día", timesort: unixSecondsOn(2026, 8, 10), component: "mod_quiz" },
            { id: 3, name: "Examen", timesort: unixSecondsOn(2026, 8, 15), component: "mod_quiz" },
        ];
        const weeks = buildMonthGrid(2026, 8, events);
        const allCells = weeks.flat();
        const day10 = allCells.find((c) => c.inMonth && c.date.getDate() === 10);
        const day15 = allCells.find((c) => c.inMonth && c.date.getDate() === 15);
        const day11 = allCells.find((c) => c.inMonth && c.date.getDate() === 11);

        expect(day10.events).toHaveLength(2);
        expect(day15.events).toHaveLength(1);
        expect(day11.events).toHaveLength(0);
    });

    it("marks exactly one cell as today", () => {
        const now = new Date();
        const weeks = buildMonthGrid(now.getFullYear(), now.getMonth(), []);
        const todayCells = weeks.flat().filter((c) => c.isToday);
        expect(todayCells).toHaveLength(1);
        expect(todayCells[0].date.getDate()).toBe(now.getDate());
    });
});

describe("CalendarPanel — vista de mes en grilla (CAL-05, #364)", () => {
    it("shows the same events in the grid as in the list when toggled", async () => {
        const today = new Date();
        getUpcomingEvents.mockResolvedValue([
            { id: 1, name: "Entrega TP1", timesort: Math.floor(today.getTime() / 1000), timestart: Math.floor(today.getTime() / 1000), component: "mod_assign", url: "https://x" },
        ]);
        const user = userEvent.setup();
        render(<CalendarPanel courseId={5} />);

        expect(await screen.findByText("Entrega TP1")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Mes" }));

        // La lista deja de estar, pero el evento sigue presente como tooltip
        // del día (title nativo) — se verifica vía el cell con ese title.
        expect(screen.queryByText("Entrega TP1")).not.toBeInTheDocument();
        const cellWithEvent = document.querySelector(`[title="Entrega TP1"]`);
        expect(cellWithEvent).not.toBeNull();
    });

    it("navigates between months without re-fetching events", async () => {
        getUpcomingEvents.mockResolvedValue([]);
        const user = userEvent.setup();
        render(<CalendarPanel courseId={5} />);

        await waitFor(() => expect(getUpcomingEvents).toHaveBeenCalledTimes(1));
        await user.click(await screen.findByRole("button", { name: "Mes" }));

        const monthLabel = document.querySelector(".nexusai-calendar__grid-monthlabel").textContent;
        await user.click(screen.getByRole("button", { name: "Mes siguiente" }));

        const nextMonthLabel = document.querySelector(".nexusai-calendar__grid-monthlabel").textContent;
        expect(nextMonthLabel).not.toBe(monthLabel);
        expect(getUpcomingEvents).toHaveBeenCalledTimes(1); // sin fetch nuevo al navegar
    });
});

describe("CalendarPanel — exportar a .ics (CAL-06, #365)", () => {
    it("fetches the feed URL and opens it with download=1", async () => {
        getUpcomingEvents.mockResolvedValue([]);
        getCalendarFeedUrl.mockResolvedValue("https://moodle.example/local/nexusai/calendar_feed.php?token=abc&course=5");
        const user = userEvent.setup();
        render(<CalendarPanel courseId={5} />);

        await user.click(await screen.findByRole("button", { name: /Exportar a \.ics/ }));

        await waitFor(() => expect(getCalendarFeedUrl).toHaveBeenCalledWith(5));
        expect(window.open).toHaveBeenCalledWith(
            "https://moodle.example/local/nexusai/calendar_feed.php?token=abc&course=5&download=1",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("reuses the cached feed URL instead of fetching it twice", async () => {
        getUpcomingEvents.mockResolvedValue([]);
        getCalendarFeedUrl.mockResolvedValue("https://moodle.example/calendar_feed.php?token=abc&course=5");
        const user = userEvent.setup();
        render(<CalendarPanel courseId={5} />);

        const exportBtn = await screen.findByRole("button", { name: /Exportar a \.ics/ });
        await user.click(exportBtn);
        await waitFor(() => expect(window.open).toHaveBeenCalledTimes(1));

        await user.click(exportBtn);
        await waitFor(() => expect(window.open).toHaveBeenCalledTimes(2));

        expect(getCalendarFeedUrl).toHaveBeenCalledTimes(1);
    });
});
