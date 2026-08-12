/**
 * StudentQuestionsPanel — unifica "Preguntas frecuentes" y "Gaps
 * detectados" bajo un solo destino de navegación, con un selector
 * interno (RDS-08, #416). Mismo patrón que StudyPanel.jsx del alumno
 * (selector Plan/Practicar/Repaso envolviendo sub-paneles
 * independientes). No modifica la lógica de FaqDashboardPanel ni
 * GapsPanel — solo decide cuál de los dos montar.
 */

import { useState } from "react";
import FaqDashboardPanel from "./FaqDashboardPanel.jsx";
import GapsPanel from "./GapsPanel.jsx";

export default function StudentQuestionsPanel({ courseId }) {
    const [mode, setMode] = useState("faq"); // "faq" | "gaps"

    return (
        <div className="nexusai-questions">
            <div className="nexusai-questions__modebtns">
                <button
                    type="button"
                    className={`nexusai-questions__modebtn ${mode === "faq" ? "nexusai-questions__modebtn--active" : ""}`}
                    onClick={() => setMode("faq")}
                >
                    Frecuentes
                </button>
                <button
                    type="button"
                    className={`nexusai-questions__modebtn ${mode === "gaps" ? "nexusai-questions__modebtn--active" : ""}`}
                    onClick={() => setMode("gaps")}
                >
                    Sin responder
                </button>
            </div>

            {mode === "faq" ? (
                <FaqDashboardPanel courseId={courseId} />
            ) : (
                <GapsPanel courseId={courseId} />
            )}
        </div>
    );
}
