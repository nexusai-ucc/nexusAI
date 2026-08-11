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
import StudyPanel from "./components/StudyPanel.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import CalendarPanel from "./components/CalendarPanel.jsx";
import HistoryDropdown from "./components/HistoryDropdown.jsx";
import NavMenu from "./components/NavMenu.jsx";
import { IconBookOpen, IconGlobe, IconGrid } from "./components/icons.jsx";
import { sendMessage, sendMessageStream } from "./api/chat.js";
import { getSessionMessages } from "./api/history.js";

const SECTION_TITLES = {
    study:    { es: "Modo Estudio", en: "Study Mode" },
    search:   { es: "Buscar",       en: "Search" },
    calendar: { es: "Calendario",   en: "Calendar" },
};

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
        noCourseMessage: "Abrí esto desde dentro de un curso para usarlo.",
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
        noCourseMessage: "Open this from inside a course to use it.",
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

// RDS-01: sidebar acoplado — angosta el contenido real del curso al abrir.
// #page-content es el wrapper de Boost que ya trae `transition: all` propio,
// así que el margin-right anima solo sin CSS de transición nuestro. Si el
// theme no tiene ese selector (no es Boost), el push simplemente no aplica.
const PAGE_CONTENT_SELECTOR = "#page-content";
const SIDEBAR_WIDTH = 400;
const PUSH_MIN_VIEWPORT = 768;

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

const IconLightning = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9z"/>
    </svg>
);

const IconHistory = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3"/>
        <path d="M3.05 11a9 9 0 1 1 .5 4"/>
        <polyline points="3 4 3 9 8 9"/>
    </svg>
);

const IconBack = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
    </svg>
);

