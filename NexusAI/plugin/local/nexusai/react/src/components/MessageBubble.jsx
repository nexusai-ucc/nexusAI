/**
 * MessageBubble — a single message bubble.
 *
 * Sprint 3 changes (shadcn/ui redesign):
 *   - Assistant avatar (N icon on a soft violet background) on the left.
 *   - Assistant bubble: white background + border + shadow-sm (card style).
 *   - On-hover copy button in code blocks (post-render with useEffect).
 *   - Refined source pills with border and primary color.
 *   - Subtler timestamp.
 *
 * Roles:
 *   - "user"      → aligned right, violet primary background.
 *   - "assistant" → aligned left, white card with border.
 *   - "system"    → not shown.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import temml from "temml";
import { IconFile, IconRefreshCw, IconSparkles, IconThumbsDown, IconThumbsUp, IconX } from "./icons.jsx";
import { submitMessageFeedback } from "../api/chat.js";

// Conservative regex to detect files cited in the LLM's text.
const SOURCE_REGEX = /([\w\-]+\.(pdf|docx|txt))/gi;

// ASIST-04 (#360): math notation in LaTeX.
//
// The chat does not use react-markdown (it is in package.json but nothing
// uses it) — it renders with `marked` + DOMPurify. So instead of remark-math +
// rehype-katex we add a `marked` extension that matches $...$ / $$...$$ and
// renders them with Temml (LaTeX → MathML).
//
// Temml instead of KaTeX because KaTeX weighs ~110KB more and needs its CSS +
// ~1MB of woff fonts (webpack here has no rule for font assets, and Moodle's
// chunks/publicPath already caused trouble before — see
// webpack.config.js). Temml produces plain MathML that the browser draws
// natively, without CSS or fonts. It covers everything the chat would show
// (losses, distances, probabilities, sums, fractions).
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
        // Inline: no space next to the $, no $ or line breaks inside.
        // Avoids false positives like "it costs $5 or $10".
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

// Marked: GFM + links in a new tab + LaTeX formulas.
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

// MathML tags/attributes Temml emits. They are added to DOMPurify's
// allowlist so formulas survive sanitizing without opening the door to
// arbitrary HTML (`style` and `class` are not allowed: the MathML
// renders the same without them).
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

/* ---- Assistant avatar icon ---- */
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

const COPY_L = {
    es: { copy: "Copiar", copied: "✓ Copiado", error: "Error" },
    en: { copy: "Copy", copied: "✓ Copied", error: "Error" },
};

/**
 * Hook that injects "Copy" buttons into the <pre> blocks of the assistant's
 * markdown, after React renders the sanitized HTML.
 */
function useCopyButtons(ref, htmlContent, lang = "es") {
    useEffect(() => {
        if (!ref.current) return;
        const CL = COPY_L[lang] || COPY_L.es;
        const pres = ref.current.querySelectorAll("pre");

        pres.forEach((pre) => {
            // Avoid injecting twice if the component re-renders.
            if (pre.querySelector(".nexusai-copy-btn")) return;

            // We wrap the pre in a relative div to be able to position the button.
            const wrapper = document.createElement("div");
            wrapper.className = "nexusai-code-block";
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "nexusai-copy-btn";
            btn.textContent = CL.copy;

            btn.addEventListener("click", async () => {
                const code = pre.querySelector("code");
                const text = code ? code.innerText : pre.innerText;
                try {
                    await navigator.clipboard.writeText(text);
                    btn.textContent = CL.copied;
                    btn.classList.add("nexusai-copy-btn--copied");
                    setTimeout(() => {
                        btn.textContent = CL.copy;
                        btn.classList.remove("nexusai-copy-btn--copied");
                    }, 2000);
                } catch {
                    btn.textContent = CL.error;
                    setTimeout(() => { btn.textContent = CL.copy; }, 1500);
                }
            });

            wrapper.appendChild(btn);
        });
    }, [htmlContent, lang]);
}

