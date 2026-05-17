/**
 * Burbuja individual de mensaje. Diferencia visualmente user vs assistant.
 *
 * Convención de roles (tiene que coincidir con el backend):
 *   - "user"      → mensaje del alumno  (alineado a la derecha, fondo violeta)
 *   - "assistant" → respuesta del LLM   (alineado a la izquierda, fondo gris)
 *   - "system"    → no se muestra (es solo prompt interno)
 *
 * Los mensajes del asistente se renderizan como Markdown usando marked +
 * DOMPurify para sanitizar el HTML resultante. Los mensajes del usuario se
 * muestran como texto plano (pre-wrap) para no procesar markdown del input.
 */

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Configuración de marked: no aplica GFM tables ni HTML inline para seguridad.
marked.use({
    gfm: true,
    breaks: true,
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
        ALLOWED_ATTR: ["href", "target", "rel"],
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

export default function MessageBubble({ message }) {
    if (!message || message.role === "system") return null;

    const isUser = message.role === "user";
    const className = `nexusai-msg ${isUser ? "nexusai-msg--user" : "nexusai-msg--assistant"}`;

    const htmlContent = useMemo(() => {
        if (isUser) return null;
        return renderMarkdown(message.content);
    }, [isUser, message.content]);

    return (
        <div className={className}>
            <div className="nexusai-msg__bubble">
                {isUser ? (
                    message.content
                ) : (
                    <div
                        className="nexusai-msg__markdown"
                        // DOMPurify sanitizes before this point.
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                )}
            </div>
            <div className="nexusai-msg__meta">
                {formatTimestamp(message.created_at)}
            </div>
        </div>
    );
}
