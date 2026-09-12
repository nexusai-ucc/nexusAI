import { describe, it, expect, vi, afterEach } from "vitest";
import { toGiftFormat, downloadGiftFile } from "./gift.js";

describe("toGiftFormat — multiple_choice", () => {
    it("marks the correct option with = and the rest with ~", () => {
        const gift = toGiftFormat([
            {
                question_type: "multiple_choice",
                question: "¿Cuál es la capital de Francia?",
                options: ["Madrid", "París", "Roma", "Berlín"],
                correct_index: 1,
            },
        ]);
        expect(gift).toContain("::Pregunta 1::¿Cuál es la capital de Francia? {");
        expect(gift).toContain("~Madrid");
        expect(gift).toContain("=París");
        expect(gift).toContain("~Roma");
        expect(gift).toContain("~Berlín");
    });

    it("treats a missing options array as empty instead of throwing", () => {
        const gift = toGiftFormat([
            { question_type: "multiple_choice", question: "Q", correct_index: 0 },
        ]);
        expect(gift).toBe("::Pregunta 1::Q {\n\n}\n");
    });

    it("falls back to the options-block shape for an unknown question_type (e.g. mix leftovers)", () => {
        const gift = toGiftFormat([
            { question_type: "weird_type", question: "texto", options: ["A", "B"], correct_index: 0 },
        ]);
        expect(gift).toContain("=A");
        expect(gift).toContain("~B");
    });
});

describe("toGiftFormat — true_false", () => {
    it("renders TRUE for correct_index 0", () => {
        const gift = toGiftFormat([
            { question_type: "true_false", question: "El sol es una estrella.", correct_index: 0, explanation: "" },
        ]);
        expect(gift).toBe("::Pregunta 1::El sol es una estrella. {TRUE}\n");
    });

    it("renders FALSE for correct_index 1 and appends the explanation as a # comment", () => {
        const gift = toGiftFormat([
            {
                question_type: "true_false",
                question: "La Tierra es plana.",
                correct_index: 1,
                explanation: "La Tierra es un geoide.",
            },
        ]);
        expect(gift).toBe("::Pregunta 1::La Tierra es plana. {FALSE#La Tierra es un geoide.}\n");
    });
});

describe("toGiftFormat — open", () => {
    it("exports as an empty-answer essay block with the model answer as a comment", () => {
        const gift = toGiftFormat([
            {
                question_type: "open",
                question: "Explicá la fotosíntesis.",
                explanation: "Proceso por el cual las plantas convierten luz en energía.",
            },
        ]);
        expect(gift).toBe(
            "::Pregunta 1::Explicá la fotosíntesis. {}\n// Respuesta modelo: Proceso por el cual las plantas convierten luz en energía.\n"
        );
    });

    it("collapses newlines in the model answer into single spaces (GIFT comments are single-line)", () => {
        const gift = toGiftFormat([
            { question_type: "open", question: "Q", explanation: "línea uno\nlínea dos" },
        ]);
        expect(gift).toContain("// Respuesta modelo: línea uno línea dos");
        expect(gift).not.toContain("línea uno\nlínea dos");
    });

    it("omits the model-answer comment entirely when there is no explanation", () => {
        const gift = toGiftFormat([{ question_type: "open", question: "Q", explanation: "" }]);
        expect(gift).toBe("::Pregunta 1::Q {}\n");
    });
});

describe("toGiftFormat — escaping", () => {
    it("escapes GIFT-reserved characters (\\ ~ = # { }) in the question stem", () => {
        const gift = toGiftFormat([
            {
                question_type: "true_false",
                question: "¿Es 2#2={4}? (usa ~ para aproximar)",
                correct_index: 0,
                explanation: "",
            },
        ]);
        expect(gift).toContain("¿Es 2\\#2\\=\\{4\\}? (usa \\~ para aproximar)");
    });

    it("escapes reserved characters inside multiple_choice options too", () => {
        const gift = toGiftFormat([
            {
                question_type: "multiple_choice",
                question: "Q",
                options: ["a=b", "c~d"],
                correct_index: 0,
            },
        ]);
        expect(gift).toContain("=a\\=b");
        expect(gift).toContain("~c\\~d");
    });

    it("treats a null/undefined question text as an empty string instead of throwing", () => {
        const gift = toGiftFormat([{ question_type: "true_false", question: undefined, correct_index: 0, explanation: "" }]);
        expect(gift).toBe("::Pregunta 1:: {TRUE}\n");
    });
});

describe("toGiftFormat — multiple questions", () => {
    it("numbers questions sequentially and separates blocks with a blank line", () => {
        const gift = toGiftFormat([
            { question_type: "true_false", question: "Q1", correct_index: 0, explanation: "" },
            { question_type: "true_false", question: "Q2", correct_index: 1, explanation: "" },
        ]);
        expect(gift).toBe("::Pregunta 1::Q1 {TRUE}\n\n::Pregunta 2::Q2 {FALSE}\n");
    });

    it("returns just a trailing newline for an empty question list", () => {
        expect(toGiftFormat([])).toBe("\n");
    });
});

describe("downloadGiftFile", () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    afterEach(() => {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        vi.restoreAllMocks();
    });

    it("creates an object URL, triggers a click on a temporary <a download>, and revokes the URL", () => {
        // jsdom no implementa URL.createObjectURL/revokeObjectURL — se stubean acá,
        // no en el setup global, porque son específicos de este único test.
        URL.createObjectURL = vi.fn(() => "blob:mock-url");
        URL.revokeObjectURL = vi.fn();
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

        downloadGiftFile(
            [{ question_type: "true_false", question: "Q", correct_index: 0, explanation: "" }],
            "mi-examen.txt"
        );

        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
        const blobArg = URL.createObjectURL.mock.calls[0][0];
        expect(blobArg.type).toBe("text/plain;charset=utf-8");
        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
        // El <a> temporal se agrega y se saca del DOM — no debe quedar colgado.
        expect(document.querySelectorAll("a[download]").length).toBe(0);
    });

    it("defaults the filename to examen-nexusai.txt when none is given", () => {
        URL.createObjectURL = vi.fn(() => "blob:mock-url");
        URL.revokeObjectURL = vi.fn();
        let capturedDownloadAttr = null;
        vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
            capturedDownloadAttr = this.download;
        });

        downloadGiftFile([{ question_type: "true_false", question: "Q", correct_index: 0, explanation: "" }]);

        expect(capturedDownloadAttr).toBe("examen-nexusai.txt");
    });
});
