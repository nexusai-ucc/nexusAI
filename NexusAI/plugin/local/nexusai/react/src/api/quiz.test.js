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

import { describe, it, expect, afterEach } from "vitest";
import * as quiz from "./quiz.js";
import { installMoodleAjax, uninstallMoodleAjax, ajaxCalls, withFakeTimers } from "../test-utils/moodleAjax.js";

// TPC-05 (#577): cliente de quiz contra un core/ajax falso (camino real dentro
// de Moodle) y sin Moodle (datos mock). Formato AAA; el criterio de cada caso
// está en su nombre.

afterEach(() => {
    uninstallMoodleAjax();
});

describe("quiz API dentro de Moodle", () => {
    // Cada fila: llamada, web service esperado y args esperados.
    const cases = [
        [() => quiz.generateQuiz({ courseId: 4, topic: "Pilas" }), "local_nexusai_quiz_generate",
            { courseid: 4, topic: "Pilas", numquestions: 5, questiontype: "multiple_choice", difficulty: "medium" }],
        [() => quiz.generateExam({ courseId: 4, documentIds: ["d1"] }), "local_nexusai_exam_generate",
            { courseid: 4, documentids: ["d1"], topic: "", numquestions: 10, questiontype: "multiple_choice", difficulty: "medium", topics: [] }],
        [() => quiz.evaluateOpenAnswer({ courseId: 4, question: "q", modelAnswer: "m", userAnswer: "u" }), "local_nexusai_quiz_evaluate",
            { courseid: 4, question: "q", modelanswer: "m", useranswer: "u" }],
        [() => quiz.listQuizErrors(4), "local_nexusai_quiz_errors_list", { courseid: 4, days: 90, limit: 100, offset: 0 }],
        [() => quiz.clearQuizErrors(4), "local_nexusai_quiz_errors_clear", { courseid: 4 }],
        [() => quiz.saveQuizAttempt({ courseId: 4, questionType: "open", totalQuestions: 3, correctCount: 2 }), "local_nexusai_quiz_attempt_save",
            { courseid: 4, questiontype: "open", difficulty: "medium", topic: "", totalquestions: 3, correctcount: 2 }],
        [() => quiz.listQuizAttempts(4, 10, 5), "local_nexusai_quiz_attempt_list", { courseid: 4, days: 10, limit: 5 }],
        [() => quiz.getReviewSuggestions(4), "local_nexusai_quiz_review_suggestions", { courseid: 4, days: 90 }],
        [() => quiz.getStudyPlan(4), "local_nexusai_quiz_study_plan", { courseid: 4, days: 30 }],
        [() => quiz.dismissStudyPlanTopic(4, ["e1"], ["g1"]), "local_nexusai_quiz_study_plan_dismiss",
            { courseid: 4, quizerrorids: ["e1"], gapquestionids: ["g1"] }],
        [() => quiz.getDueFlashcards(4, "Grafos", 3), "local_nexusai_quiz_flashcards_due", { courseid: 4, topic: "Grafos", limit: 3 }],
    ];

    it.each(cases)("%#: llama al web service correcto y devuelve su respuesta", async (call, methodname, args) => {
        // Arrange.
        installMoodleAjax({ [methodname]: { ok: methodname } });

        // Act.
        const result = await call();

        // Assert.
        expect(ajaxCalls).toEqual([{ methodname, args }]);
        expect(result).toEqual({ ok: methodname });
    });

    it("recordQuizErrors normaliza los errores antes de enviarlos", async () => {
        // Arrange.
        installMoodleAjax({ local_nexusai_quiz_errors_record: { stored: 1 } });
        const error = { question_type: "open", question: "¿Qué es?", source_document_id: 7, user_answer: "algo" };

        // Act.
        const result = await quiz.recordQuizErrors({ courseId: 4, errors: [error] });

        // Assert.
        expect(result).toEqual({ stored: 1 });
        expect(ajaxCalls[0].args.errors[0]).toEqual({
            question_type: "open",
            question: "¿Qué es?",
            explanation: "",
            source_filename: null,
            source_document_id: "7",
            options: [],
            correct_index: -1,
            user_selected_index: null,
            user_answer: "algo",
            ai_feedback: null,
            ai_score: null,
        });
    });

    it("DEF-01 (#623): traduce los campos que devuelve Moodle de dificultad, flashcards y racha", async () => {
        // Arrange.
        installMoodleAjax({
            local_nexusai_quiz_suggest_difficulty: { difficulty: "hard", basedonattempts: 4, accuracypct: 90 },
            local_nexusai_quiz_flashcards_summary: { duecount: 2, totalcount: 9 },
            local_nexusai_quiz_streak: { currentstreak: 3, practicedtoday: true },
            local_nexusai_quiz_flashcards_review_batch: { updated: 1 },
        });

        // Act.
        const difficulty = await quiz.suggestDifficulty(4);
        const summary = await quiz.getFlashcardsSummary(4);
        const streak = await quiz.getStudyStreak(4);
        const reviewed = await quiz.submitFlashcardReviews(4, [{ flashcardId: "f1", knewIt: true }]);

        // Assert.
        expect(difficulty).toEqual({ difficulty: "hard", reason: null, based_on_attempts: 4, accuracy_pct: 90 });
        expect(summary).toEqual({ due_count: 2, total_count: 9 });
        expect(streak).toEqual({ current_streak: 3, practiced_today: true });
        expect(reviewed).toEqual({ updated: 1 });
        expect(ajaxCalls.at(-1).args.reviews).toEqual([{ flashcardid: "f1", knewit: true }]);
    });

    it("sin errores ni repasos no llama a Moodle", async () => {
        // Arrange.
        installMoodleAjax({});

        // Act.
        const stored = await quiz.recordQuizErrors({ courseId: 4, errors: [] });
        const reviewed = await quiz.submitFlashcardReviews(4, []);

        // Assert.
        expect(stored).toEqual({ stored: 0 });
        expect(reviewed).toEqual({ updated: 0 });
        expect(ajaxCalls).toHaveLength(0);
    });
});

