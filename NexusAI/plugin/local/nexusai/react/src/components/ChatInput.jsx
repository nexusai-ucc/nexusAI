/**
 * Input de texto del chat con auto-resize, contador opcional y envío con Enter.
 *
 * Reglas de UX:
 *   - Enter envía el mensaje.
 *   - Shift+Enter inserta nueva línea (no envía).
 *   - El botón se deshabilita si la pregunta está vacía o si está cargando.
 *   - El input se limpia automáticamente cuando se envía con éxito.
 *   - Auto-grow del textarea hasta 4 líneas, después aparece scroll.
 *
 * ASIST-06 (#384): pegar un bloque largo de texto no lo inserta crudo — se
 * reemplaza por un placeholder corto y editable (`[📋 Pegado #N — X líneas]`)
 * y el texto completo se guarda aparte (`pastes`), con un chip debajo del
 * input para verlo entero o sacarlo. Al enviar, cada placeholder que sigue
 * presente en el texto se reemplaza por su contenido real — si el alumno lo
 * borró a mano, esa parte simplemente no se reinserta.
 *
 * ASIST-05 (#375): el límite de MAX_CHARS ya se aplicaba en silencio (el
 * textarea simplemente dejaba de crecer), sin ningún aviso previo. El
 * contador solo se muestra cerca del límite (CHARS_WARNING_THRESHOLD) para
 * no ensuciar la UI en el uso normal de una pregunta corta.
 *
 * VOICE-01 (#314): botón de micrófono al lado de enviar. Graba con
 * MediaRecorder (API nativa del browser, sin librería nueva) y al soltar
 * transcribe el audio — el resultado SOLO llena el textarea existente
 * (`setValue`), nunca dispara `onSend` directo. Así el alumno siempre ve el
 * texto transcripto, lo puede editar, y lo envía con el flujo normal
 * (Enter/botón enviar) — cumple el criterio de aceptación de "confirmar
 * antes de enviar" sin construir un flujo paralelo. Un error de permiso de
 * micrófono o de transcripción nunca bloquea poder tipear a mano.
 */

import { useEffect, useRef, useState } from "react";
import { IconFile, IconMic, IconX } from "./icons.jsx";
import { transcribeAudio } from "../api/voice.js";

const MAX_CHARS = 2000;
const CHARS_WARNING_THRESHOLD = 1800;

// Umbral para colapsar un pegado — mismo criterio que sugiere el issue.
const PASTE_LINES_THRESHOLD = 15;
const PASTE_CHARS_THRESHOLD = 500;

function placeholderFor(id, lines) {
    return `[📋 Pegado #${id} — ${lines} línea${lines === 1 ? "" : "s"}]`;
}

// Función (no constante de módulo) a propósito: se re-evalúa en cada
// render en vez de una sola vez al importar el archivo, para que tests
// puedan stubear navigator.mediaDevices/MediaRecorder antes de renderizar.
function isMicSupported() {
    return (
        typeof navigator !== "undefined" &&
        !!navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === "function" &&
        typeof window !== "undefined" &&
        typeof window.MediaRecorder !== "undefined"
    );
}

export default function ChatInput({ onSend, disabled, placeholder, courseId }) {
    const micSupported = isMicSupported();
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

    // Auto-grow del textarea según el contenido.
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
            finalText = finalText.split(placeholderFor(p.id, p.lines)).join(p.text);
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

    // VOICE-01: graba con MediaRecorder, y al soltar transcribe y llena el
    // textarea existente — nunca envía directo.
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
                    setVoiceError("No se pudo transcribir el audio. Probá de nuevo o escribí tu pregunta.");
                    setVoiceState("error");
                }
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setVoiceState("recording");
        } catch {
            setVoiceError("No se pudo acceder al micrófono. Revisá los permisos del navegador.");
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
            return; // pegado corto — comportamiento normal del navegador, sin fricción.
        }

        e.preventDefault();
        const id = nextPasteId.current++;
        const ta = textareaRef.current;
        const start = ta ? ta.selectionStart : value.length;
        const end = ta ? ta.selectionEnd : value.length;
        const token = placeholderFor(id, lines);

        setValue((prev) => prev.slice(0, start) + token + prev.slice(end));
        setPastes((prev) => [...prev, { id, text, lines, chars: text.length }]);
    };

    const removePaste = (id) => {
        const p = pastes.find((x) => x.id === id);
        if (p) {
            setValue((prev) => prev.split(placeholderFor(id, p.lines)).join(""));
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
                            Pegado #{p.id} · {p.lines} líneas
                            <span
                                className="nexusai-input__paste-chip-remove"
                                role="button"
                                aria-label={`Quitar pegado #${p.id}`}
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
                        <span>Pegado #{previewPaste.id} — {previewPaste.lines} líneas, {previewPaste.chars} caracteres</span>
                        <button
                            type="button"
                            className="nexusai-input__paste-preview-close"
                            onClick={() => setPreviewId(null)}
                            aria-label="Cerrar"
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
                    placeholder={placeholder || "Preguntá lo que quieras sobre esta materia..."}
                    rows={1}
                    disabled={disabled}
                    aria-label="Tu pregunta"
                />
                {micSupported && (
                    <button
                        type="button"
                        className={`nexusai-input__mic ${voiceState === "recording" ? "nexusai-input__mic--recording" : ""}`}
                        onClick={handleMicClick}
                        disabled={disabled || voiceState === "transcribing"}
                        aria-label={voiceState === "recording" ? "Detener grabación" : "Grabar pregunta por voz"}
                        title={voiceState === "recording" ? "Detener grabación" : "Grabar pregunta por voz"}
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
                    aria-label="Enviar mensaje"
                    title="Enviar (Enter)"
                >
                    {/* Ícono de avión de papel inline (no requiere lib externa) */}
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
                    {atLimit
                        ? `Llegaste al límite de ${MAX_CHARS} caracteres`
                        : `${value.length} / ${MAX_CHARS} caracteres`}
                </div>
            )}
        </div>
    );
}
