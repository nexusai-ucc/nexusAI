// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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