const FEEDBACK_L = {
    es: {
        helpful:      "Respuesta útil",
        notHelpful:   "Respuesta no útil",
        commentHint:  "¿Qué estuvo mal? (opcional)",
        send:         "Enviar",
        thanks:       "¡Gracias por tu feedback!",
        sourcesAria:  "Fuentes citadas",
        sourcesLabel: "Fuentes:",
        downloadTitle:"Descargar archivo original",
        fragment:     (n) => ` · fragmento #${n}`,
        close:        "Cerrar",
        showLess:     "Mostrar menos",
        showMore:     "Mostrar más",
        regenerate:   "Regenerar",
    },
    en: {
        helpful:      "Helpful response",
        notHelpful:   "Not helpful",
        commentHint:  "What went wrong? (optional)",
        send:         "Send",
        thanks:       "Thanks for your feedback!",
        sourcesAria:  "Cited sources",
        sourcesLabel: "Sources:",
        downloadTitle:"Download original file",
        fragment:     (n) => ` · chunk #${n}`,
        close:        "Close",
        showLess:     "Show less",
        showMore:     "Show more",
        regenerate:   "Regenerate",
    },
};

export default function MessageBubble({ message, sesskey, courseId, lang = "es", canRegenerate = false, onRegenerate }) {
    if (!message || message.role === "system") return null;
    // Hide an empty assistant bubble (waiting for the first token of the stream).
    // The TypingIndicator is shown in its place.
    if (message.role === "assistant" && !message.content && message.streaming) {
        return null;
    }

    const isUser = message.role === "user";
    // If the backend sent structured sources (streaming meta event), use them.
    // If not (old messages without sources), fall back to the regex on the text.
    const structuredSources = !isUser && Array.isArray(message.sources) ? message.sources : null;
    const rawSources = isUser
        ? []
        : (structuredSources && structuredSources.length > 0
            ? structuredSources
            : extractSources(message.content).map((filename) => ({ document_filename: filename })));
    // Dedup by file (+course in multi-course): we keep the chunk with the
    // highest similarity for each unique (filename, course_id). Reduces visual
    // noise when retrieval returns N chunks of the same PDF — the student only
    // sees ONE bubble per file. We normalize the filename with trim+lower to
    // catch invisible variations (whitespace, casing) coming from the
    // backend or the PDF extractor.
    const sources = useMemo(() => {
        const seen = new Map();
        for (const src of rawSources) {
            const normFile = (src.document_filename || "?").trim().toLowerCase();
            // In multi-course we keep one slot per (file, course_id) so the same
            // PDF uploaded to two different subjects is not collapsed.
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
    // Map { course_id (string|number) → name } in multi-course.
    const courseNames = !isUser && message.course_names ? message.course_names : null;

    const [expandedIdx, setExpandedIdx] = useState(null);
    const markdownRef = useRef(null);

    // ASIST-01 (#321): 👍/👎 feedback on this specific answer.
    // `realId` is set by ChatApp when the stream's `done` event arrives
    // (the local id `local-asst-...` is not a real `messages` UUID yet);
    // messages reloaded from history already carry a real UUID in `id`.
    const feedbackMessageId = message.realId || (!String(message.id || "").startsWith("local-") ? message.id : null);
    const FL = FEEDBACK_L[lang] || FEEDBACK_L.es;
    const [feedbackVote, setFeedbackVote] = useState(null); // null | "up" | "down"
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [commentText, setCommentText] = useState("");

    const submitVote = async (isHelpful, comment = "") => {
        if (!feedbackMessageId || feedbackSubmitting) return;
        setFeedbackSubmitting(true);
        try {
            await submitMessageFeedback({ messageId: feedbackMessageId, courseId, isHelpful, comment });
            setFeedbackVote(isHelpful ? "up" : "down");
            setShowCommentBox(false);
            setCommentText("");
        } catch {
            // Best effort: no visual error feedback, does not block the chat.
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleThumbsDown = () => {
        if (feedbackVote === "down") return;
        setShowCommentBox(true);
    };

    const htmlContent = useMemo(() => {
        if (isUser) return null;
        return renderMarkdown(message.content);
    }, [isUser, message.content]);

    useCopyButtons(markdownRef, htmlContent, lang);

    // ASIST-06 (#384): long answers are cut with a fade + "Show more".
    // Not evaluated while the message is still streaming (the height is
    // still changing, cutting it in the middle would look broken).
    const [longExpanded, setLongExpanded] = useState(false);
    const [needsCollapse, setNeedsCollapse] = useState(false);
    useEffect(() => {
        if (isUser || message.streaming) return;
        const el = markdownRef.current;
        if (!el) return;
        // Trick without a double render: with the max-height clamp already applied
        // by CSS, scrollHeight still reports the real height of the content —
        // if it is bigger than the clamped visible height, the button is needed.
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

    // Assistant message — layout with avatar
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
                                // The clamp always applies while not expanded and not
                                // streaming — if the content already fits in the max height, it
                                // has no visual effect (scrollHeight === clientHeight,
                                // needsCollapse turns false on its own). That is what lets us
                                // measure "did it need cutting?" after rendering, without a second
                                // render without clamp. While streaming it is NOT clamped — otherwise
                                // the text that keeps arriving would be cut silently, with no fade or
                                // button yet (needsCollapse is only computed when it finishes).
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
                            {longExpanded ? FL.showLess : FL.showMore}
                        </button>
                    )}
                </div>
            </div>

            {sources.length > 0 && message.has_relevant_context !== false && (
                <div className="nexusai-msg__sources-wrap" style={{ paddingLeft: "34px" }}>
                    <div className="nexusai-msg__sources" aria-label={FL.sourcesAria}>
                        <span className="nexusai-msg__sources-label">{FL.sourcesLabel}</span>
                        {sources.map((src, i) => {
                            const key = `${src.document_filename}-${src.chunk_index ?? "x"}-${i}`;
                            const hasDownload = !!src.document_id;
                            const hasContent = !!src.content;
                            const isClickable = hasDownload || hasContent;
                            const isOpen = expandedIdx === i;
                            // In multi-course, show the course name next to the file.
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
                                    title={hasDownload ? FL.downloadTitle : undefined}
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
                                            FL.fragment(exp.chunk_index)}
                                    </span>
                                    <button
                                        type="button"
                                        className="nexusai-msg__source-panel-close"
                                        onClick={() => setExpandedIdx(null)}
                                        aria-label={FL.close}
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

            <div className="nexusai-msg__meta" style={{ paddingLeft: "34px", display: "flex", alignItems: "center", gap: "10px" }}>
                {formatTimestamp(message.created_at)}
                {canRegenerate && (
                    <button
                        type="button"
                        className="nexusai-msg__regenerate-btn"
                        onClick={onRegenerate}
                    >
                        <IconRefreshCw size={11} /> {FL.regenerate}
                    </button>
                )}
                {!message.streaming && (
                    <>
                        <button
                            type="button"
                            className={`nexusai-msg__feedback-btn ${feedbackVote === "up" ? "nexusai-msg__feedback-btn--active-up" : ""}`}
                            onClick={() => submitVote(true)}
                            disabled={!feedbackMessageId || feedbackSubmitting || feedbackVote === "up"}
                            title={FL.helpful}
                            aria-label={FL.helpful}
                        >
                            <IconThumbsUp size={13} />
                        </button>
                        <button
                            type="button"
                            className={`nexusai-msg__feedback-btn ${feedbackVote === "down" ? "nexusai-msg__feedback-btn--active-down" : ""}`}
                            onClick={handleThumbsDown}
                            disabled={!feedbackMessageId || feedbackSubmitting || feedbackVote === "down"}
                            title={FL.notHelpful}
                            aria-label={FL.notHelpful}
                        >
                            <IconThumbsDown size={13} />
                        </button>
                    </>
                )}
            </div>

            {showCommentBox && (
                <div className="nexusai-msg__feedback-comment">
                    <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={FL.commentHint}
                        maxLength={1000}
                        rows={2}
                    />
                    <button type="button" onClick={() => submitVote(false, commentText)} disabled={feedbackSubmitting}>
                        {FL.send}
                    </button>
                </div>
            )}
            {feedbackVote && !showCommentBox && (
                <p className="nexusai-msg__feedback-thanks">{FL.thanks}</p>
            )}
        </div>
    );
}
