import { createContext, useCallback, useContext, useRef, useState } from "react";

// UX-07 (#347): toast reusable across the widget. Before, the pattern
// (`.nexusai-toast`, `--success`/`--warning`) lived duplicated by hand inside
// documents/DocumentsTable.jsx and documents/DocumentsManager.jsx. With a
// context instead of props so any child component (e.g.
// CalendarPanel, several levels inside) can call useToast() directly,
// without prop-drilling.

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
        // Silent fallback if it is used by mistake outside a ToastProvider —
        // better not to break the UI over a toast that could not be shown.
        return { showSuccess() {}, showWarning() {}, showError() {} };
    }
    return ctx;
}
