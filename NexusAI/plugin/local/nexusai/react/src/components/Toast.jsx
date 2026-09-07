import { createContext, useCallback, useContext, useRef, useState } from "react";

// UX-07 (#347): toast reutilizable en todo el widget. Antes el patrón
// (`.nexusai-toast`, `--success`/`--warning`) vivía duplicado a mano dentro
// de documents/DocumentsTable.jsx y documents/DocumentsManager.jsx. Con
// contexto en vez de props para que cualquier componente hijo (ej.
// CalendarPanel, varios niveles adentro) pueda llamar useToast() directo,
// sin prop-drilling.

const ToastContext = createContext(null);
const DURATION_MS = 3000;

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timerRef = useRef(null);

    const show = useCallback((message, variant) => {
        clearTimeout(timerRef.current);
        setToast({ message, variant });
        timerRef.current = setTimeout(() => setToast(null), DURATION_MS);
    }, []);

    const value = {
        showSuccess: (message) => show(message, "success"),
        showWarning: (message) => show(message, "warning"),
        showError: (message) => show(message, "error"),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <div className={`nexusai-toast nexusai-toast--${toast.variant}`} role="status">
                    {toast.message}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback silencioso si por error se usa fuera de un ToastProvider —
        // mejor no romper la UI por un toast que no se pudo mostrar.
        return { showSuccess() {}, showWarning() {}, showError() {} };
    }
    return ctx;
}
