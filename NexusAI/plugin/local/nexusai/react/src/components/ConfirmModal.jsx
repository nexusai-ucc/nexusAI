/**
 * ConfirmModal — diálogo de confirmación reutilizable (UX-06, #346).
 *
 * Antes cada acción destructiva resolvía la confirmación por su cuenta
 * (o directamente no la tenía). Este componente es el único lugar donde
 * vive el markup + comportamiento del modal, para que todas las acciones
 * irreversibles del widget se vean y se comporten igual.
 *
 * Se usa en los dos bundles (chat y vista docente): el CSS vive en
 * styles.css, que ambos entrypoints importan.
 *
 * Comportamiento:
 *   - Esc o click en el fondo → cancela (nunca ejecuta la acción).
 *   - El foco entra en "Cancelar" (opción segura por default).
 *   - `busy` deshabilita los botones mientras la acción está corriendo.
 *
 * Props:
 *   title        string           — título del modal
 *   children     node             — cuerpo: texto específico de la acción
 *   confirmLabel string           — texto del botón que ejecuta (default "Confirmar")
 *   cancelLabel  string           — texto del botón que cancela (default "Cancelar")
 *   onConfirm    () => void
 *   onCancel     () => void
 *   danger       boolean          — botón de confirmar en rojo (default true)
 *   busy         boolean          — acción en curso: botones deshabilitados
 */

import { useEffect, useRef } from "react";

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
