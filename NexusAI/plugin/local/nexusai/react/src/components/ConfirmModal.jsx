import { useEffect, useRef } from "react";

// Cierra el overlay con Escape o con click afuera del contenido.
// (Recreado acá porque la rama de UX-06, donde se introdujo por primera vez,
// todavía no está mergeada a development — mismo componente.)
export function useDismissable(onDismiss) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") onDismiss();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onDismiss]);
}

// Modal de confirmación genérico. Usado por UX-06 (eliminar documento,
// limpiar chat, borrar historial de errores) y ahora también por ASIST-02
// (borrar una sesión puntual del historial de chat).
export default function ConfirmModal({
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = "default",
    onConfirm,
    onCancel,
}) {
    useDismissable(onCancel);
    const cancelBtnRef = useRef(null);

    useEffect(() => {
        cancelBtnRef.current?.focus();
    }, []);

    return (
        <div
            className="nexusai-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexusai-confirm-title"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div className="nexusai-modal">
                <h2 className="nexusai-modal__title" id="nexusai-confirm-title">
                    {title}
                </h2>
                <p className="nexusai-modal__body">{message}</p>
                <div className="nexusai-modal__actions">
                    <button
                        ref={cancelBtnRef}
                        type="button"
                        className="nexusai-btn nexusai-btn--secondary"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`nexusai-btn ${variant === "danger" ? "nexusai-btn--danger" : "nexusai-btn--confirm"}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
