/**
 * useOnboardingState — shared review mode hook (ONB-04/05/06).
 *
 * Joins the course setup state (`course_setup_state`, ONB-02) with the
 * dismissal/"not applicable" state (`onboarding_state`, ONB-05) in a single fetch,
 * and exposes the actions that store it. Used both by `OnboardingApp`
 * (tutorial in `course/edit.php`) and by the "Course review" tab of
 * `ChatApp` (ONB-06) — avoids duplicating the fetch logic in the two places
 * where `OnboardingPanel` lives.
 */

import { useCallback, useEffect, useState } from "react";

import { getCourseSetupState, getOnboardingState, setOnboardingState } from "../api/onboarding.js";

/**
 * @param {number} courseId
 * @param {{enabled?: boolean}} [opts]  `enabled: false` does not fire the fetch
 *   (e.g. while the review tab is not active in ChatApp).
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
                // Leaves the steps as "unknown" — same rule as ONB-04.
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
            // Silent failure: the next opening fetches the real state again,
            // so it does not stay inconsistent forever.
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
