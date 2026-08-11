/**
 * StudyPanel — "Modo Estudio" (UX-01 + Plan de Estudio Personalizado).
 *
 * Wrapper liviano que unifica Plan (recomendaciones), Quiz (práctica) y
 * Repaso (historial de errores) bajo un solo destino de navegación, con
 * un selector interno. "Plan" es el modo por default: es lo primero que
 * ve el alumno al entrar a Modo Estudio, para que el producto sea
 * proactivo (le dice qué hacer) en vez de reactivo (esperar a que
 * se le ocurra qué pedir). No modifica la lógica de QuizPanel ni
 * ReviewPanel — solo decide cuál de los tres montar.
 *
 * RDS-03 (#402): `onSendToChat` viene de ChatApp y baja a StudyPlanPanel/
 * QuizPanel — "Practicar este tema" y "Generar quiz" lo usan para mandar
 * el pedido como un mensaje de chat real en vez de quedarse acá.
 */

import { useState } from "react";
import QuizPanel from "./QuizPanel.jsx";
import ReviewPanel from "./ReviewPanel.jsx";
import StudyPlanPanel from "./StudyPlanPanel.jsx";

export default function StudyPanel({ courseId, sesskey, lang = "es", onSendToChat }) {
    const [mode, setMode] = useState("plan"); // "plan" | "practice" | "review"

    const L = lang === "es"
        ? { plan: "Plan", practice: "Practicar", review: "Repaso" }
        : { plan: "Plan", practice: "Practice", review: "Review" };

    return (
        <div className="nexusai-study">
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

            {mode === "plan" ? (
                <StudyPlanPanel courseId={courseId} lang={lang} onSendToChat={onSendToChat} />
            ) : mode === "practice" ? (
                <QuizPanel courseId={courseId} lang={lang} onSendToChat={onSendToChat} />
            ) : (
                <ReviewPanel courseId={courseId} sesskey={sesskey} lang={lang} />
            )}
        </div>
    );
}
