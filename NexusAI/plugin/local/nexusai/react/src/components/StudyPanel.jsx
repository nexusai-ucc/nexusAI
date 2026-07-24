/**
 * StudyPanel — "Modo Estudio" (UX-01).
 *
 * Wrapper liviano que unifica Quiz (práctica) y Repaso (historial de
 * errores) bajo un solo destino de navegación, con un selector interno.
 * No modifica la lógica de QuizPanel ni ReviewPanel — solo decide cuál
 * de los dos montar.
 */

import { useState } from "react";
import QuizPanel from "./QuizPanel.jsx";
import ReviewPanel from "./ReviewPanel.jsx";

export default function StudyPanel({ courseId, sesskey, lang = "es" }) {
    const [mode, setMode] = useState("practice"); // "practice" | "review"

    const L = lang === "es"
        ? { practice: "Practicar", review: "Repaso" }
        : { practice: "Practice", review: "Review" };

    return (
        <div className="nexusai-study">
            <div className="nexusai-study__modebtns">
                <button
                    type="button"
                    className={`nexusai-study__modebtn ${mode === "practice" ? "nexusai-study__modebtn--active" : ""}`}
                    onClick={() => setMode("practice")}
                >
                    {L.practice}
                </button>
                <button
                    type="button"
                    className={`nexusai-study__modebtn ${mode === "review" ? "nexusai-study__modebtn--active" : ""}`}
                    onClick={() => setMode("review")}
                >
                    {L.review}
                </button>
            </div>

            {mode === "practice" ? (
                <QuizPanel courseId={courseId} lang={lang} />
            ) : (
                <ReviewPanel courseId={courseId} sesskey={sesskey} lang={lang} />
            )}
        </div>
    );
}
