// UX-12 (#370): bloque de carga reutilizable. Antes los tres paneles del
// docente (Material, Analytics, FAQ) mostraban el mismo spinner centrado
// genérico (`.nexusai-loading` → "Cargando..."). Este componente chico y
// sin estado dibuja barras/bloques con shimmer para armar la silueta
// aproximada del contenido real mientras carga. Mismo criterio liviano
// que Tooltip.jsx / Toast.jsx: cero dependencias, solo CSS.

// Una barra/bloque individual. `width` y `height` aceptan cualquier unidad
// CSS (por defecto ancho 100%, alto 12px). `radius` para cuadrados/círculos.
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

// Contenedor de un skeleton de pantalla completa. Envuelve la silueta y
// expone el estado de carga a lectores de pantalla con un texto sr-only
// (los <Skeleton> individuales van `aria-hidden`).
export function SkeletonScreen({ label, className = "", children }) {
    return (
        <div className={`nexusai-skeleton-screen ${className}`} role="status" aria-live="polite">
            <span className="nexusai-sr-only">{label}</span>
            {children}
        </div>
    );
}

// Grupo de N líneas de texto de anchos decrecientes (la última más corta),
// útil para párrafos y listas.
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
