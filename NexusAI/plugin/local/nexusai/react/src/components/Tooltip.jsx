import { useState, useRef } from "react";

const SHOW_DELAY_MS = 400;

// Wraps a single child (usually a button with no visible text) and adds a
// custom on-hover/on-focus tooltip. The child's native `title=` is NOT
// touched — it is still the safety net for mobile (long-press) and for any
// edge case of this implementation (UX-05).
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
