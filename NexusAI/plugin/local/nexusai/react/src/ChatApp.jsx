/**
 * ChatApp — componente principal del widget de NexusAI.
 *
 * Sprint 1: UI completa de chat (lista de mensajes, input, loader,
 * manejo de errores, auto-scroll) + cliente API que apunta al endpoint
 * `local_nexusai_chat_send` de Moodle. Incluye fallback a modo mock cuando
 * se corre fuera de Moodle (ver react/src/api/chat.js).
 *
 * Sprint 2 (cierre): markdown rendering en respuestas del LLM y pills de
 * fuentes citadas (ver MessageBubble.jsx). El backend ya hace RAG real con
 * pgvector + Gemini, así que cada respuesta puede traer citas tipo
 * "según apunte-X.pdf" que parseamos y mostramos como badges.
 *
 * Sprint 3: streaming de respuestas con SSE, historial de sesiones
 * (GET /sessions), borrar conversación.
 *
 * Props (vienen desde lib.php / classes/hook/output/before_footer_listener.php):
 *   - courseid:  ID del curso actual de Moodle
 *   - userid:    ID del usuario logueado
 *   - sesskey:   token CSRF de Moodle (lo usa core/ajax automáticamente)
 *   - wwwroot:   URL base de Moodle (debug)
 *   - lang:      'es' | 'en'
 */

import { useEffect, useRef, useState } from "react";

import ChatInput from "./components/ChatInput.jsx";
import MessageBubble from "./components/MessageBubble.jsx";
import TypingIndicator from "./components/TypingIndicator.jsx";
import { sendMessage } from "./api/chat.js";

const STRINGS = {
    es: {
        title:        "Asistente NexusAI",
        close:        "Cerrar",
        open:         "Abrir chat",
        welcome:      "¡Hola! Soy el asistente de tu materia. Preguntame lo que necesites sobre el contenido del curso.",
        placeholder:  "Preguntá lo que quieras sobre esta materia...",
        errorGeneric: "Algo salió mal. Tocá «Reintentar» para volver a enviar tu pregunta.",
        errorRetry:   "Reintentar",
        errorDismiss: "Descartar",
        clearChat:    "Nueva conversación",
        modeMock:     "modo demo",
    },
    en: {
        title:        "NexusAI Assistant",
        close:        "Close",
        open:         "Open chat",
        welcome:      "Hi! I'm your course assistant. Ask me anything about the course content.",
        placeholder:  "Ask anything about this course...",
        errorGeneric: "Something went wrong. Tap «Retry» to send your message again.",
        errorRetry:   "Retry",
        errorDismiss: "Dismiss",
        clearChat:    "New conversation",
        modeMock:     "demo mode",
    },
};

// Detectar si estamos corriendo dentro de Moodle (vs dev standalone).
// Útil para mostrar un badge "demo mode" cuando no hay backend real.
function isInsideMoodle() {
    return typeof window !== "undefined" && window.M && window.M.cfg;
}

export default function ChatApp({ courseid, userid, sesskey, wwwroot, lang = "es" }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastQuestion, setLastQuestion] = useState(null);  // Para retry

    const t = STRINGS[lang] || STRINGS.es;
    const messagesEndRef = useRef(null);

    // Auto-scroll al fondo cuando llegan mensajes nuevos o cuando aparece el loader.
    useEffect(() => {
        if (!open) return;
        const el = messagesEndRef.current;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading, open]);

    const send = async (question) => {
        setError(null);
        setLastQuestion(question);

        // Optimistic UI: mostrar el mensaje del user inmediatamente, sin esperar al server.
        const optimisticUserMsg = {
            id: `local-${Date.now()}`,
            role: "user",
            content: question,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticUserMsg]);
        setLoading(true);

        try {
            const response = await sendMessage({
                question,
                courseId: courseid,
                userId: userid,
                sessionId,
            });

            // El backend devuelve la lista canónica de mensajes — la usamos
            // como fuente de verdad y descartamos el optimistic.
            setSessionId(response.session_id);
            setMessages(response.messages || []);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[NexusAI] sendMessage failed:", err);
            // Quitar el mensaje optimistic para que el usuario pueda reintentar.
            setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
            setError(err.message || t.errorGeneric);
        } finally {
            setLoading(false);
        }
    };

    const retry = () => {
        if (lastQuestion) {
            send(lastQuestion);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setSessionId(null);
        setError(null);
        setLastQuestion(null);
    };

    const showWelcome = messages.length === 0 && !loading && !error;

    return (
        <div className="nexusai-widget">
            {/* Floating Action Button */}
            <button
                type="button"
                className="nexusai-fab"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? t.close : t.open}
                title={open ? t.close : t.open}
            >
                {open ? "×" : "💬"}
            </button>

            {open && (
                <div className="nexusai-panel" role="dialog" aria-labelledby="nexusai-title">
                    <header className="nexusai-panel__header">
                        <div className="nexusai-panel__title-wrap">
                            <h3 id="nexusai-title" className="nexusai-panel__title">
                                {t.title}
                            </h3>
                            {!isInsideMoodle() && (
                                <span className="nexusai-badge" title="Sin Moodle: las respuestas son simuladas.">
                                    {t.modeMock}
                                </span>
                            )}
                        </div>
                        <div className="nexusai-panel__actions">
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    className="nexusai-icon-btn"
                                    onClick={clearChat}
                                    aria-label={t.clearChat}
                                    title={t.clearChat}
                                >
                                    {/* Icono "nuevo chat" — papel + lápiz */}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8z"></path>
                                        <line x1="9" y1="13" x2="15" y2="13"></line>
                                        <line x1="12" y1="10" x2="12" y2="16"></line>
                                    </svg>
                                </button>
                            )}
                            <button
                                type="button"
                                className="nexusai-icon-btn"
                                onClick={() => setOpen(false)}
                                aria-label={t.close}
                            >
                                ×
                            </button>
                        </div>
                    </header>

                    <div className="nexusai-panel__body">
                        {showWelcome && (
                            <div className="nexusai-welcome">
                                <div className="nexusai-welcome__icon">✨</div>
                                <p className="nexusai-welcome__text">{t.welcome}</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {loading && <TypingIndicator />}

                        {error && (
                            <div className="nexusai-error" role="alert">
                                <p className="nexusai-error__text">{error || t.errorGeneric}</p>
                                <div className="nexusai-error__actions">
                                    <button
                                        type="button"
                                        className="nexusai-btn nexusai-btn--primary"
                                        onClick={retry}
                                    >
                                        {t.errorRetry}
                                    </button>
                                    <button
                                        type="button"
                                        className="nexusai-btn nexusai-btn--ghost"
                                        onClick={() => setError(null)}
                                    >
                                        {t.errorDismiss}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <ChatInput
                        onSend={send}
                        disabled={loading}
                        placeholder={t.placeholder}
                    />

                    <footer className="nexusai-panel__footer">
                        <small>NexusAI v0.2.0 · curso #{courseid} · usuario #{userid}</small>
                    </footer>
                </div>
            )}
        </div>
    );
}
