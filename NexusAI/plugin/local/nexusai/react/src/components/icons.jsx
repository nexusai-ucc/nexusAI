/**
 * Iconos inline estilo lucide (lo que usa shadcn/ui).
 *
 * Convención:
 *   - viewBox 24x24
 *   - stroke=currentColor, fill=none (excepto los "filled" indicados)
 *   - strokeLinecap/Linejoin="round", strokeWidth=2
 *   - default size=16 (overrideable con prop size)
 *
 * Reemplazan emojis para que la UI quede consistente con el resto del sistema
 * shadcn (sin variaciones tipográficas, sin OS-specific glyphs, color hereda
 * del padre via currentColor).
 */

import React from "react";

const baseProps = (size) => ({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
});

// ── Files / documents ──────────────────────────────────────────────────────
export const IconFile = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

export const IconFileText = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8"  y1="13" x2="16" y2="13" />
        <line x1="8"  y1="17" x2="13" y2="17" />
    </svg>
);

// ── Course / library ───────────────────────────────────────────────────────
export const IconBookOpen = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

// ── Globe (multi-curso) ────────────────────────────────────────────────────
export const IconGlobe = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

// ── History (reloj) ────────────────────────────────────────────────────────
export const IconHistory = ({ size = 15 }) => (
    <svg {...baseProps(size)}>
        <path d="M3 12a9 9 0 1 0 9-9 9.74 9.74 0 0 0-6.74 2.74L3 8" />
        <polyline points="3 3 3 8 8 8" />
        <line x1="12" y1="7"  x2="12" y2="12" />
        <line x1="12" y1="12" x2="15" y2="15" />
    </svg>
);

// ── Target (gaps detectados) ───────────────────────────────────────────────
export const IconTarget = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

// ── Sparkles (intro / empty state positivo) ────────────────────────────────
export const IconSparkles = ({ size = 16 }) => (
    <svg {...baseProps(size)}>
        <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z" />
        <path d="M19 3v4" />
        <path d="M21 5h-4" />
        <path d="M5 17v4" />
        <path d="M7 19H3" />
    </svg>
);

// ── Check / X / Alert (feedback) ───────────────────────────────────────────
export const IconCheck = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const IconX = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <line x1="18" y1="6"  x2="6"  y2="18" />
        <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
);

// ── Trophy (score alto) ────────────────────────────────────────────────────
export const IconTrophy = ({ size = 22 }) => (
    <svg {...baseProps(size)}>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
        <path d="M7 5H4a2 2 0 0 0-2 2v0a4 4 0 0 0 4 4h1" />
        <path d="M17 5h3a2 2 0 0 1 2 2v0a4 4 0 0 1-4 4h-1" />
    </svg>
);

// ── ThumbsUp (score medio) ─────────────────────────────────────────────────
export const IconThumbsUp = ({ size = 22 }) => (
    <svg {...baseProps(size)}>
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7V10l4-9a3 3 0 0 1 3 3z" />
    </svg>
);

// ── Book (score bajo, "a estudiar") ────────────────────────────────────────
export const IconBook = ({ size = 22 }) => (
    <svg {...baseProps(size)}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

// ── Search ─────────────────────────────────────────────────────────────────
export const IconSearch = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// ── Chevron right (chips, next) ────────────────────────────────────────────
export const IconChevronRight = ({ size = 12 }) => (
    <svg {...baseProps(size)}>
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// ── ArrowUpRight (links externos) ──────────────────────────────────────────
export const IconArrowUpRight = ({ size = 14 }) => (
    <svg {...baseProps(size)}>
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
    </svg>
);