export default function ChatApp({ courseid, userid, sesskey, wwwroot, lang = "es", isteacher = 0 }) {
    const isTeacher = !!isteacher;
    const hasCourse = Number(courseid) > 0;
    // El click en el ícono de la navbar (fuera de este árbol de React) puede
    // llegar antes de que el bundle termine de hidratar — window.__nexusaiPanelOpenState
    // lo deja "pegado" para que el estado inicial ya lo refleje al montar.
    const [open, setOpen] = useState(
        () => typeof window !== "undefined" && !!window.__nexusaiPanelOpenState
    );
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastQuestion, setLastQuestion] = useState(null);
    const [multiCourse, setMultiCourse] = useState(false);
    const [activeTab, setActiveTab] = useState("chat"); // "chat" | "study" | "calendar" | "search"
    const [historyOpen, setHistoryOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);

    const t = STRINGS[lang] || STRINGS.es;
    const messagesEndRef = useRef(null);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const el = messagesEndRef.current;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading, open]);

    // Sincronización con el ícono de la navbar (fuera de React) — ver
    // amd/src/nav-trigger.js, que dispara este evento en cada click.
    useEffect(() => {
        const handleToggle = () => setOpen((v) => !v);
        window.addEventListener("nexusai:toggle-panel", handleToggle);
        return () => window.removeEventListener("nexusai:toggle-panel", handleToggle);
    }, []);

    // RDS-01: sidebar acoplado — angosta #page-content al abrir, en vez de
    // cerrarse solo con un click afuera (ese comportamiento tenía sentido
    // para un dropdown flotante, pero rompería la razón de ser de un panel
    // docked: se cierra con su propio botón o el riel colapsado).
    useEffect(() => {
        const el = document.querySelector(PAGE_CONTENT_SELECTOR);
        if (!el) return; // theme sin ese selector — fallback silencioso, no rompe nada
        if (open && window.innerWidth >= PUSH_MIN_VIEWPORT) {
            el.style.marginRight = `${SIDEBAR_WIDTH}px`;
        } else {
            el.style.marginRight = "";
        }
        return () => { el.style.marginRight = ""; };
    }, [open]);

    const send = async (question) => {
        setError(null);
        setLastQuestion(question);

        const ts = Date.now();
        const optimisticUserMsg = {
            id: `local-user-${ts}`,
            role: "user",
            content: question,
            created_at: new Date().toISOString(),
        };
        const streamingAssistantId = `local-asst-${ts}`;
        // Captured here so onAnswerMeta's closure never races with a future send().
        const assistantId = streamingAssistantId;
        const initialAssistant = {
            id: streamingAssistantId,
            role: "assistant",
            content: "",
            created_at: new Date(ts + 1).toISOString(),
            streaming: true,
        };
        setMessages((prev) => [...prev, optimisticUserMsg, initialAssistant]);
        setLoading(true);

        // Acumulador local — los callbacks de SSE corren en ráfagas y queremos
        // evitar batch races. Usamos ref vía closure.
        let acc = "";
        const appendToken = (token) => {
            acc += token;
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === streamingAssistantId ? { ...m, content: acc } : m
                )
            );
        };

        // Bufferamos grounded para aplicarlo DESPUÉS de que el stream cierre,
        // evitando cualquier race con el estado de streaming.
        let bufferedGrounded;

        try {
            await sendMessageStream(
                {
                    question,
                    courseId: courseid,
                    sessionId,
                    multiCourse,
                },
                {
                    onMeta: ({ session_id, sources, course_names, has_relevant_context }) => {
                        if (session_id) setSessionId(session_id);
                        if (Array.isArray(sources)) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === streamingAssistantId
                                        ? {
                                            ...m,
                                            sources,
                                            course_names: course_names || null,
                                            has_relevant_context: has_relevant_context !== false,
                                          }
                                        : m
                                )
                            );
                        }
                    },
                    onToken: appendToken,
                    onAnswerMeta: ({ grounded }) => {
                        bufferedGrounded = grounded;
                    },
                    onDone: () => {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === streamingAssistantId
                                    ? { ...m, streaming: false }
                                    : m
                            )
                        );
                    },
                    onError: (detail) => {
                        throw new Error(detail);
                    },
                }
            );
            // Aplicar la señal grounded del backend tras el cierre del stream.
            // Si grounded===false el LLM no pudo responder con el material →
            // ocultar fuentes aunque el retrieval haya devuelto chunks.
            if (bufferedGrounded === false) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId
                            ? { ...m, has_relevant_context: false }
                            : m
                    )
                );
            }
        } catch (err) {
            // Sacamos el bubble de assistant vacío + user optimista si el stream falló.
            setMessages((prev) =>
                prev.filter(
                    (m) => m.id !== optimisticUserMsg.id && m.id !== streamingAssistantId
                )
            );
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

    const loadSession = async (id) => {
        if (!id) return;
        setHistoryOpen(false);
        setError(null);
        setLoading(true);
        try {
            const data = await getSessionMessages({ courseId: courseid, sessionId: id });
            setSessionId(data.session_id);
            setMessages(data.messages || []);
            setLastQuestion(null);
        } catch (err) {
            setError(err.message || "No se pudo cargar la conversación");
        } finally {
            setLoading(false);
        }
    };

    const showWelcome = messages.length === 0 && !loading && !error;

    return (
        <div className="nexusai-widget" ref={widgetRef}>
            {!open && (
                <button
                    type="button"
                    className="nexusai-rail"
                    onClick={() => setOpen(true)}
                    aria-label={t.open}
                    title={t.open}
                >
                    <span className="nexusai-rail__icon"><IconSparkle /></span>
                    <span className="nexusai-rail__label">{t.title}</span>
                </button>
            )}
            {open && (
                <div
                    className="nexusai-panel"
                    ref={panelRef}
                    role="dialog"
                    aria-labelledby="nexusai-title"
                >
                    {/* Header */}
                    <header className="nexusai-panel__header">
                        {activeTab === "chat" ? (
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
                                            : !hasCourse
                                                ? (lang === "es" ? "Fuera de un curso" : "Outside a course")
                                                : multiCourse
                                                    ? (lang === "es" ? "Activo · todos tus cursos" : "Active · all your courses")
                                                    : t.statusActive
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="nexusai-panel__title-wrap">
                                <button
                                    type="button"
                                    className="nexusai-icon-btn nexusai-panel__back-btn"
                                    onClick={() => setActiveTab("chat")}
                                    aria-label={lang === "es" ? "Volver al chat" : "Back to chat"}
                                    title={lang === "es" ? "Volver al chat" : "Back to chat"}
                                >
                                    <IconBack />
                                </button>
                                <h3 id="nexusai-title" className="nexusai-panel__title">
                                    {SECTION_TITLES[activeTab]?.[lang === "es" ? "es" : "en"]}
                                </h3>
                            </div>
                        )}

                        <div className="nexusai-panel__actions">
                            {hasCourse && (
                                <button
                                    type="button"
                                    className={`nexusai-icon-btn nexusai-nav-toggle ${navOpen ? "nexusai-nav-toggle--active" : ""}`}
                                    onClick={() => setNavOpen((v) => !v)}
                                    aria-label={lang === "es" ? "Navegación" : "Navigation"}
                                    title={lang === "es" ? "Ir a..." : "Go to..."}
                                >
                                    <IconGrid />
                                </button>
                            )}
                            {hasCourse && activeTab === "chat" && (
                                <button
                                    type="button"
                                    className={`nexusai-icon-btn nexusai-history-toggle ${historyOpen ? "nexusai-history-toggle--active" : ""}`}
                                    onClick={() => setHistoryOpen((v) => !v)}
                                    aria-label={lang === "es" ? "Historial" : "History"}
                                    title={lang === "es" ? "Conversaciones previas" : "Previous conversations"}
                                >
                                    <IconHistory />
                                </button>
                            )}
                            {hasCourse && (activeTab === "chat" || activeTab === "search") && (
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
                                    {multiCourse ? <IconGlobe /> : <IconBookOpen />}
                                </button>
                            )}
                            {activeTab === "chat" && messages.length > 0 && (
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

                    {!hasCourse ? (
                        <div className="nexusai-panel__body nexusai-panel__body--empty">
                            <div className="nexusai-welcome__icon-wrap">
                                <IconSparkle />
                            </div>
                            <p className="nexusai-welcome__text">{t.noCourseMessage}</p>
                        </div>
                    ) : (
                    <>
                    <HistoryDropdown
                        open={historyOpen}
                        onClose={() => setHistoryOpen(false)}
                        courseId={courseid}
                        currentSessionId={sessionId}
                        onSelectSession={loadSession}
                        lang={lang}
                    />

                    <NavMenu
                        open={navOpen}
                        onClose={() => setNavOpen(false)}
                        activeTab={activeTab}
                        onSelect={setActiveTab}
                        isTeacher={isTeacher}
                        lang={lang}
                    />

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
                            <MessageBubble key={msg.id} message={msg} sesskey={sesskey} />
                        ))}

                        {loading && !messages.some((m) => m.streaming && m.content) && <TypingIndicator />}

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
                    ) : activeTab === "study" ? (
                        <div className="nexusai-panel__body">
                            <StudyPanel courseId={courseid} sesskey={sesskey} lang={lang} />
                        </div>
                    ) : activeTab === "calendar" ? (
                        <div className="nexusai-panel__body">
                            <CalendarPanel courseId={courseid} lang={lang} />
                        </div>
                    ) : (
                        <div className="nexusai-panel__body">
                            <SearchPanel
                                courseId={courseid}
                                sesskey={sesskey}
                                isTeacher={false}
                                lang={lang}
                                scopeOverride={multiCourse}
                            />
                        </div>
                    )}
                    </>
                    )}
                </div>
            )}
        </div>
    );
}
