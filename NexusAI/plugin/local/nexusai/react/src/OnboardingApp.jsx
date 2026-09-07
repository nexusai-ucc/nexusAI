/**
 * OnboardingApp — widget de NexusAI en la pantalla de crear un curso (ONB-03).
 *
 * Reemplaza al ChatApp normal cuando el plugin detecta que el docente está en
 * `course/edit.php` sin curso todavía (pagetype `course-edit`, sin `id`,
 * capability `moodle/course:create`). Ese flag lo pasa
 * `classes/hook/output/before_footer_listener.php` como `params.onboarding`;
 * `index.jsx` decide qué componente montar.
 *
 * Misma estética que ChatApp (rail flotante + panel), pero el cuerpo es el
 * checklist de armado de curso (`OnboardingPanel`) en vez del chat.
 *
 * ONB-04 va a extender esto al modo `review` sobre cursos existentes; por eso
 * el `mode` ya es una prop.
 */

import { useEffect, useState } from "react";

import OnboardingPanel from "./components/OnboardingPanel.jsx";

const STRINGS = {
    es: {
        title: "Primeros pasos",
        open: "Abrir la guía de NexusAI",
        close: "Cerrar",
    },
    en: {
        title: "Getting started",
        open: "Open the NexusAI guide",
        close: "Close",
    },
};

const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
);

const IconClose = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export default function OnboardingApp({
    mode = "create",
    courseid = 0,
    wwwroot = "/",
    lang = "es",
}) {
    const t = STRINGS[lang] || STRINGS.es;

    // En la pantalla de crear curso arrancamos abierto: es el momento en que
    // el docente más necesita la guía. En otras páginas (ONB-04/06) el default
    // será cerrado.
    const [open, setOpen] = useState(mode === "create");

    // Sincronía con el ícono de la navbar (fuera de React), igual que ChatApp.
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const onToggle = () => setOpen((v) => !v);
        window.addEventListener("nexusai:toggle-panel", onToggle);
        return () => window.removeEventListener("nexusai:toggle-panel", onToggle);
    }, []);

    return (
        <div className="nexusai-widget">
            {!open && (
                <button
                    type="button"
                    className="nexusai-rail"
                    onClick={() => setOpen(true)}
                    aria-label={t.open}
                    title={t.open}
                >
                    <span className="nexusai-rail__icon"><IconSparkle /></span>
                    <span className="nexusai-rail__label">{t.title}</span>
                </button>
            )}

            {open && (
                <div className="nexusai-panel" role="dialog" aria-labelledby="nexusai-onb-title">
                    <header className="nexusai-panel__header">
                        <div className="nexusai-panel__title-wrap">
                            <div className="nexusai-panel__avatar"><IconSparkle /></div>
                            <div className="nexusai-panel__title-group">
                                <h3 id="nexusai-onb-title" className="nexusai-panel__title">{t.title}</h3>
                                <div className="nexusai-panel__status">
                                    <span className="nexusai-panel__status-dot" />
                                    NexusAI
                                </div>
                            </div>
                        </div>
                        <div className="nexusai-panel__actions">
                            <button
                                type="button"
                                className="nexusai-icon-btn"
                                onClick={() => setOpen(false)}
                                aria-label={t.close}
                                title={t.close}
                            >
                                <IconClose />
                            </button>
                        </div>
                    </header>

                    <div className="nexusai-panel__body nexusai-panel__body--onb">
                        <OnboardingPanel
                            mode={mode}
                            courseid={courseid}
                            wwwroot={wwwroot}
                            lang={lang}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
