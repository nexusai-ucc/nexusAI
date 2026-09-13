import { useState, useRef } from "react";

const SHOW_DELAY_MS = 400;

// Envuelve un único hijo (normalmente un botón sin texto visible) y le
// agrega un tooltip custom on-hover/on-focus. El `title=` nativo del hijo
// NO se toca — sigue siendo la red de seguridad para mobile (long-press) y
// para cualquier caso borde de esta implementación (UX-05).
export default function Tooltip({ label, placement = "bottom", children }) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    const show = () => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    const hide = () => {
        clearTimeout(timerRef.current);
        setVisible(false);
    };

    if (!label) return children;

    return (
        <span
            className="nexusai-tooltip-wrap"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && (
                <span
                    className={`nexusai-tooltip-bubble nexusai-tooltip-bubble--${placement}`}
                    role="tooltip"
                >
                    {label}
                </span>
            )}
        </span>
    );
}
