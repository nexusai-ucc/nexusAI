/**
 * Burbuja individual de mensaje. Diferencia visualmente user vs assistant.
 *
 * Convención de roles (tiene que coincidir con el backend):
 *   - "user"      → mensaje del alumno  (alineado a la derecha, fondo violeta)
 *   - "assistant" → respuesta del LLM   (alineado a la izquierda, fondo gris)
 *   - "system"    → no se muestra (es solo prompt interno)
 */

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

    return (
        <div className={className}>
            <div className="nexusai-msg__bubble">
                {message.content}
            </div>
            <div className="nexusai-msg__meta">
                {formatTimestamp(message.created_at)}
            </div>
        </div>
    );
}
