/**
 * StudyPanel — "Modo Estudio" (UX-01 + Plan de Estudio Personalizado).
 *
 * Wrapper liviano que unifica Plan (recomendaciones), Quiz (práctica) y
 * Repaso (historial de errores) bajo un solo destino de navegación, con
 * un selector interno. "Plan" es el modo por default: es lo primero que
 * ve el alumno al entrar a Modo Estudio, para que el producto sea
 * proactivo (le dice qué hacer) en vez de reactivo (esperar a que
 * se le ocurra qué pedir). No modifica la lógica de QuizPanel ni
 * ReviewPanel — solo decide cuál de los tres montar, y le pasa a
 * QuizPanel el tema elegido desde el Plan cuando corresponde.
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
    // SP-16 (#354): racha visible en las 3 tabs (Plan/Practicar/Repaso) — la
    // actividad de quiz pasa en "Practicar", no solo en "Plan", así que vive
    // en el wrapper persistente y no adentro de StudyPlanPanel.
    const [streak, setStreak] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getStudyStreak(courseId)
            .then((data) => { if (!cancelled) setStreak(data); })
            .catch(() => { /* sin racha visible: no bloquea el resto del panel */ });
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
