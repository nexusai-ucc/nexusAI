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
import temml from "temml";
import { IconFile, IconSparkles, IconX } from "./icons.jsx";

// Regex conservador para detectar archivos citados en el texto del LLM.
const SOURCE_REGEX = /([\w\-]+\.(pdf|docx|txt))/gi;

// ASIST-04 (#360): notación matemática en LaTeX.
//
// El chat no usa react-markdown (el import está en package.json pero nadie lo
// usa) — renderiza con `marked` + DOMPurify. Así que en vez de remark-math +
// rehype-katex sumamos una extensión de `marked` que matchea $...$ / $$...$$ y
// los renderiza con Temml (LaTeX → MathML).
//
// Temml en vez de KaTeX porque KaTeX pesa ~110KB más y necesita su CSS +
// ~1MB de fuentes woff (webpack acá no tiene regla para assets de fuente, y
// los chunks/publicPath de Moodle ya dieron problemas antes — ver
// webpack.config.js). Temml genera MathML puro que el navegador dibuja
// nativo, sin CSS ni fuentes. Cubre todo lo que el chat mostraría (pérdidas,
// distancias, probabilidades, sumatorias, fracciones).
const mathExtension = {
    name: "nexusaiMath",
    level: "inline",
    start(src) {
        const i = src.indexOf("$");
        return i < 0 ? undefined : i;
    },
    tokenizer(src) {
        const block = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (block) {
            return { type: "nexusaiMath", raw: block[0], text: block[1].trim(), display: true };
        }
        // Inline: sin espacio pegado a los $, sin $ ni saltos de línea adentro.
        // Evita falsos positivos tipo "cuesta $5 o $10".
        const inline = /^\$(?!\s)([^$\n]+?)(?<!\s)\$/.exec(src);
        if (inline) {
            return { type: "nexusaiMath", raw: inline[0], text: inline[1].trim(), display: false };
        }
        return undefined;
    },
    renderer(token) {
        try {
            return temml.renderToString(token.text, {
                throwOnError: false,
                displayMode: token.display,
            });
        } catch {
            return token.raw;
        }
    },
};

