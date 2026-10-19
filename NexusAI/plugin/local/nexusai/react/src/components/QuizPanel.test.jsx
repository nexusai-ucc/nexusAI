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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizPanel from "./QuizPanel.jsx";

// TPC-05 (#577): flujo completo del quiz de práctica del alumno: generar,
// responder cada tipo de pregunta, ver el resultado, guardar el intento y
// los errores, flashcards e historial.

vi.mock("../api/quiz.js", () => ({
    generateQuiz: vi.fn(),
    evaluateOpenAnswer: vi.fn(),
    recordQuizErrors: vi.fn(),
    saveQuizAttempt: vi.fn(),
    listQuizAttempts: vi.fn(),
    suggestDifficulty: vi.fn(),
    getFlashcardsSummary: vi.fn(),
    getDueFlashcards: vi.fn(),
    submitFlashcardReviews: vi.fn(),
}));

import {
    generateQuiz, evaluateOpenAnswer, recordQuizErrors, saveQuizAttempt, listQuizAttempts, suggestDifficulty,
    getFlashcardsSummary, getDueFlashcards, submitFlashcardReviews,
} from "../api/quiz.js";

const mc = (question, options, correct) => ({
    question_type: "multiple_choice",
    question,
    options,
    correct_index: correct,
    explanation: `Explicación de ${question}`,
    source_filename: "u1.pdf",
});

beforeEach(() => {
    vi.resetAllMocks();
    suggestDifficulty.mockResolvedValue({ difficulty: null });
    recordQuizErrors.mockResolvedValue({ stored: 0 });
    saveQuizAttempt.mockResolvedValue({ id: "a1" });
    submitFlashcardReviews.mockResolvedValue({ updated: 0 });
    getFlashcardsSummary.mockResolvedValue({ due_count: 0, total_count: 0 });
});

