/**
 * Burbuja individual de mensaje. Diferencia visualmente user vs assistant.
 *
 * Convención de roles (tiene que coincidir con el backend):
 *   - "user"      → mensaje del alumno  (alineado a la derecha, fondo violeta)
 *                   Se renderiza como texto plano (preserva line breaks).
 *   - "assistant" → respuesta del LLM   (alineado a la izquierda, fondo gris)
 *                   Se renderiza como Markdown porque el LLM devuelve listas,
 *                   negritas, código, etc. — antes salía con asteriscos crudos.
 *   - "system"    → no se muestra (es solo prompt interno)
 *
 * Los mensajes del asistente se renderizan como Markdown usando marked +
 * DOMPurify para sanitizar el HTML resultante. Los mensajes del usuario se
 * muestran como texto plano (pre-wrap) para no procesar markdown del input.
 *
 * Citas de fuente:
 *   El system prompt del backend (services/api/app/chat/router.py) le pide al
 *   LLM citar el archivo de origen así: "según apunte-X.pdf...". Detectamos
 *   esas menciones con un regex y las extraemos al pie de la burbuja como
 *   "pills" / badges, para que se vean prolijas y sea fácil saber de qué
 *   material salió la respuesta sin contaminar el cuerpo del mensaje.
 */

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Matchea menciones tipo "según archivo.pdf", "fuente: apunte-derivadas.pdf",
// "(materia-01.docx)". Es deliberadamente conservador para evitar falsos
// positivos: pide un punto seguido de pdf/docx/txt (case-insensitive).
const SOURCE_REGEX = /([\w\-]+\.(pdf|docx|txt))/gi;

// Configuración de marked: GFM habilitado, links forzados a target=_blank
// para no romper la sesión de Moodle abriendo en el mismo tab.
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
            "a", "hr",
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

/**
 * Extrae los nombres únicos de archivos citados en el texto.
 * Devuelve una lista deduplicada en orden de aparición.
 */
function extractSources(text) {
    if (!text) return [];
    const matches = text.match(SOURCE_REGEX) || [];
    const unique = [];
    const seen = new Set();
    for (const m of matches) {
        const key = m.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(m);
        }
    }
    return unique;
}

export default function MessageBubble({ message }) {
    if (!message || message.role === "system") return null;

    const isUser = message.role === "user";
    const className = `nexusai-msg ${isUser ? "nexusai-msg--user" : "nexusai-msg--assistant"}`;
    const sources = isUser ? [] : extractSources(message.content);

    const htmlContent = useMemo(() => {
        if (isUser) return null;
        return renderMarkdown(message.content);
    }, [isUser, message.content]);

    return (
        <div className={className}>
            <div className="nexusai-msg__bubble">
                {isUser ? (
                    // El usuario escribe lenguaje natural — texto plano, preservando
                    // line breaks (el white-space:pre-wrap del CSS hace ese trabajo).
                    message.content
                ) : (
                    <div
                        className="nexusai-msg__markdown"
                        // DOMPurify sanitizes before this point.
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                )}
            </div>

            {sources.length > 0 && (
                <div className="nexusai-msg__sources" aria-label="Fuentes citadas">
                    <span className="nexusai-msg__sources-label">📖 Fuentes:</span>
                    {sources.map((src) => (
                        <span key={src} className="nexusai-msg__source-pill">
                            {src}
                        </span>
                    ))}
                </div>
            )}

            <div className="nexusai-msg__meta">
                {formatTimestamp(message.created_at)}
            </div>
        </div>
    );
}
