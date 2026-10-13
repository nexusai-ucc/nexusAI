/**
 * Converter to Moodle's GIFT format (EVAL-02, issue #235).
 *
 * GIFT is the plain-text format Moodle uses to import questions into a
 * course's question bank (Site administration → Question bank →
 * Import). The conversion and the download happen entirely in the browser —
 * there is no round-trip to the backend for this.
 *
 * Reference: https://docs.moodle.org/en/GIFT_format
 */

// Characters with a special meaning in GIFT that must be escaped inside
// question/answer text: ~ = # { } and the backslash itself.
function escapeGift(text) {
    return String(text ?? "").replace(/[\\~=#{}]/g, (ch) => `\\${ch}`);
}

const GIFT_TEXT = {
    es: { title: (n) => `Pregunta ${n}`, modelAnswer: "Respuesta modelo" },
    en: { title: (n) => `Question ${n}`, modelAnswer: "Model answer" },
};

function questionToGift(q, index, lang) {
    const T = GIFT_TEXT[lang] || GIFT_TEXT.es;
    const title = T.title(index + 1);
    const stem = escapeGift(q.question);

    if (q.question_type === "true_false") {
        const isTrue = q.correct_index === 0;
        const explanation = q.explanation ? `#${escapeGift(q.explanation)}` : "";
        return `::${title}::${stem} {${isTrue ? "TRUE" : "FALSE"}${explanation}}`;
    }

    if (q.question_type === "open") {
        // GIFT has no "open question graded by AI" — it is exported as an
        // essay (manual grading in Moodle). The model answer goes as a
        // teacher comment, not as part of the answer block.
        const modelAnswer = q.explanation ? `\n// ${T.modelAnswer}: ${q.explanation.replace(/\n/g, " ")}` : "";
        return `::${title}::${stem} {}${modelAnswer}`;
    }

    // multiple_choice (and any other type with options, in case "mix" brings something unexpected)
    const options = (q.options || []).map((opt, i) => {
        const marker = i === q.correct_index ? "=" : "~";
        return `${marker}${escapeGift(opt)}`;
    });
    return `::${title}::${stem} {\n${options.join("\n")}\n}`;
}

/**
 * Converts a list of questions (the backend's QuizQuestion shape) to a
 * complete GIFT string, ready to download as .txt.
 *
 * @param {Array} questions
 * @param {string} [lang] 'es' | 'en' — language of the generated titles/comments.
 * @returns {string}
 */
export function toGiftFormat(questions, lang = "es") {
    return questions.map((q, i) => questionToGift(q, i, lang)).join("\n\n") + "\n";
}

/**
 * Fires the download of a GIFT .txt file in the browser (no request to the server).
 *
 * @param {Array} questions
 * @param {string} [filename]
 * @param {string} [lang] 'es' | 'en'
 */
export function downloadGiftFile(questions, filename, lang = "es") {
    const name = filename || (lang === "es" ? "examen-nexusai.txt" : "exam-nexusai.txt");
    const content = toGiftFormat(questions, lang);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
