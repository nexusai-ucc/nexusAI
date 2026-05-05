/**
 * Indicador "el asistente está escribiendo".
 * 3 puntos animados en una burbuja gris (estilo iMessage / WhatsApp).
 *
 * La animación está definida en styles.css con @keyframes nexusai-typing.
 */

export default function TypingIndicator() {
    return (
        <div className="nexusai-msg nexusai-msg--assistant" aria-live="polite" aria-label="El asistente está escribiendo">
            <div className="nexusai-msg__bubble nexusai-typing">
                <span className="nexusai-typing__dot"></span>
                <span className="nexusai-typing__dot"></span>
                <span className="nexusai-typing__dot"></span>
            </div>
        </div>
    );
}
