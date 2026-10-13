/**
 * Chat text input with auto-resize, optional counter and send with Enter.
 *
 * UX rules:
 *   - Enter sends the message.
 *   - Shift+Enter inserts a new line (does not send).
 *   - The button is disabled if the question is empty or while loading.
 *   - The input clears itself when the message is sent successfully.
 *   - The textarea auto-grows up to 4 lines, then a scrollbar appears.
 *
 * ASIST-06 (#384): pasting a long block of text does not insert it raw — it is
 * replaced by a short, editable placeholder (`[📋 Pasted #N — X lines]`)
 * and the full text is kept apart (`pastes`), with a chip below the input to
 * see it whole or remove it. On send, each placeholder still present in the
 * text is replaced by its real content — if the student deleted it by hand,
 * that part is simply not inserted again.
 *
 * ASIST-05 (#375): the MAX_CHARS limit was already applied silently (the
 * textarea simply stopped growing), with no warning beforehand. The counter
 * only shows near the limit (CHARS_WARNING_THRESHOLD) so it does not clutter
 * the UI in the normal use of a short question.
 *
 * VOICE-01 (#314): microphone button next to send. Records with
 * MediaRecorder (the browser's native API, no new library) and on release
 * transcribes the audio — the result ONLY fills the existing textarea
 * (`setValue`), it never fires `onSend` directly. That way the student always
 * sees the transcribed text, can edit it, and sends it with the normal flow
 * (Enter/send button) — it meets the acceptance criterion of "confirm
 * before sending" without building a parallel flow. A microphone permission
 * or transcription error never blocks typing by hand.
 */

import { useEffect, useRef, useState } from "react";
import { IconFile, IconMic, IconX } from "./icons.jsx";
import { transcribeAudio } from "../api/voice.js";

const MAX_CHARS = 2000;
const CHARS_WARNING_THRESHOLD = 1800;

// Threshold to collapse a paste — same rule the issue suggests.
const PASTE_LINES_THRESHOLD = 15;
const PASTE_CHARS_THRESHOLD = 500;

function placeholderFor(id, lines, lang = "es") {
    if (lang === "es") {
        return `[📋 Pegado #${id} — ${lines} línea${lines === 1 ? "" : "s"}]`;
    }
    return `[📋 Pasted #${id} — ${lines} line${lines === 1 ? "" : "s"}]`;
}

// A function (not a module constant) on purpose: it is re-evaluated on every
// render instead of only once when the file is imported, so tests can stub
// navigator.mediaDevices/MediaRecorder before rendering.
function isMicSupported() {
    return (
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function" &&
        typeof window !== "undefined" &&
        typeof window.MediaRecorder !== "undefined"
    );
}

