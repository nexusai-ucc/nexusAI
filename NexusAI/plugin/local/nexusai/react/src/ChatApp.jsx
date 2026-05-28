/**
 * ChatApp — componente principal del widget de NexusAI.
 *
 * Sprint 1: UI completa de chat (lista de mensajes, input, loader,
 * manejo de errores, auto-scroll) + cliente API que apunta al endpoint
 * `local_nexusai_chat_send` de Moodle.
 *
 * Sprint 2: markdown rendering en respuestas del LLM y pills de fuentes.
 *
 * Sprint 3+: rediseño shadcn/ui — header neutro con avatar y dot de estado,
 * suggestion chips en bienvenida, footer limpio, FAB SVG, tipografía refinada.
 *
 * Props (vienen desde lib.php / classes/hook/output/before_footer_listener.php):
 *   - courseid:  ID del curso actual de Moodle
 *   - userid:    ID del usuario logueado
 *   - sesskey:   token CSRF de Moodle
 *   - wwwroot:   URL base de Moodle (debug)
 *   - lang:      'es' | 'en'
 */

import { useEffect, useRef, useState } from "react";

import ChatInput from "./components/ChatInput.jsx";
import MessageBubble from "./components/MessageBubble.jsx";
import TypingIndicator from "./components/TypingIndicator.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import { sendMessage } from "./api/chat.js";

const STRINGS = {
    es: {
        title:        "Asistente NexusAI",
        statusActive: "Activo · basado en tu curso",
        close:        "Cerrar",
        open:         "Abrir chat",
        welcome:      "Hola, soy tu asistente de estudio. Puedo responder preguntas sobre el contenido de esta materia.",
        chipsLabel:   "O elegí una consulta frecuente:",
        placeholder:  "Preguntá lo que quieras sobre esta materia...",
        errorGeneric: "Algo salió mal. Tocá «Reintentar» para volver a enviar tu pregunta.",
        errorRetry:   "Reintentar",
        errorDismiss: "Descartar",
        clearChat:    "Nueva conversación",
        modeMock:     "demo",
        poweredBy:    "Respuestas basadas en el contenido de tu curso",
        chips: [
            "¿Qué temas entran en el parcial?",
            "Resumí los conceptos clave del último tema",
            "Haceme un quiz de práctica",
        ],
    },
    en: {
        title:        "NexusAI Assistant",
        statusActive: "Active · based on your course",
        close:        "Close",
        open:         "Open chat",
        welcome:      "Hi! I'm your study assistant. I can answer questions about the content of this course.",
        chipsLabel:   "Or choose a common question:",
        placeholder:  "Ask anything about this course...",
        errorGeneric: "Something went wrong. Tap «Retry» to send your message again.",
        errorRetry:   "Retry",
        errorDismiss: "Dismiss",
        clearChat:    "New conversation",
        modeMock:     "demo",
        poweredBy:    "Answers based on your course content",
        chips: [
            "What topics are on the exam?",
            "Summarize the key concepts from the last topic",
            "Give me a practice quiz",
        ],
    },
};

function isInsideMoodle() {
    return typeof window !== "undefined" && window.M && window.M.cfg;
}

/* ---- Iconos SVG inline ---- */
const IconSparkle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
    </svg>
);

const IconClose = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const IconNewChat = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
);

const IconArrow = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
    </svg>
);

const IconFABOpen = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const IconFABClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const IconLightning = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9z"/>
    </svg>
);

