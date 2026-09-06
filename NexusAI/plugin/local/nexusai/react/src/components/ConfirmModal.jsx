/**
 * ConfirmModal — modal de confirmación genérico, compartido entre el bundle
 * de chat y el de documentos (importado solo desde documents/ hacia acá,
 * nunca al revés).
 */

import { useEffect } from "react";

/**
 * Cierra el modal con Escape o clickeando fuera de él.
 *
 * @param {() => void} onDismiss
 * @returns {{ overlayRef: (el) => void }} handler para el onMouseDown del overlay.
 */
export function useDismissable(onDismiss) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onDismiss]);

    const handleOverlayMouseDown = (e) => {
        if (e.target === e.currentTarget) onDismiss();
    };

    return { handleOverlayMouseDown };
}

export default function ConfirmModal({
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "confirm",
    onConfirm,
    onCancel,
}) {
    const { handleOverlayMouseDown } = useDismissable(onCancel);
    const confirmClass = variant === "danger" ? "nexusai-btn--danger" : "nexusai-btn--confirm";

    return (
        <div
            className="nexusai-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexusai-confirm-title"
            onMouseDown={handleOverlayMouseDown}
        >
            <div className="nexusai-modal">
                <h2 className="nexusai-modal__title" id="nexusai-confirm-title">
                    {title}
                </h2>
                <p className="nexusai-modal__body">{message}</p>
                <div className="nexusai-modal__actions">
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`nexusai-btn ${confirmClass}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
