/**
 * StudentQuestionsPanel — brings "Frequent questions" and "Detected gaps"
 * under a single navigation destination, with an inner selector
 * (RDS-08, #416). Same pattern as the student's StudyPanel.jsx
 * (Plan/Practice/Review selector wrapping independent sub-panels).
 * It does not change the logic of FaqDashboardPanel or
 * GapsPanel — it only decides which of the two to mount.
 */

import { useState } from "react";
import FaqDashboardPanel from "./FaqDashboardPanel.jsx";
import GapsPanel from "./GapsPanel.jsx";

export default function StudentQuestionsPanel({ courseId, lang = "es" }) {
    const [mode, setMode] = useState("faq"); // "faq" | "gaps"

    const L = lang === "es" ? {
        faq:  "Frecuentes",
        gaps: "Sin responder",
    } : {
        faq:  "Frequent",
        gaps: "Unanswered",
    };

    return (
        <div className="nexusai-questions">
            <div className="nexusai-questions__modebtns">
                <button
                    type="button"
                    className={`nexusai-questions__modebtn ${mode === "faq" ? "nexusai-questions__modebtn--active" : ""}`}
                    onClick={() => setMode("faq")}
                >
                    {L.faq}
                </button>
                <button
                    type="button"
                    className={`nexusai-questions__modebtn ${mode === "gaps" ? "nexusai-questions__modebtn--active" : ""}`}
                    onClick={() => setMode("gaps")}
                >
                    {L.gaps}
                </button>
            </div>

            {mode === "faq" ? (
                <FaqDashboardPanel courseId={courseId} lang={lang} />
            ) : (
                <GapsPanel courseId={courseId} lang={lang} />
            )}
        </div>
    );
}
