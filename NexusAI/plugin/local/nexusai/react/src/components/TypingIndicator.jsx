/**
 * Indicador "el asistente está escribiendo".
 * Rediseñado para usar el mismo layout con avatar que MessageBubble.
 */

const IconAssistant = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
);

export default function TypingIndicator() {
    return (
        <div className="nexusai-msg nexusai-msg--assistant" aria-live="polite" aria-label="El asistente está escribiendo">
            <div className="nexusai-typing">
                <div className="nexusai-msg__avatar" aria-hidden="true">
                    <IconAssistant />
                </div>
                <div className="nexusai-typing__bubble">
                    <span className="nexusai-typing__dot"></span>
                    <span className="nexusai-typing__dot"></span>
                    <span className="nexusai-typing__dot"></span>
                </div>
            </div>
        </div>
    );
}
