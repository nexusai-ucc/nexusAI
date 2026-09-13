import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printAnalyticsAsPdf, escapeHtml } from "./AnalyticsDashboardPanel.jsx";

// ANALYTICS-03 (#316): tests del helper de exportación a PDF vía
// window.print(), mismo esqueleto que QuizPanel.print.test.jsx (SP-17).

const REPORT = {
    courseName: "Inteligencia Artificial I",
    days: 30,
    topQueries: [{ question: "¿qué entra en el parcial?", count: 6 }],
    dailyCounts: [
        { date: "2026-09-01", message_count: 4 },
        { date: "2026-09-02", message_count: 8 },
    ],
    maxDaily: 8,
    quizDist: {
        total_attempts: 10,
        average_score: 0.75,
        buckets: [
            { range: "0-20", count: 0 },
            { range: "80-100", count: 4 },
        ],
    },
    maxBucket: 4,
    ratioPct: 10,
    gapsRatio: { gaps_detected: 3, questions_answered: 27, ratio: 0.1 },
    feedbackRatio: { helpful_count: 8, total_rated: 10, useful_pct: 80 },
};

function fakeWindow() {
    return {
        document: { write: vi.fn(), close: vi.fn() },
        focus: vi.fn(),
        print: vi.fn(),
    };
}

describe("escapeHtml", () => {
    it("escapes HTML-significant characters", () => {
        expect(escapeHtml("<b>x</b>")).not.toContain("<b>");
    });

    it("returns an empty string for null/undefined", () => {
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
});

describe("printAnalyticsAsPdf — ANALYTICS-03 (#316)", () => {
    let win;
    let openSpy;

    beforeEach(() => {
        win = fakeWindow();
        openSpy = vi.spyOn(window, "open").mockReturnValue(win);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("opens a new window and triggers print()", () => {
        printAnalyticsAsPdf(REPORT);

        expect(openSpy).toHaveBeenCalledWith("", "_blank");
        expect(win.document.write).toHaveBeenCalledTimes(1);
        expect(win.document.close).toHaveBeenCalledTimes(1);
        expect(win.print).toHaveBeenCalledTimes(1);
    });

    it("includes the course name and the active days-filter label", () => {
        printAnalyticsAsPdf(REPORT);

        const html = win.document.write.mock.calls[0][0];
        expect(html).toContain("Inteligencia Artificial I");
        expect(html).toContain("Último mes");
    });

    it("includes the visible numeric values (average score, gaps ratio, feedback)", () => {
        printAnalyticsAsPdf(REPORT);

        const html = win.document.write.mock.calls[0][0];
        expect(html).toContain("0.8"); // average_score.toFixed(1)
        expect(html).toContain("10%"); // ratioPct
        expect(html).toContain("80%"); // feedbackRatio.useful_pct
        expect(html).toContain("¿qué entra en el parcial?");
    });

    it("falls back to a generic title when there is no course name", () => {
        printAnalyticsAsPdf({ ...REPORT, courseName: "" });

        const html = win.document.write.mock.calls[0][0];
        expect(html).toContain("Reporte de Analytics");
    });

    it("does nothing (no throw) when the popup is blocked", () => {
        openSpy.mockReturnValue(null);
        expect(() => printAnalyticsAsPdf(REPORT)).not.toThrow();
    });
});
