/**
 * Drop zone with HTML5 drag-and-drop + click to open the file picker.
 *
 * CONT-06 (#320): accepts several files at once (drag-and-drop or picker).
 * The parent component (DocumentsManager) passes it `onUpload(files)` — an
 * array, even for a single file — and `disabled` (true while an upload queue
 * is in progress, to avoid dropping a second batch before the first one
 * finishes).
 */

import { useRef, useState } from "react";
import { IconUpload } from "../components/icons.jsx";

const ACCEPT_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/html",
    // Some browsers do not resolve these MIME types well by extension;
    // they are added explicitly so the file picker always shows them.
    ".csv",
    ".md",
    ".html",
    ".htm",
].join(",");

export default function UploadZone({ onUpload, disabled, accept = ACCEPT_TYPES, lang = "es" }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const L = lang === "es" ? {
        uploading:  "Subiendo archivos...",
        drop:       "Arrastrá uno o varios archivos acá",
        wait:       "Por favor esperá a que termine",
        clickHint:  "o hacé click para seleccionar",
        formats:    "Formatos: PDF · DOCX · PPTX · XLSX · CSV · MD · HTML · TXT · Tamaño máximo: 20 MB",
    } : {
        uploading:  "Uploading files...",
        drop:       "Drag one or more files here",
        wait:       "Please wait until it finishes",
        clickHint:  "or click to select",
        formats:    "Formats: PDF · DOCX · PPTX · XLSX · CSV · MD · HTML · TXT · Max size: 20 MB",
    };

    const handleFiles = (files) => {
        if (!files || !files.length) return;
        onUpload(Array.from(files));
    };

    const onDragOver = (e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
    };
    const onClick = () => {
        if (disabled) return;
        inputRef.current?.click();
    };
    const onInputChange = (e) => {
        handleFiles(e.target.files);
        // Reset to allow uploading the same file twice in a row (new version).
        e.target.value = "";
    };

    const className = [
        "nexusai-dropzone",
        dragOver ? "nexusai-dropzone--dragover" : "",
        disabled ? "nexusai-dropzone--disabled" : "",
    ].filter(Boolean).join(" ");

    return (
        <div
            className={className}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
            aria-disabled={disabled}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={accept}
                onChange={onInputChange}
                style={{ display: "none" }}
                disabled={disabled}
            />
            <div className="nexusai-dropzone__icon">
                {disabled ? (
                    <span className="nexusai-dropzone__spinner" />
                ) : (
                    <IconUpload size={26} />
                )}
            </div>
            <div className="nexusai-dropzone__title">
                {disabled ? L.uploading : L.drop}
            </div>
            <div className="nexusai-dropzone__hint">
                {disabled ? L.wait : L.clickHint}
            </div>
            <div className="nexusai-dropzone__formats">
                {L.formats}
            </div>
        </div>
    );
}
