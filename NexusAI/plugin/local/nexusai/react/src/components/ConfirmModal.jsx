/**
 * ConfirmModal — reusable confirmation dialog (UX-06, #346).
 *
 * Before, each destructive action handled its confirmation on its own
 * (or had none at all). This component is the only place where the
 * markup + behavior of the modal live, so every irreversible action of
 * the widget looks and behaves the same.
 *
 * Used in both bundles (chat and teacher view): the CSS lives in
 * styles.css, which both entry points import.
 *
 * Behavior:
 *   - Esc or click on the backdrop → cancels (never runs the action).
 *   - Focus goes to "Cancel" (the safe option by default).
 *   - `busy` disables the buttons while the action is running.
 *
 * Props:
 *   title        string           — modal title
 *   children     node             — body: text specific to the action
 *   confirmLabel string           — text of the button that runs it (default "Confirm")
 *   cancelLabel  string           — text of the button that cancels (default "Cancel")
 *   onConfirm    () => void
 *   onCancel     () => void
 *   danger       boolean          — confirm button in red (default true)
 *   busy         boolean          — action in progress: buttons disabled
 */

import { useEffect, useRef } from "react";

// Closes an overlay with Escape (UX-06/#346, taken out of ConfirmModal itself
// to reuse it in other modals without their own Esc/click-outside, e.g. ErrorModal
// in documents/DocumentsTable.jsx).
export function useDismissable(onDismiss) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onDismiss]);
}

export default function ConfirmModal({
    title,
    children,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    onConfirm,
    onCancel,
    danger = true,
    busy = false,
}) {
    const cancelRef = useRef(null);

    useEffect(() => {
        cancelRef.current?.focus();
    }, []);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape" && !busy) onCancel();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onCancel, busy]);

    return (
        <div
            className="nexusai-confirm-overlay"
            onClick={() => { if (!busy) onCancel(); }}
        >
            <div
                className="nexusai-confirm"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="nexusai-confirm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="nexusai-confirm__title" id="nexusai-confirm-title">
                    {title}
                </h2>
                <div className="nexusai-confirm__body">{children}</div>
                <div className="nexusai-confirm__actions">
                    <button
                        type="button"
                        ref={cancelRef}
                        className="nexusai-confirm__btn nexusai-confirm__btn--cancel"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={
                            "nexusai-confirm__btn " +
                            (danger
                                ? "nexusai-confirm__btn--danger"
                                : "nexusai-confirm__btn--confirm")
                        }
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
