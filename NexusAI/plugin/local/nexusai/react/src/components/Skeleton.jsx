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
