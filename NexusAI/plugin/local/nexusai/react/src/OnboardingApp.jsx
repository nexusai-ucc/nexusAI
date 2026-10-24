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
 * OnboardingApp — NexusAI widget on the create-course screen (ONB-03).
 *
 * Replaces the normal ChatApp when the plugin detects that the teacher is on
 * `course/edit.php` with no course yet (pagetype `course-edit`, no `id`,
 * capability `moodle/course:create`). That flag is passed by
 * `classes/hook/output/before_footer_listener.php` as `params.onboarding`;
 * `index.jsx` decides which component to mount.
 *
 * Same look as ChatApp (floating rail + panel), but the body is the
 * course setup checklist (`OnboardingPanel`) instead of the chat.
 *
 * ONB-04: in `review` mode (editing an existing course) it fetches the real
 * setup state of the course and passes it to `OnboardingPanel`, which uses it
 * to mark each step ✓/pending.
 *
 * ONB-05: closing the panel in `review` mode (header X or the panel's "Close"
 * button) stores the dismissal — `visibility_helper::onboarding_hint()` does
 * not return `'review-course'` again for this course until the teacher
 * reopens it by hand from the "Course review" tab of the normal widget
 * (ONB-06). In `create` mode there is no `courseid` yet: closing is purely
 * local, `useOnboardingState` fires no fetch/persist with courseid=0.
 */

import { useEffect, useState } from "react";

import OnboardingPanel from "./components/OnboardingPanel.jsx";
import { useOnboardingState } from "./onboarding/useOnboardingState.js";

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

    // On the create-course screen we start open: it is when the teacher needs
    // the guide the most. On other pages (ONB-04/06) the default will be
    // closed.
    const [open, setOpen] = useState(mode === "create");

    // ONB-04/05: setup state + dismissal/"not applicable" of the course. While
    // setupState is `null` (not arrived yet, or the call failed),
    // OnboardingPanel shows each step as "unknown" — the same state it already
    // uses when the material backend does not answer, no separate loading
    // state is needed. With courseid=0 (create mode) the hook fetches nothing.
    const { setupState, skipped, dismiss, skip, unskip } = useOnboardingState(
        courseid,
        { enabled: mode === "review" }
    );

    const closeAndDismiss = () => {
        dismiss();
        setOpen(false);
    };

    // Sync with the navbar icon (outside React), same as ChatApp.
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
                                <h2 id="nexusai-onb-title" className="nexusai-panel__title">{t.title}</h2>
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
                                onClick={closeAndDismiss}
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
                            state={setupState}
                            skipped={skipped}
                            onSkip={skip}
                            onUnskip={unskip}
                            onDismiss={closeAndDismiss}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