describe("QuizPanel", () => {
    it("opción múltiple: responde, corrige, muestra el resultado y guarda intento y errores", async () => {
        // Arrange.
        const user = userEvent.setup();
        generateQuiz.mockResolvedValue({
            course_id: 4,
            questions: [mc("¿Qué es LIFO?", ["Cola", "Pila"], 1), mc("¿Qué es FIFO?", ["Cola", "Pila"], 0)],
        });
        render(<QuizPanel courseId={4} />);
        await user.type(screen.getByLabelText("Tema (opcional)"), "Estructuras");

        // Act.
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));
        await user.click(await screen.findByRole("button", { name: /Cola/ }));
        await user.click(screen.getByRole("button", { name: "Verificar" }));
        const firstVerdict = await screen.findByText("Incorrecto");
        await user.click(screen.getByRole("button", { name: "Siguiente" }));
        await user.click(await screen.findByRole("button", { name: /Cola/ }));
        await user.click(screen.getByRole("button", { name: "Verificar" }));
        const secondVerdict = await screen.findByText("¡Correcto!");
        await user.click(screen.getByRole("button", { name: "Ver resultado" }));

        // Assert.
        expect(firstVerdict).toBeTruthy();
        expect(secondVerdict).toBeTruthy();
        expect(await screen.findByText("Acertaste 1 de 2")).toBeInTheDocument();
        expect(generateQuiz).toHaveBeenCalledWith({ courseId: 4, topic: "Estructuras", numQuestions: 5, questionType: "multiple_choice", difficulty: "medium" });
        expect(saveQuizAttempt).toHaveBeenCalledWith(expect.objectContaining({ totalQuestions: 2, correctCount: 1, topic: "Estructuras" }));
        await waitFor(() => expect(recordQuizErrors).toHaveBeenCalled());
        expect(recordQuizErrors.mock.calls[0][0].errors[0]).toMatchObject({ question: "¿Qué es LIFO?", user_selected_index: 0 });
    });

    it("al terminar se puede revisar el intento y empezar uno nuevo", async () => {
        // Arrange.
        const user = userEvent.setup();
        generateQuiz.mockResolvedValue({ course_id: 4, questions: [mc("¿2+2?", ["4", "5"], 0)] });
        render(<QuizPanel courseId={4} />);
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));
        await user.click(await screen.findByRole("button", { name: /4/ }));
        await user.click(screen.getByRole("button", { name: "Verificar" }));
        await user.click(screen.getByRole("button", { name: "Ver resultado" }));

        // Act.
        await user.click(await screen.findByRole("button", { name: /Revisar respuestas/ }));
        const reviewTitle = await screen.findByText("Repaso del intento");
        await user.click(screen.getByRole("button", { name: "Volver" }));
        await user.click(await screen.findByRole("button", { name: "Nuevo quiz" }));

        // Assert.
        expect(reviewTitle).toBeTruthy();
        expect(await screen.findByRole("button", { name: "Generar quiz" })).toBeInTheDocument();
    });

    it("pregunta abierta: la IA evalúa la respuesta escrita", async () => {
        // Arrange.
        const user = userEvent.setup();
        generateQuiz.mockResolvedValue({
            course_id: 4,
            questions: [{ question_type: "open", question: "Definí recursión.", options: [], correct_index: -1, explanation: "Función que se llama a sí misma." }],
        });
        evaluateOpenAnswer.mockResolvedValue({ correct: false, score: 0.3, feedback: "Faltó el caso base." });
        render(<QuizPanel courseId={4} />);
        await user.click(screen.getByRole("button", { name: "Preguntas abiertas" }));
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));

        // Act.
        await user.type(await screen.findByPlaceholderText("Escribí tu respuesta aquí..."), "Un bucle infinito");
        await user.click(screen.getByRole("button", { name: "Verificar" }));

        // Assert.
        expect(await screen.findByText(/Faltó el caso base\./)).toBeInTheDocument();
        expect(evaluateOpenAnswer).toHaveBeenCalledWith({
            courseId: 4, question: "Definí recursión.", modelAnswer: "Función que se llama a sí misma.", userAnswer: "Un bucle infinito",
        });
    });

    it("si falla la evaluación de la IA lo informa sin trabar el quiz", async () => {
        // Arrange.
        const user = userEvent.setup();
        generateQuiz.mockResolvedValue({
            course_id: 4,
            questions: [{ question_type: "open", question: "¿Qué es un grafo?", options: [], correct_index: -1, explanation: "Nodos y aristas." }],
        });
        evaluateOpenAnswer.mockRejectedValue(new Error("timeout"));
        render(<QuizPanel courseId={4} />);
        await user.click(screen.getByRole("button", { name: "Preguntas abiertas" }));
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));

        // Act.
        await user.type(await screen.findByPlaceholderText("Escribí tu respuesta aquí..."), "Algo");
        await user.click(screen.getByRole("button", { name: "Verificar" }));

        // Assert.
        expect(await screen.findByText(/Error al evaluar la respuesta/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Ver resultado" })).toBeInTheDocument();
    });

    it("flashcards: usa las que tocan hoy, completa con nuevas y guarda el repaso", async () => {
        // Arrange.
        const user = userEvent.setup();
        getFlashcardsSummary.mockResolvedValue({ due_count: 1, total_count: 6 });
        getDueFlashcards.mockResolvedValue({ questions: [{ id: "f1", question_type: "flashcard", question: "HNSW", explanation: "Índice de grafos." }] });
        generateQuiz.mockResolvedValue({ questions: [{ question_type: "flashcard", question: "RAG", explanation: "Recuperación + generación." }] });
        render(<QuizPanel courseId={4} />);
        await user.click(screen.getByRole("button", { name: "Flashcards" }));
        await screen.findByText("1 de 6 flashcards generadas te tocan repasar hoy.");
        await user.click(screen.getByRole("button", { name: "3" }));

        // Act.
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));
        await user.click(await screen.findByRole("button", { name: "Ver respuesta" }));
        await user.click(screen.getByRole("button", { name: /Sabía/ }));
        await user.click(await screen.findByRole("button", { name: "Ver respuesta" }));
        await user.click(screen.getByRole("button", { name: /No sabía/ }));

        // Assert.
        expect(await screen.findByText("Acertaste 1 de 2")).toBeInTheDocument();
        expect(generateQuiz).toHaveBeenCalledWith(expect.objectContaining({ numQuestions: 2, questionType: "flashcard" }));
        expect(submitFlashcardReviews).toHaveBeenCalledWith(4, [{ flashcardId: "f1", knewIt: true }]);
    });

    it("si no se puede generar muestra el error y permite reintentar", async () => {
        // Arrange.
        const user = userEvent.setup();
        generateQuiz.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ questions: [mc("¿Ok?", ["Sí", "No"], 0)] });
        render(<QuizPanel courseId={4} />);

        // Act.
        await user.click(screen.getByRole("button", { name: "Generar quiz" }));
        await user.click(await screen.findByRole("button", { name: "Reintentar" }));

        // Assert.
        expect(await screen.findByText("¿Ok?")).toBeInTheDocument();
        expect(generateQuiz).toHaveBeenCalledTimes(2);
    });

    it("propone la dificultad según los intentos anteriores", async () => {
        // Arrange.
        suggestDifficulty.mockResolvedValue({ difficulty: "hard", reason: "Acertaste el 90 %.", based_on_attempts: 4, accuracy_pct: 90 });

        // Act.
        render(<QuizPanel courseId={4} initialTopic="Grafos" />);

        // Assert.
        await waitFor(() => expect(screen.getByRole("button", { name: "Difícil" })).toHaveAttribute("aria-pressed", "true"));
        expect(suggestDifficulty).toHaveBeenCalledWith(4, "Grafos");
    });

    it("muestra el historial de intentos y vuelve al quiz", async () => {
        // Arrange.
        const user = userEvent.setup();
        listQuizAttempts.mockResolvedValue({
            items: [{ id: "a1", question_type: "true_false", difficulty: "easy", topic: "Pilas", total_questions: 4, correct_answers: 3, score: 0.75, created_at: "2026-10-01T10:00:00Z" }],
        });
        render(<QuizPanel courseId={4} lang="en" />);

        // Act.
        await user.click(screen.getByRole("button", { name: /history/i }));
        const row = await screen.findByText("Pilas");
        await user.click(screen.getByRole("button", { name: /Back to quiz/i }));

        // Assert.
        expect(row).toBeTruthy();
        expect(await screen.findByRole("button", { name: /Generate quiz/i })).toBeInTheDocument();
    });
});
