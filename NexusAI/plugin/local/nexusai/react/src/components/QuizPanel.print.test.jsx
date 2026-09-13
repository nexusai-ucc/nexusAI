import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printQuizAsPdf, escapeHtml } from "./QuizPanel.jsx";

// SP-17 (#363): tests del helper de exportación a PDF vía window.print(),
// aislado del resto de QuizPanel.jsx (que no tiene test suite propia hoy —
// 1000+ líneas de estado, fuera de alcance de esta issue chica).

const QUIZ = {
    questions: [
        {
            question_type: "multiple_choice",
            question: "¿Cuál es la capital de Francia?",
            options: ["Madrid", "París", "Roma", "Berlín"],
            correct_index: 1,
            explanation: "París es la capital de Francia.",
        },
        {
            question_type: "open",
            question: "Explicá la fotosíntesis.",
            options: [],
            correct_index: -1,
            explanation: "Proceso por el cual las plantas convierten luz en energía.",
        },
    ],
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
        expect(escapeHtml('<script>alert("x")</script>')).not.toContain("<script>");
        expect(escapeHtml("A & B")).toContain("&amp;");
    });

    it("returns an empty string for null/undefined", () => {
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
});

describe("printQuizAsPdf — SP-17 (#363)", () => {
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
        printQuizAsPdf(QUIZ, "Geografía", "es");

        expect(openSpy).toHaveBeenCalledWith("", "_blank");
        expect(win.document.write).toHaveBeenCalledTimes(1);
        expect(win.document.close).toHaveBeenCalledTimes(1);
        expect(win.print).toHaveBeenCalledTimes(1);
    });

    it("never includes the correct answer or the explanation in the printed HTML", () => {
        printQuizAsPdf(QUIZ, "Geografía", "es");

        const html = win.document.write.mock.calls[0][0];
        expect(html).not.toContain("París es la capital de Francia");
        expect(html).not.toContain("Proceso por el cual las plantas");
        // Las opciones de MC/TF se listan, pero sin marcar cuál es la correcta.
        expect(html).toContain("París");
        expect(html).not.toMatch(/class="[^"]*correct[^"]*"/);
    });

    it("renders a blank answer space (no textarea value) for open questions", () => {
        printQuizAsPdf(QUIZ, "Geografía", "es");

        const html = win.document.write.mock.calls[0][0];
        expect(html).toContain("q-answer-space");
    });

    it("uses the given topic as the title, or a fallback when there is none", () => {
        printQuizAsPdf(QUIZ, "Geografía", "es");
        expect(win.document.write.mock.calls[0][0]).toContain("<title>Geografía</title>");

        const win2 = fakeWindow();
        openSpy.mockReturnValue(win2);
        printQuizAsPdf(QUIZ, "", "es");
        expect(win2.document.write.mock.calls[0][0]).toContain("<title>Quiz de práctica</title>");
    });

    it("escapes question/option text to avoid HTML injection from generated content", () => {
        const maliciousQuiz = {
            questions: [
                {
                    question_type: "multiple_choice",
                    question: '<img src=x onerror="alert(1)">',
                    options: ["ok"],
                    correct_index: 0,
                    explanation: "x",
                },
            ],
        };
        printQuizAsPdf(maliciousQuiz, "t", "es");

        const html = win.document.write.mock.calls[0][0];
        expect(html).not.toContain("<img src=x onerror=");
    });

    it("does nothing (no throw) when the popup is blocked", () => {
        openSpy.mockReturnValue(null);
        expect(() => printQuizAsPdf(QUIZ, "Geografía", "es")).not.toThrow();
    });
});
