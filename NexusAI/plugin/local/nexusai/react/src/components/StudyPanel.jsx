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
 * StudyPanel — "Study mode" (UX-01 + Personalized Study Plan).
 *
 * Light wrapper that brings Plan (recommendations), Quiz (practice) and
 * Review (error history) under a single navigation destination, with an
 * inner selector. "Plan" is the default mode: it is the first thing the
 * student sees when entering Study mode, so the product is proactive
 * (tells them what to do) instead of reactive (waiting for them to think
 * of what to ask). It does not change the logic of QuizPanel or
 * ReviewPanel — it only decides which of the three to mount, and passes
 * QuizPanel the topic chosen from the Plan when it applies.
 */

import { useEffect, useState } from "react";
import QuizPanel from "./QuizPanel.jsx";
import ReviewPanel from "./ReviewPanel.jsx";
import StudyPlanPanel from "./StudyPlanPanel.jsx";
import { getStudyStreak } from "../api/quiz.js";
import { IconFlame } from "./icons.jsx";

export default function StudyPanel({ courseId, sesskey, lang = "es" }) {
    const [mode, setMode] = useState("plan"); // "plan" | "practice" | "review"
    const [plannedTopic, setPlannedTopic] = useState("");
    // SP-16 (#354): streak visible in the 3 tabs (Plan/Practice/Review) — quiz
    // activity happens in "Practice", not only in "Plan", so it lives in the
    // persistent wrapper and not inside StudyPlanPanel.
    const [streak, setStreak] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getStudyStreak(courseId)
            .then((data) => { if (!cancelled) setStreak(data); })
            .catch(() => { /* no visible streak: does not block the rest of the panel */ });
        return () => { cancelled = true; };
    }, [courseId]);

    const L = lang === "es"
        ? { plan: "Plan", practice: "Practicar", review: "Repaso", streak: (n) => (n === 1 ? "1 día seguido" : `${n} días seguidos`) }
        : { plan: "Plan", practice: "Practice", review: "Review", streak: (n) => `${n} day${n === 1 ? "" : "s"} in a row` };

    const practiceTopic = (topic) => {
        setPlannedTopic(topic);
        setMode("practice");
    };

    return (
        <div className="nexusai-study">
            {streak?.current_streak > 0 && (
                <div className="nexusai-study__streak">
                    <IconFlame size={15} />
                    <span>{L.streak(streak.current_streak)}</span>
                </div>
            )}
            <div className="nexusai-study__modebtns">
                <button
                    type="button"
                    className={`nexusai-study__modebtn ${mode === "plan" ? "nexusai-study__modebtn--active" : ""}`}
                    onClick={() => setMode("plan")}
                >
                    {L.plan}
                </button>
                <button
                    type="button"
                    className={`nexusai-study__modebtn ${mode === "practice" ? "nexusai-study__modebtn--active" : ""}`}
                    onClick={() => { setPlannedTopic(""); setMode("practice"); }}
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

            {mode === "plan" ? (
                <StudyPlanPanel courseId={courseId} lang={lang} onPracticeTopic={practiceTopic} />
            ) : mode === "practice" ? (
                <QuizPanel courseId={courseId} lang={lang} initialTopic={plannedTopic} />
            ) : (
                <ReviewPanel courseId={courseId} sesskey={sesskey} lang={lang} />
            )}
        </div>
    );
}
