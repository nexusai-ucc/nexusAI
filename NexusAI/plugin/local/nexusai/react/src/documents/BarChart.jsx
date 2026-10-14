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

import { useState } from "react";

/**
 * BarChart — generic bars with a real tooltip on hover/focus (ANALYTICS-04,
 * #371). Replaces the native `title` the "Daily usage" and "Score
 * distribution" sections used before: the browser's `title` takes a while to
 * show, cannot be reached with the keyboard and cannot be styled. Here the
 * tooltip is a positioned `<span>` shown by state, with the same event on
 * mouse (hover) and on focus (keyboard), and the columns are horizontally
 * scrollable bars so they are not squashed with many data points
 * (a 365-day window, for example) — that scroll already existed for the
 * daily section (UX-16); here it is generalized to any `BarChart`.
 *
 * It is not a charting library — it is still pure CSS (height in %), only
 * now with React state for the tooltip instead of `title`.
 */
export default function BarChart({ items, maxValue, variant, formatTooltip, formatLabel }) {
    const [activeKey, setActiveKey] = useState(null);
    const colClass = variant === "buckets" ? "nexusai-analytics__bucket-col" : "nexusai-analytics__bar-col";

    return (
        <div className={`nexusai-analytics__bars nexusai-analytics__bars--${variant}`}>
            {items.map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round((item.value / maxValue) * 100)));
                const tooltip = formatTooltip(item);
                const isActive = activeKey === item.key;
                return (
                    <div
                        key={item.key}
                        className={colClass}
                        onMouseEnter={() => setActiveKey(item.key)}
                        onMouseLeave={() => setActiveKey((k) => (k === item.key ? null : k))}
                    >
                        <div
                            className={`nexusai-analytics__bar${variant === "buckets" ? " nexusai-analytics__bar--bucket" : ""}`}
                            style={{ height: `${pct}%` }}
                            tabIndex={0}
                            role="img"
                            aria-label={tooltip}
                            onFocus={() => setActiveKey(item.key)}
                            onBlur={() => setActiveKey((k) => (k === item.key ? null : k))}
                        >
                            {isActive && (
                                <span className="nexusai-analytics__bar-tooltip" role="tooltip">
                                    {tooltip}
                                </span>
                            )}
                        </div>
                        {formatLabel && <span className="nexusai-analytics__bucket-label">{formatLabel(item)}</span>}
                    </div>
                );
            })}
        </div>
    );
}
