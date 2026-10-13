/**
 * ChatApp — main component of the NexusAI widget.
 *
 * Sprint 1: full chat UI (message list, input, loader,
 * error handling, auto-scroll) + API client pointing at Moodle's
 * `local_nexusai_chat_send` endpoint.
 *
 * Sprint 2: markdown rendering of the LLM's answers and source pills.
 *
 * Sprint 3+: shadcn/ui redesign — neutral header with avatar and status dot,
 * suggestion chips on the welcome screen, clean footer, SVG FAB, refined typography.
 *
 * Props (come from lib.php / classes/hook/output/before_footer_listener.php):
 *   - courseid:  ID of the current Moodle course
 *   - userid:    ID of the logged-in user
 *   - sesskey:   Moodle's CSRF token
 *   - wwwroot:   Moodle base URL (debug)
 *   - lang:      'es' | 'en'
 */

import { useEffect, useRef, useState } from "react";

import ChatInput from "./components/ChatInput.jsx";
import MessageBubble from "./components/MessageBubble.jsx";
import TypingIndicator from "./components/TypingIndicator.jsx";
import StudyPanel from "./components/StudyPanel.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import CalendarPanel from "./components/CalendarPanel.jsx";
import ForumDigestPanel from "./components/ForumDigestPanel.jsx";
import HistoryDropdown from "./components/HistoryDropdown.jsx";
import NavMenu from "./components/NavMenu.jsx";
import Tooltip from "./components/Tooltip.jsx";
import OnboardingPanel from "./components/OnboardingPanel.jsx";
import { IconBookOpen, IconGlobe, IconGrid } from "./components/icons.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { getFriendlyErrorMessage } from "./components/errors.js";
import { sendMessage, sendMessageStream } from "./api/chat.js";
import BudgetBar from "./components/BudgetBar.jsx";
import { getSessionMessages } from "./api/history.js";
import { useOnboardingState } from "./onboarding/useOnboardingState.js";

// UX-14 (#373): sessionStorage key for the active tab, per course —
// keeps one course's tab from "leaking" into another in the same session.
function TAB_STORAGE_KEY(courseid) {
    return Number(courseid) > 0 ? `nexusai_tab_${courseid}` : null;
}
const PERSISTABLE_TABS = new Set(["chat", "study", "calendar", "search"]);

