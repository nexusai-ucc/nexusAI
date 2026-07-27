/**
 * Conversor a formato GIFT de Moodle (EVAL-02, issue #235).
 *
 * GIFT es el formato de texto plano que Moodle usa para importar preguntas
 * al banco de preguntas de un curso (Site administration → Question bank →
 * Import). La conversión y la descarga se hacen enteramente en el browser —
 * no hay round-trip al backend para esto.
 *
 * Referencia: https://docs.moodle.org/en/GIFT_format
 */

// Caracteres con significado especial en GIFT que hay que escapar dentro de
// texto de pregunta/respuesta: ~ = # { } y el propio backslash.
function escapeGift(text) {
    return String(text ?? "").replace(/[\\~=#{}]/g, (ch) => `\\${ch}`);
}

function questionToGift(q, index) {
    const title = `Pregunta ${index + 1}`;
    const stem = escapeGift(q.question);

    if (q.question_type === "true_false") {
        const isTrue = q.correct_index === 0;
        const explanation = q.explanation ? `#${escapeGift(q.explanation)}` : "";
        return `::${title}::${stem} {${isTrue ? "TRUE" : "FALSE"}${explanation}}`;
    }

    if (q.question_type === "open") {
        // GIFT no tiene "pregunta abierta evaluada por IA" — se exporta como
        // essay (grading manual en Moodle). La respuesta modelo va como
        // comentario del docente, no como parte del bloque de respuesta.
        const modelAnswer = q.explanation ? `\n// Respuesta modelo: ${q.explanation.replace(/\n/g, " ")}` : "";
        return `::${title}::${stem} {}${modelAnswer}`;
    }

    // multiple_choice (y cualquier otro tipo con options, por si "mix" trae algo inesperado)
    const options = (q.options || []).map((opt, i) => {
        const marker = i === q.correct_index ? "=" : "~";
        return `${marker}${escapeGift(opt)}`;
    });
    return `::${title}::${stem} {\n${options.join("\n")}\n}`;
}

/**
 * Convierte una lista de preguntas (shape QuizQuestion del backend) a un
 * string GIFT completo, listo para descargar como .txt.
 *
 * @param {Array} questions
 * @returns {string}
 */
export function toGiftFormat(questions) {
    return questions.map((q, i) => questionToGift(q, i)).join("\n\n") + "\n";
}

/**
 * Dispara la descarga de un archivo .txt GIFT en el browser (sin request al server).
 *
 * @param {Array} questions
 * @param {string} [filename]
 */
export function downloadGiftFile(questions, filename = "examen-nexusai.txt") {
    const content = toGiftFormat(questions);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