export default function ChatInput({ onSend, disabled, placeholder, courseId, lang = "es" }) {
    const micSupported = isMicSupported();

    const L = lang === "es" ? {
        placeholder:      "Preguntá lo que quieras sobre esta materia...",
        pastedLabel:      (id, n) => `Pegado #${id} · ${n} líneas`,
        removePaste:      (id) => `Quitar pegado #${id}`,
        pastePreviewInfo: (p) => `Pegado #${p.id} — ${p.lines} líneas, ${p.chars} caracteres`,
        close:            "Cerrar",
        stopRecording:    "Detener grabación",
        recordVoice:      "Grabar pregunta por voz",
        sendMessage:      "Enviar mensaje",
        sendTitle:        "Enviar (Enter)",
        yourQuestion:     "Tu pregunta",
        transcribeError:  "No se pudo transcribir el audio. Probá de nuevo o escribí tu pregunta.",
        micError:         "No se pudo acceder al micrófono. Revisá los permisos del navegador.",
        atLimit:          (max) => `Llegaste al límite de ${max} caracteres`,
        counter:          (len, max) => `${len} / ${max} caracteres`,
    } : {
        placeholder:      "Ask anything about this subject...",
        pastedLabel:      (id, n) => `Pasted #${id} · ${n} lines`,
        removePaste:      (id) => `Remove pasted #${id}`,
        pastePreviewInfo: (p) => `Pasted #${p.id} — ${p.lines} lines, ${p.chars} characters`,
        close:            "Close",
        stopRecording:    "Stop recording",
        recordVoice:      "Record question by voice",
        sendMessage:      "Send message",
        sendTitle:        "Send (Enter)",
        yourQuestion:     "Your question",
        transcribeError:  "Couldn't transcribe the audio. Try again or type your question.",
        micError:         "Couldn't access the microphone. Check your browser permissions.",
        atLimit:          (max) => `You've reached the limit of ${max} characters`,
        counter:          (len, max) => `${len} / ${max} characters`,
    };
    const [value, setValue] = useState("");
    const [pastes, setPastes] = useState([]); // { id, text, lines, chars }
    const [previewId, setPreviewId] = useState(null);
    const nextPasteId = useRef(1);
    const textareaRef = useRef(null);

    // VOICE-01: "idle" | "recording" | "transcribing" | "error"
    const [voiceState, setVoiceState] = useState("idle");
    const [voiceError, setVoiceError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Auto-grow the textarea to its content.
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }, [value]);

    const trimmed = value.trim();
    const canSend = trimmed.length > 0 && !disabled;

    const resetComposer = () => {
        setValue("");
        setPastes([]);
        setPreviewId(null);
        nextPasteId.current = 1;
    };

    const send = () => {
        if (!canSend) return;
        let finalText = trimmed;
        for (const p of pastes) {
            finalText = finalText.split(placeholderFor(p.id, p.lines, lang)).join(p.text);
        }
        onSend(finalText);
        resetComposer();
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // VOICE-01: records with MediaRecorder, and on release transcribes and fills
    // the existing textarea — never sends directly.
    const startRecording = async () => {
        setVoiceError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
                setVoiceState("transcribing");
                try {
                    const text = await transcribeAudio(courseId, blob);
                    if (text && text.trim()) {
                        setValue((prev) => (prev.trim() ? `${prev.trim()} ${text.trim()}` : text.trim()));
                    }
                    setVoiceState("idle");
                } catch {
                    setVoiceError(L.transcribeError);
                    setVoiceState("error");
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setVoiceState("recording");
        } catch {
            setVoiceError(L.micError);
            setVoiceState("error");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
    };

    const handleMicClick = () => {
        if (voiceState === "recording") {
            stopRecording();
        } else if (voiceState !== "transcribing") {
            startRecording();
        }
    };

    const onPaste = (e) => {
        const text = e.clipboardData.getData("text");
        if (!text) return;
        const lines = text.split("\n").length;
        if (lines <= PASTE_LINES_THRESHOLD && text.length <= PASTE_CHARS_THRESHOLD) {
            return; // short paste — normal browser behavior, no friction.
        }

        e.preventDefault();
        const id = nextPasteId.current++;
        const ta = textareaRef.current;
        const start = ta ? ta.selectionStart : value.length;
        const end = ta ? ta.selectionEnd : value.length;
        const token = placeholderFor(id, lines, lang);

        setValue((prev) => prev.slice(0, start) + token + prev.slice(end));
        setPastes((prev) => [...prev, { id, text, lines, chars: text.length }]);
    };

    const removePaste = (id) => {
        const p = pastes.find((x) => x.id === id);
        if (p) {
            setValue((prev) => prev.split(placeholderFor(id, p.lines, lang)).join(""));
        }
        setPastes((prev) => prev.filter((x) => x.id !== id));
        setPreviewId((cur) => (cur === id ? null : cur));
    };

    const previewPaste = pastes.find((p) => p.id === previewId) || null;
    const atLimit = value.length >= MAX_CHARS;
    const showCounter = value.length >= CHARS_WARNING_THRESHOLD;

    return (
        <div className="nexusai-input-wrap">
            {pastes.length > 0 && (
                <div className="nexusai-input__pastes">
                    {pastes.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            className="nexusai-input__paste-chip"
                            onClick={() => setPreviewId(previewId === p.id ? null : p.id)}
                        >
                            <IconFile size={12} />
                            {L.pastedLabel(p.id, p.lines)}
                            <span
                                className="nexusai-input__paste-chip-remove"
                                role="button"
                                aria-label={L.removePaste(p.id)}
                                onClick={(e) => { e.stopPropagation(); removePaste(p.id); }}
                            >
                                <IconX size={11} />
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {previewPaste && (
                <div className="nexusai-input__paste-preview">
                    <div className="nexusai-input__paste-preview-header">
                        <span>{L.pastePreviewInfo(previewPaste)}</span>
                        <button
                            type="button"
                            className="nexusai-input__paste-preview-close"
                            onClick={() => setPreviewId(null)}
                            aria-label={L.close}
                        >
                            <IconX size={13} />
                        </button>
                    </div>
                    <pre className="nexusai-input__paste-preview-content">{previewPaste.text}</pre>
                </div>
            )}

            <div className="nexusai-input">
                <textarea
                    ref={textareaRef}
                    className="nexusai-input__textarea"
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    placeholder={placeholder || L.placeholder}
                    rows={1}
                    disabled={disabled}
                    aria-label={L.yourQuestion}
                />
                {micSupported && (
                    <button
                        type="button"
                        className={`nexusai-input__mic ${voiceState === "recording" ? "nexusai-input__mic--recording" : ""}`}
                        onClick={handleMicClick}
                        disabled={disabled || voiceState === "transcribing"}
                        aria-label={voiceState === "recording" ? L.stopRecording : L.recordVoice}
                        title={voiceState === "recording" ? L.stopRecording : L.recordVoice}
                    >
                        {voiceState === "transcribing" ? (
                            <span className="nexusai-input__mic-spinner" aria-hidden="true" />
                        ) : (
                            <IconMic size={17} />
                        )}
                    </button>
                )}
                <button
                    type="button"
                    className="nexusai-input__send"
                    onClick={send}
                    disabled={!canSend}
                    aria-label={L.sendMessage}
                    title={L.sendTitle}
                >
                    {/* Inline paper plane icon (no external library needed) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>

            {voiceError && (
                <div className="nexusai-input__voice-error" role="alert">
                    {voiceError}
                </div>
            )}

            {showCounter && (
                <div
                    className={`nexusai-input__counter ${atLimit ? "nexusai-input__counter--limit" : "nexusai-input__counter--warning"}`}
                    role="status"
                >
                    {atLimit ? L.atLimit(MAX_CHARS) : L.counter(value.length, MAX_CHARS)}
                </div>
            )}
        </div>
    );
}
