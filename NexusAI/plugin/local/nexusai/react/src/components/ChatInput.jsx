/**
 * Input de texto del chat con auto-resize, contador opcional y envío con Enter.
 *
 * Reglas de UX:
 *   - Enter envía el mensaje.
 *   - Shift+Enter inserta nueva línea (no envía).
 *   - El botón se deshabilita si la pregunta está vacía o si está cargando.
 *   - El input se limpia automáticamente cuando se envía con éxito.
 *   - Auto-grow del textarea hasta 4 líneas, después aparece scroll.
 */

import { useEffect, useRef, useState } from "react";

const MAX_CHARS = 2000;

export default function ChatInput({ onSend, disabled, placeholder }) {
    const [value, setValue] = useState("");
    const textareaRef = useRef(null);

    // Auto-grow del textarea según el contenido.
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }, [value]);

    const trimmed = value.trim();
    const canSend = trimmed.length > 0 && !disabled;

    const send = () => {
        if (!canSend) return;
        onSend(trimmed);
        setValue("");
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="nexusai-input">
            <textarea
                ref={textareaRef}
                className="nexusai-input__textarea"
                value={value}
                onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={onKeyDown}
                placeholder={placeholder || "Preguntá lo que quieras sobre esta materia..."}
                rows={1}
                disabled={disabled}
                aria-label="Tu pregunta"
            />
            <button
                type="button"
                className="nexusai-input__send"
                onClick={send}
                disabled={!canSend}
                aria-label="Enviar mensaje"
                title="Enviar (Enter)"
            >
                {/* Ícono de avión de papel inline (no requiere lib externa) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            </button>
        </div>
    );
}
