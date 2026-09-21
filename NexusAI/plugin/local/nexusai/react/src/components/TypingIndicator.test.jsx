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