export default function ChatApp({ courseid, userid, sesskey, wwwroot, lang = "es" }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastQuestion, setLastQuestion] = useState(null);
    const [multiCourse, setMultiCourse] = useState(false);
    const [activeTab, setActiveTab] = useState("chat"); // "chat" | "search"

    const t = STRINGS[lang] || STRINGS.es;
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const el = messagesEndRef.current;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading, open]);

    const send = async (question) => {
        setError(null);
        setLastQuestion(question);

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
                multiCourse,
            });
            setSessionId(response.session_id);
            setMessages(response.messages || []);
        } catch (err) {
            console.error("[NexusAI] sendMessage failed:", err);
            setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
            setError(err.message || t.errorGeneric);
        } finally {
            setLoading(false);
        }
    };

    const retry = () => { if (lastQuestion) send(lastQuestion); };

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
                <span className="nexusai-fab__icon">
                    {open ? <IconFABClose /> : <IconFABOpen />}
                </span>
            </button>

            {open && (
                <div className="nexusai-panel" role="dialog" aria-labelledby="nexusai-title">

                    {/* Header */}
                    <header className="nexusai-panel__header">
                        <div className="nexusai-panel__title-wrap">
                            <div className="nexusai-panel__avatar">
                                <IconSparkle />
                            </div>
                            <div className="nexusai-panel__title-group">
                                <h3 id="nexusai-title" className="nexusai-panel__title">
                                    {t.title}
                                </h3>
                                <div className="nexusai-panel__status">
                                    <span className="nexusai-panel__status-dot" />
                                    {!isInsideMoodle()
                                        ? <span className="nexusai-badge">{t.modeMock}</span>
                                        : multiCourse
                                            ? (lang === "es" ? "Activo · todos tus cursos" : "Active · all your courses")
                                            : t.statusActive
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="nexusai-panel__actions">
                            <button
                                type="button"
                                className={`nexusai-icon-btn nexusai-multicourse-toggle ${multiCourse ? "nexusai-multicourse-toggle--active" : ""}`}
                                onClick={() => {
                                    setMultiCourse((v) => !v);
                                    clearChat();
                                }}
                                aria-label={multiCourse
                                    ? (lang === "es" ? "Buscar solo en este curso" : "Limit to this course")
                                    : (lang === "es" ? "Buscar en todos tus cursos" : "Search all your courses")
                                }
                                title={multiCourse
                                    ? (lang === "es" ? "Buscando en todos tus cursos (click para solo este curso)" : "Searching all courses (click to limit to this course)")
                                    : (lang === "es" ? "Solo este curso (click para buscar en todos tus cursos)" : "This course only (click to search all your courses)")
                                }
                            >
                                {multiCourse ? "🌐" : "📚"}
                            </button>
                            {messages.length > 0 && (
                                <button
                                    type="button"
                                    className="nexusai-icon-btn"
                                    onClick={clearChat}
                                    aria-label={t.clearChat}
                                    title={t.clearChat}
                                >
                                    <IconNewChat />
                                </button>
                            )}
                            <button
                                type="button"
                                className="nexusai-icon-btn"
                                onClick={() => setOpen(false)}
                                aria-label={t.close}
                                title={t.close}
                            >
                                <IconClose />
                            </button>
                        </div>
                    </header>

                    {/* Pestañas: Chat / Buscador */}
                    <div className="nexusai-tabs">
                        <button
                            type="button"
                            className={`nexusai-tab ${activeTab === "chat" ? "nexusai-tab--active" : ""}`}
                            onClick={() => setActiveTab("chat")}
                        >
                            {lang === "es" ? "Chat" : "Chat"}
                        </button>
                        <button
                            type="button"
                            className={`nexusai-tab ${activeTab === "search" ? "nexusai-tab--active" : ""}`}
                            onClick={() => setActiveTab("search")}
                        >
                            {lang === "es" ? "Buscador" : "Search"}
                        </button>
                    </div>

                    {activeTab === "chat" ? (
                    <>
                    {/* Mensajes */}
                    <div className="nexusai-panel__body">
                        {showWelcome && (
                            <div className="nexusai-welcome">
                                <div className="nexusai-welcome__icon-wrap">
                                    <IconSparkle />
                                </div>
                                <p className="nexusai-welcome__text">{t.welcome}</p>
                                <div className="nexusai-welcome__chips">
                                    {t.chips.map((chip) => (
                                        <button
                                            key={chip}
                                            type="button"
                                            className="nexusai-chip"
                                            onClick={() => send(chip)}
                                        >
                                            {chip}
                                            <span className="nexusai-chip__arrow">
                                                <IconArrow />
                                            </span>
                                        </button>
                                    ))}
                                </div>
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

                    {/* Footer */}
                    <footer className="nexusai-panel__footer">
                        <IconLightning />
                        <span>{t.poweredBy}</span>
                    </footer>
                    </>
                    ) : (
                        <div className="nexusai-panel__body">
                            <SearchPanel courseId={courseid} lang={lang} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
