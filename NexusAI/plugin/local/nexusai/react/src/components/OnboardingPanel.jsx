/**
 * OnboardingPanel — checklist de armado de curso para el docente.
 *
 * Componente reusable (ADR-010). Dos modos:
 *   - `create`  tutorial lineal al crear un curso nuevo. No hay curso todavía
 *               sobre el cual medir estado: todos los pasos aparecen como
 *               pendientes, en orden.
 *   - `review`  (ONB-04) al editar un curso existente: usa `state`
 *               (`course_setup_state`) para marcar ✓ lo que ya está y resaltar
 *               lo que falta.
 *
 * NexusAI nunca ejecuta los pasos: cada uno abre la pantalla nativa de Moodle
 * en una pestaña nueva.
 */

import { COURSE_SETUP_STEPS, stepStatus } from "../onboarding/steps.js";

const T = {
    es: {
        createIntro: "Armá tu curso paso a paso. Cada paso te lleva a la pantalla de Moodle donde lo hacés.",
        reviewIntro: "Esto es lo que le falta a tu curso. Cada pendiente te lleva a la pantalla de Moodle correspondiente.",
        goTo: "Ir a esta pantalla",
        allDone: "Tu curso está listo 🎉",
        optional: "opcional",
        done: "Listo",
        pending: "Falta",
        stepOf: (n, total) => `Paso ${n} de ${total}`,
    },
    en: {
        createIntro: "Set up your course step by step. Each step takes you to the Moodle screen where you do it.",
        reviewIntro: "Here's what your course is missing. Each pending item takes you to the matching Moodle screen.",
        goTo: "Go to this screen",
        allDone: "Your course is ready 🎉",
        optional: "optional",
        done: "Done",
        pending: "Missing",
        stepOf: (n, total) => `Step ${n} of ${total}`,
    },
};

export default function OnboardingPanel({
    mode = "create",
    courseid = 0,
    wwwroot = "/",
    lang = "es",
    state = null,
}) {
    const t = T[lang] || T.es;
    const ctx = { wwwroot, courseid: Number(courseid) || 0 };

    const steps = COURSE_SETUP_STEPS.map((step) => ({
        step,
        status: mode === "review" ? stepStatus(step, state) : "pending",
    }));

    const allDone =
        mode === "review" &&
        state &&
        steps.every(({ step, status }) => status === "done" || (step.optional && status !== "pending"));

    return (
        <div className="nexusai-onb">
            <p className="nexusai-onb__intro">
                {mode === "review" ? t.reviewIntro : t.createIntro}
            </p>

            {allDone && <div className="nexusai-onb__alldone">{t.allDone}</div>}

            <ol className="nexusai-onb__list">
                {steps.map(({ step, status }, i) => {
                    const label = step.title[lang] || step.title.es;
                    const why = step.why[lang] || step.why.es;
                    return (
                        <li
                            key={step.key}
                            className={`nexusai-onb__step nexusai-onb__step--${status}`}
                        >
                            <div className="nexusai-onb__step-marker" aria-hidden="true">
                                {status === "done" ? "✓" : i + 1}
                            </div>
                            <div className="nexusai-onb__step-body">
                                <div className="nexusai-onb__step-head">
                                    <span className="nexusai-onb__step-title">{label}</span>
                                    {step.optional && (
                                        <span className="nexusai-onb__badge">{t.optional}</span>
                                    )}
                                    {mode === "review" && status !== "unknown" && (
                                        <span
                                            className={`nexusai-onb__status nexusai-onb__status--${status}`}
                                        >
                                            {status === "done" ? t.done : t.pending}
                                        </span>
                                    )}
                                </div>
                                <p className="nexusai-onb__step-why">{why}</p>
                                {status !== "done" && (
                                    <a
                                        className="nexusai-onb__step-link"
                                        href={step.href(ctx)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {t.goTo} →
                                    </a>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
