/**
 * useOnboardingState — hook compartido de modo revisión (ONB-04/05/06).
 *
 * Junta el estado de setup del curso (`course_setup_state`, ONB-02) con el
 * de dismissal/"no aplica" (`onboarding_state`, ONB-05) en un solo fetch,
 * y expone las acciones que lo persisten. Usado tanto por `OnboardingApp`
 * (tutorial en `course/edit.php`) como por el tab "Revisión del curso" de
 * `ChatApp` (ONB-06) — evita duplicar la lógica de fetch en los dos lugares
 * donde vive `OnboardingPanel`.
 */

import { useCallback, useEffect, useState } from "react";

import { getCourseSetupState, getOnboardingState, setOnboardingState } from "../api/onboarding.js";

/**
 * @param {number} courseId
 * @param {{enabled?: boolean}} [opts]  `enabled: false` no dispara el fetch
 *   (p.ej. mientras el tab de revisión no está activo en ChatApp).
 */
export function useOnboardingState(courseId, { enabled = true } = {}) {
    const [setupState, setSetupState] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [skipped, setSkipped] = useState([]);
    const [loading, setLoading] = useState(false);

    const numericCourseId = Number(courseId) || 0;

    useEffect(() => {
        if (!enabled || !(numericCourseId > 0)) return undefined;

        let cancelled = false;
        setLoading(true);

        Promise.all([
            getCourseSetupState(numericCourseId),
            getOnboardingState(numericCourseId),
        ])
            .then(([setup, onb]) => {
                if (cancelled) return;
                setSetupState(setup);
                setDismissed(!!onb?.dismissed);
                setSkipped(Array.isArray(onb?.skipped) ? onb.skipped : []);
            })
            .catch(() => {
                // Deja los pasos en "unknown" — mismo criterio que ONB-04.
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, numericCourseId]);

    const persist = useCallback((nextDismissed, nextSkipped) => {
        if (!(numericCourseId > 0)) return;
        setOnboardingState(numericCourseId, {
            dismissed: nextDismissed,
            skipped: nextSkipped,
        }).catch(() => {
            // Falla silenciosa: la próxima apertura vuelve a fetchear el
            // estado real, así que no queda inconsistente para siempre.
        });
    }, [numericCourseId]);

    const dismiss = useCallback(() => {
        setDismissed(true);
        persist(true, skipped);
    }, [persist, skipped]);

    const skip = useCallback((stepKey) => {
        setSkipped((prev) => {
            if (prev.includes(stepKey)) return prev;
            const next = [...prev, stepKey];
            persist(dismissed, next);
            return next;
        });
    }, [persist, dismissed]);

    const unskip = useCallback((stepKey) => {
        setSkipped((prev) => {
            if (!prev.includes(stepKey)) return prev;
            const next = prev.filter((k) => k !== stepKey);
            persist(dismissed, next);
            return next;
        });
    }, [persist, dismissed]);

    return { setupState, dismissed, skipped, loading, dismiss, skip, unskip };
}