describe("quiz API fuera de Moodle (mock)", () => {
    it("generateQuiz filtra el mock por tipo y cae a una pregunta si no hay de ese tipo", async () => {
        // Act.
        const tf = await withFakeTimers(() => quiz.generateQuiz({ courseId: 1, questionType: "true_false" }));
        const fill = await withFakeTimers(() => quiz.generateQuiz({ courseId: 1, questionType: "fill_blank" }));
        const mix = await withFakeTimers(() => quiz.generateQuiz({ courseId: 1, questionType: "mix", topic: "X" }));

        // Assert.
        expect(tf.questions.every((q) => q.question_type === "true_false")).toBe(true);
        expect(fill.questions).toHaveLength(1);
        expect(mix.questions.length).toBeGreaterThan(1);
        expect(mix.topic).toBe("X");
    });

    it("generateExam excluye flashcards y reparte los temas foco", async () => {
        // Act.
        const exam = await withFakeTimers(() => quiz.generateExam({
            courseId: 1,
            documentIds: ["d"],
            questionType: "mix",
            focusTopics: [{ label: "Pilas", source: "gap" }],
        }));

        // Assert.
        expect(exam.questions.some((q) => q.question_type === "flashcard")).toBe(false);
        expect(exam.questions[0].source_topic).toBe("Pilas");
    });

    it("evaluateOpenAnswer simula: respuesta larga correcta, corta incorrecta", async () => {
        // Act.
        const long = await withFakeTimers(() => quiz.evaluateOpenAnswer({ courseId: 1, question: "q", modelAnswer: "m", userAnswer: "una respuesta suficientemente larga" }));
        const short = await withFakeTimers(() => quiz.evaluateOpenAnswer({ courseId: 1, question: "q", modelAnswer: "m", userAnswer: "corta" }));

        // Assert.
        expect(long.correct).toBe(true);
        expect(short.correct).toBe(false);
    });

    it("las consultas devuelven valores vacíos o de ejemplo", async () => {
        // Act.
        const results = await withFakeTimers(() => Promise.all([
            quiz.recordQuizErrors({ courseId: 1, errors: [{}] }),
            quiz.listQuizErrors(1),
            quiz.clearQuizErrors(1),
            quiz.saveQuizAttempt({ courseId: 1, questionType: "mix", totalQuestions: 1, correctCount: 1 }),
            quiz.listQuizAttempts(1),
            quiz.getReviewSuggestions(1),
            quiz.getStudyPlan(1),
            quiz.dismissStudyPlanTopic(1, ["a"], ["b", "c"]),
            quiz.suggestDifficulty(1),
            quiz.getFlashcardsSummary(1),
            quiz.getDueFlashcards(1),
            quiz.submitFlashcardReviews(1, [{ flashcardId: "f", knewIt: false }]),
            quiz.getStudyStreak(1),
        ]));

        // Assert.
        const [stored, errors, cleared, saved, attempts, , plan, dismissed, difficulty, , due, , streak] = results;
        expect(stored).toEqual({ stored: 0 });
        expect(errors.total).toBe(0);
        expect(cleared).toEqual({ deleted: 0 });
        expect(saved.id).toBe("mock");
        expect(attempts.total).toBe(2);
        expect(plan.topics).toHaveLength(1);
        expect(dismissed).toEqual({ affected: 3 });
        expect(difficulty.difficulty).toBeNull();
        expect(due.questions).toEqual([]);
        expect(streak).toEqual({ current_streak: 0, practiced_today: false });
    });
});