const SECTION_TITLES = {
    study:       { es: "Modo Estudio",         en: "Study Mode" },
    search:      { es: "Buscar",               en: "Search" },
    calendar:    { es: "Calendario",           en: "Calendar" },
    history:     { es: "Historial",            en: "History" },
    review:      { es: "Revisión del curso",   en: "Course review" },
    forumdigest: { es: "Resumen del foro",     en: "Forum digest" },
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
    // The click on the navbar icon (outside this React tree) can arrive
    // before the bundle finishes hydrating — window.__nexusaiPanelOpenState
    // keeps it "stuck" so the initial state already reflects it on mount.
    const [open, setOpen] = useState(
        () => typeof window !== "undefined" && !!window.__nexusaiPanelOpenState
    );
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastQuestion, setLastQuestion] = useState(null);
    const [multiCourse, setMultiCourse] = useState(false);
    // DATA-05: increased with each answer to refresh the limit bar.
    const [budgetTick, setBudgetTick] = useState(0);
    // UX-14 (#373): active tab stored in sessionStorage, per course —
    // not lost when navigating to another course page and coming back in the
    // same browser session. Only the 4 "destination" tabs (not history/review,
    // which are one-off action views, not a place to come back to).
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === "undefined" || !TAB_STORAGE_KEY(courseid)) return "chat";
        try {
            const stored = sessionStorage.getItem(TAB_STORAGE_KEY(courseid));
            return PERSISTABLE_TABS.has(stored) ? stored : "chat";
        } catch {
            return "chat";
        }
    }); // "chat" | "history" | "study" | "calendar" | "search" | "review"
    const [navOpen, setNavOpen] = useState(false);

    // ONB-06: course review state, fetched only while that tab is active —
    // same "on demand" approach as StudyPanel/CalendarPanel.
    const {
        setupState: reviewSetupState,
        skipped: reviewSkipped,
        skip: reviewSkip,
        unskip: reviewUnskip,
    } = useOnboardingState(courseid, { enabled: isTeacher && activeTab === "review" });

    const t = STRINGS[lang] || STRINGS.es;
    const messagesEndRef = useRef(null);
    const widgetRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const el = messagesEndRef.current;
        if (el) el.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading, open]);

    // Sync with the navbar icon (outside React) — see
    // amd/src/nav-trigger.js, which fires this event on every click.
    useEffect(() => {
        const handleToggle = () => setOpen((v) => !v);
        window.addEventListener("nexusai:toggle-panel", handleToggle);
        return () => window.removeEventListener("nexusai:toggle-panel", handleToggle);
    }, []);

    // UX-14 (#373): store the active tab. Try/catch because sessionStorage
    // can throw in private mode/with blocked storage — it must not break the
    // widget's render.
    useEffect(() => {
        const key = TAB_STORAGE_KEY(courseid);
        if (!key || !PERSISTABLE_TABS.has(activeTab)) return;
        try {
            sessionStorage.setItem(key, activeTab);
        } catch {
            // Storage blocked — does not affect the current session.
        }
    }, [activeTab, courseid]);

    // UX-13 (#372): global shortcuts, only while the widget is open
    // (outside `open` it intercepts nothing on the page — less surface
    // for conflicts with the browser's/Moodle's native shortcuts).
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setOpen(false);
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                // Same rule as NavMenu to hide "Search": teachers do not have
                // that tab here (they have their own search in NexusAI
                // Materials).
                if (!hasCourse || isTeacher) return;
                e.preventDefault(); // overrides "delete to end of line" (Ctrl+K, macOS) in the textarea
                setNavOpen(false);
                setActiveTab("search");
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, hasCourse, isTeacher]);

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

        // Local accumulator — SSE callbacks run in bursts and we want to
        // avoid batch races. We use a ref through a closure.
        let acc = "";
        const appendToken = (token) => {
            acc += token;
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === streamingAssistantId ? { ...m, content: acc } : m
                )
            );
        };

        // We buffer grounded to apply it AFTER the stream closes,
        // avoiding any race with the streaming state.
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
                    onDone: (doneEvent) => {
                        // ASIST-01 (#321): the local id (`local-asst-...`) is not a
                        // real `messages` UUID — we store the real one in `realId`
                        // (instead of overwriting `id`, which would break the
                        // `bufferedGrounded` matcher below, captured with the local
                        // id) to be able to enable the 👍/👎 feedback only now that
                        // the message is stored.
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === streamingAssistantId
                                    ? { ...m, streaming: false, realId: doneEvent?.assistant_message_id || null }
                                    : m
                            )
                        );
                    },
                    onError: (detail) => {
                        throw new Error(detail);
                    },
                }
            );
            // Apply the backend's grounded signal after the stream closes.
            // If grounded===false the LLM could not answer with the material →
            // hide the sources even if retrieval returned chunks.
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
            // Remove the empty assistant bubble + optimistic user one if the stream failed.
            setMessages((prev) =>
                prev.filter(
                    (m) => m.id !== optimisticUserMsg.id && m.id !== streamingAssistantId
                )
            );
            setError(getFriendlyErrorMessage(err, t.errorGeneric, lang));
        } finally {
            setLoading(false);
            setBudgetTick((n) => n + 1);
        }
    };

    const retry = () => { if (lastQuestion) send(lastQuestion); };

    // ASIST-03 (#359): resends the last question, replacing the last visible
    // user+assistant pair instead of adding a duplicate one.
    // send() always adds a new pair at the end — that is why the previous one
    // has to be removed before calling it again.
    const regenerate = () => {
        if (!lastQuestion || loading) return;
        setMessages((prev) => {
            let idx = prev.length - 1;
            while (idx >= 0 && prev[idx].role !== "assistant") idx--;
            if (idx < 0) return prev;
            const cut = prev[idx - 1]?.role === "user" ? idx - 1 : idx;
            return prev.slice(0, cut);
        });
        send(lastQuestion);
    };

    const clearChat = () => {
        setMessages([]);
        setSessionId(null);
        setError(null);
        setLastQuestion(null);
    };

    const loadSession = async (id) => {
        if (!id) return;
        setActiveTab("chat");
        setError(null);
        setLoading(true);
        try {
            const data = await getSessionMessages({ courseId: courseid, sessionId: id });
            setSessionId(data.session_id);
            const loadedMessages = data.messages || [];
            setMessages(loadedMessages);
            // ASIST-03: derive lastQuestion from the last loaded user message,
            // so "Regenerate" also works on a conversation resumed from the
            // history (it used to stay null).
            const lastUserMsg = [...loadedMessages].reverse().find((m) => m.role === "user");
            setLastQuestion(lastUserMsg?.content || null);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, lang === "es" ? "No se pudo cargar la conversación" : "Couldn't load the conversation", lang));
        } finally {
            setLoading(false);
        }
    };

    const showWelcome = messages.length === 0 && !loading && !error;

    return (
        <div className="nexusai-widget" ref={widgetRef}>
        <ToastProvider>
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
                                <Tooltip label={lang === "es" ? "Volver al chat" : "Back to chat"}>
                                    <button
                                        type="button"
                                        className="nexusai-icon-btn nexusai-panel__back-btn"
                                        onClick={() => setActiveTab("chat")}
                                        aria-label={lang === "es" ? "Volver al chat" : "Back to chat"}
                                        title={lang === "es" ? "Volver al chat" : "Back to chat"}
                                    >
                                        <IconBack />
                                    </button>
                                </Tooltip>
                                <h3 id="nexusai-title" className="nexusai-panel__title">
                                    {SECTION_TITLES[activeTab]?.[lang === "es" ? "es" : "en"]}
                                </h3>
                            </div>
                        )}

                        <div className="nexusai-panel__actions">
                            {hasCourse && (
                                <Tooltip label={lang === "es" ? "Ir a..." : "Go to..."}>
                                    <button
                                        type="button"
                                        className={`nexusai-icon-btn nexusai-nav-toggle ${navOpen ? "nexusai-nav-toggle--active" : ""}`}
                                        onClick={() => setNavOpen((v) => !v)}
                                        aria-label={lang === "es" ? "Navegación" : "Navigation"}
                                        title={lang === "es" ? "Ir a..." : "Go to..."}
                                    >
                                        <IconGrid />
                                    </button>
                                </Tooltip>
                            )}
                            {hasCourse && activeTab === "chat" && (
                                <Tooltip label={lang === "es" ? "Conversaciones previas" : "Previous conversations"}>
                                    <button
                                        type="button"
                                        className="nexusai-icon-btn nexusai-history-toggle"
                                        onClick={() => setActiveTab("history")}
                                        aria-label={lang === "es" ? "Historial" : "History"}
                                        title={lang === "es" ? "Conversaciones previas" : "Previous conversations"}
                                    >
                                        <IconHistory />
                                    </button>
                                </Tooltip>
                            )}
                            {hasCourse && (activeTab === "chat" || activeTab === "search") && (
                                <Tooltip label={multiCourse
                                    ? (lang === "es" ? "Buscando en todos tus cursos (click para solo este curso)" : "Searching all courses (click to limit to this course)")
                                    : (lang === "es" ? "Solo este curso (click para buscar en todos tus cursos)" : "This course only (click to search all your courses)")
                                }>
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
                                </Tooltip>
                            )}
                            {activeTab === "chat" && messages.length > 0 && (
                                <Tooltip label={t.clearChat}>
                                    <button
                                        type="button"
                                        className="nexusai-icon-btn"
                                        onClick={clearChat}
                                        aria-label={t.clearChat}
                                        title={t.clearChat}
                                    >
                                        <IconNewChat />
                                    </button>
                                </Tooltip>
                            )}
                            <Tooltip label={t.close}>
                                <button
                                    type="button"
                                    className="nexusai-icon-btn"
                                    onClick={() => setOpen(false)}
                                    aria-label={t.close}
                                    title={t.close}
                                >
                                    <IconClose />
                                </button>
                            </Tooltip>
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

                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                sesskey={sesskey}
                                courseId={courseid}
                                lang={lang}
                                canRegenerate={
                                    msg.role === "assistant" &&
                                    idx === messages.length - 1 &&
                                    !msg.streaming &&
                                    !loading &&
                                    !!lastQuestion
                                }
                                onRegenerate={regenerate}
                            />
                        ))}

                        {loading && !messages.some((m) => m.streaming && m.content) && <TypingIndicator lang={lang} />}

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

                    {hasCourse && (
                        <BudgetBar courseId={courseid} refreshKey={budgetTick} lang={lang} />
                    )}

                    <ChatInput
                        onSend={send}
                        disabled={loading}
                        placeholder={t.placeholder}
                        courseId={courseid}
                        lang={lang}
                    />

                    {/* Footer */}
                    <footer className="nexusai-panel__footer">
                        <IconLightning />
                        <span>{t.poweredBy}</span>
                    </footer>
                    </>
                    ) : activeTab === "history" ? (
                        <HistoryDropdown
                            open={true}
                            onClose={() => setActiveTab("chat")}
                            courseId={courseid}
                            currentSessionId={sessionId}
                            onSelectSession={loadSession}
                            onSessionDeleted={(deletedId) => {
                                // ASIST-02: if the active session was deleted, clear the
                                // chat so it does not keep pointing at a nonexistent id
                                // (the next message would hit a 404 on the backend).
                                if (deletedId === sessionId) clearChat();
                            }}
                            lang={lang}
                        />
                    ) : activeTab === "study" ? (
                        <div className="nexusai-panel__body">
                            <StudyPanel courseId={courseid} sesskey={sesskey} lang={lang} />
                        </div>
                    ) : activeTab === "calendar" ? (
                        <div className="nexusai-panel__body">
                            <CalendarPanel courseId={courseid} lang={lang} />
                        </div>
                    ) : activeTab === "review" ? (
                        <div className="nexusai-panel__body nexusai-panel__body--onb">
                            <OnboardingPanel
                                mode="review"
                                courseid={courseid}
                                wwwroot={wwwroot}
                                lang={lang}
                                state={reviewSetupState}
                                skipped={reviewSkipped}
                                onSkip={reviewSkip}
                                onUnskip={reviewUnskip}
                            />
                        </div>
                    ) : activeTab === "forumdigest" ? (
                        <div className="nexusai-panel__body">
                            <ForumDigestPanel courseId={courseid} wwwroot={wwwroot} lang={lang} />
                        </div>
                    ) : (
                        <div className="nexusai-panel__body">
                            <SearchPanel
                                courseId={courseid}
                                sesskey={sesskey}
                                isTeacher={false}
                                lang={lang}
                                scopeOverride={multiCourse}
                                onGoToChat={() => setActiveTab("chat")}
                            />
                        </div>
                    )}
                    </>
                    )}
                </div>
            )}
        </ToastProvider>
        </div>
    );
}
