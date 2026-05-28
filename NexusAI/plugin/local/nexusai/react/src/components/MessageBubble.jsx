/**
 * MessageBubble — burbuja individual de mensaje.
 *
 * Cambios sprint 3 (rediseño shadcn/ui):
 *   - Avatar del asistente (icono N con fondo violeta suave) a la izquierda.
 *   - Burbuja del asistente: fondo blanco + border + shadow-sm (estilo card).
 *   - Copy button on-hover en bloques de código (post-render con useEffect).
 *   - Source pills refinadas con borde y color primary.
 *   - Timestamp más sutil.
 *
 * Roles:
 *   - "user"      → alineado a la derecha, fondo primary violeta.
 *   - "assistant" → alineado a la izquierda, card blanca con borde.
 *   - "system"    → no se muestra.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Regex conservador para detectar archivos citados en el texto del LLM.
const SOURCE_REGEX = /([\w\-]+\.(pdf|docx|txt))/gi;

// Marked: GFM + links en nueva pestaña.
marked.use({
    gfm: true,
    breaks: true,
    renderer: {
        link(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : "";
            return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
    },
});

function renderMarkdown(text) {
    const rawHtml = marked.parse(text || "");
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            "p", "br", "strong", "em", "b", "i", "u", "s", "del",
            "ul", "ol", "li", "code", "pre", "blockquote",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "hr", "table", "thead", "tbody", "tr", "th", "td",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "title"],
        FORCE_BODY: false,
    });
}

function formatTimestamp(isoString) {
    if (!isoString) return "";
    try {
        const date = new Date(isoString);
        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    } catch {
        return "";
    }
}

function extractSources(text) {
    if (!text) return [];
    const matches = text.match(SOURCE_REGEX) || [];
    const unique = [];
    const seen = new Set();
    for (const m of matches) {
        const key = m.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(m); }
    }
    return unique;
}

/* ---- Icono del avatar del asistente ---- */
const IconAssistant = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
);

const IconDoc = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
    </svg>
);

/**
 * Hook que inyecta botones "Copiar" en los bloques <pre> del markdown
 * del asistente, después de que React renderiza el HTML sanitizado.
 */
function useCopyButtons(ref, htmlContent) {
    useEffect(() => {
        if (!ref.current) return;
        const pres = ref.current.querySelectorAll("pre");

        pres.forEach((pre) => {
            // Evitar doble inyección si el componente re-renderiza.
            if (pre.querySelector(".nexusai-copy-btn")) return;

            // Wrapeamos el pre con un div relativo para poder posicionar el botón.
            const wrapper = document.createElement("div");
            wrapper.className = "nexusai-code-block";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "nexusai-copy-btn";
            btn.textContent = "Copiar";

            btn.addEventListener("click", async () => {
                const code = pre.querySelector("code");
                const text = code ? code.innerText : pre.innerText;
                try {
                    await navigator.clipboard.writeText(text);
                    btn.textContent = "✓ Copiado";
                    btn.classList.add("nexusai-copy-btn--copied");
                    setTimeout(() => {
                        btn.textContent = "Copiar";
                        btn.classList.remove("nexusai-copy-btn--copied");
                    }, 2000);
                } catch {
                    btn.textContent = "Error";
                    setTimeout(() => { btn.textContent = "Copiar"; }, 1500);
                }
            });

            wrapper.appendChild(btn);
        });
    }, [htmlContent]);
}

export default function MessageBubble({ message }) {
    if (!message || message.role === "system") return null;
    // Ocultar burbuja del asistente vacía (esperando primer token del stream).
    // El TypingIndicator se muestra en su lugar.
    if (message.role === "assistant" && !message.content && message.streaming) {
        return null;
    }

    const isUser = message.role === "user";
    // Si el backend mandó sources estructuradas (streaming meta event), usarlas.
    // Si no (mensajes viejos sin sources), fallback al regex sobre el texto.
    const structuredSources = !isUser && Array.isArray(message.sources) ? message.sources : null;
    const sources = isUser
        ? []
        : (structuredSources && structuredSources.length > 0
            ? structuredSources
            : extractSources(message.content).map((filename) => ({ document_filename: filename })));
    const [expandedIdx, setExpandedIdx] = useState(null);
    const markdownRef = useRef(null);

    const htmlContent = useMemo(() => {
        if (isUser) return null;
        return renderMarkdown(message.content);
    }, [isUser, message.content]);

    useCopyButtons(markdownRef, htmlContent);

    if (isUser) {
        return (
            <div className="nexusai-msg nexusai-msg--user">
                <div className="nexusai-msg__bubble">
                    {message.content}
                </div>
                <div className="nexusai-msg__meta">
                    {formatTimestamp(message.created_at)}
                </div>
            </div>
        );
    }

    // Mensaje del asistente — layout con avatar
    return (
        <div className="nexusai-msg nexusai-msg--assistant">
            <div className="nexusai-msg__row">
                <div className="nexusai-msg__avatar" aria-hidden="true">
                    <IconAssistant />
                </div>
                <div className="nexusai-msg__bubble">
                    <div
                        ref={markdownRef}
                        className={`nexusai-msg__markdown ${message.streaming ? "nexusai-msg__markdown--streaming" : ""}`}
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </div>
            </div>

            {sources.length > 0 && (
                <div className="nexusai-msg__sources-wrap" style={{ paddingLeft: "34px" }}>
                    <div className="nexusai-msg__sources" aria-label="Fuentes citadas">
                        <span className="nexusai-msg__sources-label">Fuentes:</span>
                        {sources.map((src, i) => {
                            const key = `${src.document_filename}-${src.chunk_index ?? "x"}-${i}`;
                            const hasContent = !!src.content;
                            const isOpen = expandedIdx === i;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`nexusai-msg__source-pill ${hasContent ? "nexusai-msg__source-pill--clickable" : ""} ${isOpen ? "nexusai-msg__source-pill--active" : ""}`}
                                    onClick={() => hasContent && setExpandedIdx(isOpen ? null : i)}
                                    disabled={!hasContent}
                                    aria-expanded={isOpen}
                                >
                                    <IconDoc />
                                    {src.document_filename}
                                    {typeof src.similarity === "number" && (
                                        <span className="nexusai-msg__source-score">
                                            {Math.round(src.similarity * 100)}%
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {expandedIdx !== null && sources[expandedIdx]?.content && (
                        <div className="nexusai-msg__source-panel">
                            <div className="nexusai-msg__source-panel-header">
                                <span className="nexusai-msg__source-panel-file">
                                    📄 {sources[expandedIdx].document_filename}
                                    {typeof sources[expandedIdx].chunk_index === "number" &&
                                        ` · fragmento #${sources[expandedIdx].chunk_index}`}
                                </span>
                                <button
                                    type="button"
                                    className="nexusai-msg__source-panel-close"
                                    onClick={() => setExpandedIdx(null)}
                                    aria-label="Cerrar"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="nexusai-msg__source-panel-content">
                                {sources[expandedIdx].content}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="nexusai-msg__meta" style={{ paddingLeft: "34px" }}>
                {formatTimestamp(message.created_at)}
            </div>
        </div>
    );
}
