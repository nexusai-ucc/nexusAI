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

// UX-12 (#370): reusable loading block. Before, the three teacher panels
// (Material, Analytics, FAQ) showed the same generic centered spinner
// (`.nexusai-loading` → "Loading..."). This small stateless component draws
// bars/blocks with a shimmer to build the approximate outline of the real
// content while it loads. Same lightweight approach as Tooltip.jsx /
// Toast.jsx: zero dependencies, only CSS.

// A single bar/block. `width` and `height` accept any CSS unit
// (by default width 100%, height 12px). `radius` for squares/circles.
export default function Skeleton({ width, height, radius, className = "", style }) {
    return (
        <span
            className={`nexusai-skeleton ${className}`}
            aria-hidden="true"
            style={{
                width: width ?? "100%",
                height: height ?? 12,
                borderRadius: radius,
                ...style,
            }}
        />
    );
}

// Container of a full-screen skeleton. Wraps the outline and exposes the
// loading state to screen readers with an sr-only text
// (the individual <Skeleton> elements are `aria-hidden`).
export function SkeletonScreen({ label, className = "", children }) {
    return (
        <div className={`nexusai-skeleton-screen ${className}`} role="status" aria-live="polite">
            <span className="nexusai-sr-only">{label}</span>
            {children}
        </div>
    );
}

// Group of N text lines of decreasing widths (the last one shorter),
// handy for paragraphs and lists.
export function SkeletonText({ lines = 3, className = "" }) {
    return (
        <span className={`nexusai-skeleton-text ${className}`} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    height={11}
                    width={i === lines - 1 ? "60%" : "100%"}
                />
            ))}
        </span>
    );
}
