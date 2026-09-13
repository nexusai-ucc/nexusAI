import { useState } from "react";

/**
 * BarChart — barras genéricas con tooltip real al hover/foco (ANALYTICS-04,
 * #371). Reemplaza el `title` nativo que usaban antes las secciones de
 * "Uso diario" y "Distribución de puntajes": el `title` del navegador tarda
 * en aparecer, no es alcanzable por teclado y no se puede estilar. Acá el
 * tooltip es un `<span>` posicionado que se muestra por estado, con el mismo
 * evento en mouse (hover) y en foco (teclado), y las columnas son barras
 * scrolleables horizontalmente para no aplastarse con muchos puntos de datos
 * (ventana de 365 días, por ejemplo) — ya existía ese scroll para la sección
 * diaria (UX-16); acá se generaliza a cualquier `BarChart`.
 *
 * No es una librería de gráficos — sigue siendo CSS puro (alto en %), solo
 * que ahora con estado de React para el tooltip en vez de `title`.
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
