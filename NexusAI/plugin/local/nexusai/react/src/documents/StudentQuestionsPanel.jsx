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