// Marked: GFM + links en nueva pestaña + fórmulas LaTeX.
marked.use({
    gfm: true,
    breaks: true,
    extensions: [mathExtension],
    renderer: {
        link(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : "";
            return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
    },
});

// Tags/atributos de MathML que emite Temml. Se suman al allowlist de
// DOMPurify para que las fórmulas sobrevivan al sanitizado sin abrir la
// puerta a HTML arbitrario (no se permite `style` ni `class`: el MathML
// renderiza igual sin ellos).
const MATHML_TAGS = [
    "math", "semantics", "annotation", "mrow", "mi", "mo", "mn", "ms", "mtext",
    "mspace", "msup", "msub", "msubsup", "mfrac", "msqrt", "mroot", "mstyle",
    "munder", "mover", "munderover", "mmultiscripts", "mprescripts", "none",
    "mtable", "mtr", "mtd", "mpadded", "mphantom", "menclose", "mlabeledtr",
];
const MATHML_ATTR = [
    "xmlns", "encoding", "display", "displaystyle", "mathvariant", "scriptlevel",
    "stretchy", "accent", "accentunder", "movablelimits", "columnalign",
    "rowalign", "width", "lspace", "rspace", "separator", "fence", "notation",
];

function renderMarkdown(text) {
    const rawHtml = marked.parse(text || "");
    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            "p", "br", "strong", "em", "b", "i", "u", "s", "del",
            "ul", "ol", "li", "code", "pre", "blockquote",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "a", "hr", "table", "thead", "tbody", "tr", "th", "td",
            ...MATHML_TAGS,
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "title", ...MATHML_ATTR],
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

export default function MessageBubble({ message, sesskey }) {
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
    const rawSources = isUser
        ? []
        : (structuredSources && structuredSources.length > 0
            ? structuredSources
            : extractSources(message.content).map((filename) => ({ document_filename: filename })));
    // Dedup por archivo (+curso en multi-curso): nos quedamos con el chunk de
    // mayor similarity de cada (filename, course_id) único. Reduce ruido visual
    // cuando el retrieval devuelve N chunks del mismo PDF — el alumno solo ve
    // UN bubble por archivo. Normalizamos el filename con trim+lower para
    // capturar variaciones invisibles (whitespace, casing) que vengan del
    // backend o del extractor de PDF.
    const sources = useMemo(() => {
        const seen = new Map();
        for (const src of rawSources) {
            const normFile = (src.document_filename || "?").trim().toLowerCase();
            // En multi-curso conservamos un slot por (file, course_id) para no
            // colapsar el mismo PDF subido a dos materias distintas.
            const key = src.course_id != null ? `${src.course_id}::${normFile}` : normFile;
            const prev = seen.get(key);
            const sim     = typeof src.similarity === "number" ? src.similarity : -1;
            const prevSim = prev && typeof prev.similarity === "number" ? prev.similarity : -1;
            if (!prev || sim > prevSim) {
                seen.set(key, src);
            }
        }
        return Array.from(seen.values());
    }, [rawSources]);
    // Mapa { course_id (string|number) → nombre } cuando es multi-curso.
    const courseNames = !isUser && message.course_names ? message.course_names : null;

    const [expandedIdx, setExpandedIdx] = useState(null);
    const markdownRef = useRef(null);

    const htmlContent = useMemo(() => {
        if (isUser) return null;
        return renderMarkdown(message.content);
    }, [isUser, message.content]);

    useCopyButtons(markdownRef, htmlContent);

    // ASIST-06 (#384): respuestas largas se cortan con fade + "Mostrar más".
    // No se evalúa mientras el mensaje sigue en streaming (el alto todavía
    // está cambiando, cortarlo en el medio se vería roto).
    const [longExpanded, setLongExpanded] = useState(false);
    const [needsCollapse, setNeedsCollapse] = useState(false);
    useEffect(() => {
        if (isUser || message.streaming) return;
        const el = markdownRef.current;
        if (!el) return;
        // Truco sin doble render: con el clamp de max-height ya aplicado por
        // CSS, scrollHeight sigue reportando el alto real del contenido —
        // si es mayor al alto visible clampeado, hace falta el botón.
        setNeedsCollapse(el.scrollHeight > el.clientHeight + 4);
    }, [isUser, message.streaming, htmlContent]);

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
                    <div className="nexusai-msg__markdown-clamp">
                        <div
                            ref={markdownRef}
                            className={[
                                "nexusai-msg__markdown",
                                message.streaming ? "nexusai-msg__markdown--streaming" : "",
                                // El clamp se aplica siempre que no esté expandido y no esté
                                // streameando — si el contenido ya entra en el alto máximo, no
                                // tiene ningún efecto visual (scrollHeight === clientHeight,
                                // needsCollapse da false solo). Es lo que permite medir "¿hizo
                                // falta cortar?" después de renderizar, sin un segundo render
                                // sin clamp. Mientras streamea NO se clampea — si no, el texto
                                // que sigue llegando se recortaría en silencio, sin fade ni
                                // botón todavía (needsCollapse recién se calcula al terminar).
                                !message.streaming && !longExpanded ? "nexusai-msg__markdown--collapsed" : "",
                            ].filter(Boolean).join(" ")}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                        {needsCollapse && !longExpanded && (
                            <div className="nexusai-msg__markdown-fade" aria-hidden="true" />
                        )}
                    </div>
                    {needsCollapse && (
                        <button
                            type="button"
                            className="nexusai-msg__show-more-btn"
                            onClick={() => setLongExpanded((v) => !v)}
                        >
                            {longExpanded ? "Mostrar menos" : "Mostrar más"}
                        </button>
                    )}
                </div>
            </div>

            {sources.length > 0 && message.has_relevant_context !== false && (
                <div className="nexusai-msg__sources-wrap" style={{ paddingLeft: "34px" }}>
                    <div className="nexusai-msg__sources" aria-label="Fuentes citadas">
                        <span className="nexusai-msg__sources-label">Fuentes:</span>
                        {sources.map((src, i) => {
                            const key = `${src.document_filename}-${src.chunk_index ?? "x"}-${i}`;
                            const hasDownload = !!src.document_id;
                            const hasContent = !!src.content;
                            const isClickable = hasDownload || hasContent;
                            const isOpen = expandedIdx === i;
                            // En multi-curso, mostrar el nombre del curso al lado del archivo.
                            const courseLabel = (courseNames && src.course_id)
                                ? (courseNames[String(src.course_id)] || courseNames[src.course_id])
                                : null;
                            const handleClick = () => {
                                if (hasDownload) {
                                    const params = new URLSearchParams({
                                        document_id: src.document_id,
                                        courseid: String(src.course_id || ""),
                                        sesskey: sesskey || "",
                                    });
                                    window.open(
                                        `/local/nexusai/document_download.php?${params}`,
                                        "_blank",
                                        "noopener,noreferrer"
                                    );
                                } else if (hasContent) {
                                    setExpandedIdx(isOpen ? null : i);
                                }
                            };
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`nexusai-msg__source-pill ${isClickable ? "nexusai-msg__source-pill--clickable" : ""} ${!hasDownload && isOpen ? "nexusai-msg__source-pill--active" : ""}`}
                                    onClick={handleClick}
                                    disabled={!isClickable}
                                    title={hasDownload ? "Descargar archivo original" : undefined}
                                >
                                    <IconDoc />
                                    {courseLabel && (
                                        <span className="nexusai-msg__source-course">
                                            {courseLabel}
                                        </span>
                                    )}
                                    <span className="nexusai-msg__source-filename">
                                        {src.document_filename}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {expandedIdx !== null && sources[expandedIdx]?.content && (() => {
                        const exp = sources[expandedIdx];
                        const expCourse = (courseNames && exp.course_id)
                            ? (courseNames[String(exp.course_id)] || courseNames[exp.course_id])
                            : null;
                        return (
                            <div className="nexusai-msg__source-panel">
                                <div className="nexusai-msg__source-panel-header">
                                    <span className="nexusai-msg__source-panel-file">
                                        <IconFile size={13} />
                                        {expCourse && <span className="nexusai-msg__source-panel-course">{expCourse}</span>}
                                        <span>{exp.document_filename}</span>
                                        {typeof exp.chunk_index === "number" &&
                                            ` · fragmento #${exp.chunk_index}`}
                                    </span>
                                    <button
                                        type="button"
                                        className="nexusai-msg__source-panel-close"
                                        onClick={() => setExpandedIdx(null)}
                                        aria-label="Cerrar"
                                    >
                                        <IconX size={14} />
                                    </button>
                                </div>
                                <p className="nexusai-msg__source-panel-content">
                                    {exp.content}
                                </p>
                            </div>
                        );
                    })()}
                </div>
            )}

            <div className="nexusai-msg__meta" style={{ paddingLeft: "34px" }}>
                {formatTimestamp(message.created_at)}
            </div>
        </div>
    );
}
