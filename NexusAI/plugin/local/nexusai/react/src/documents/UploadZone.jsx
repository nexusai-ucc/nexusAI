/**
 * Drop zone con drag-and-drop HTML5 + click para abrir el file picker.
 *
 * El componente padre (DocumentsManager) le pasa `onUpload(file)` y
 * `disabled` (true mientras hay un upload en curso para evitar race conditions
 * de múltiples uploads simultáneos al mismo backend).
 */

import { useRef, useState } from "react";

const ACCEPT_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "text/markdown",
    "text/html",
    // Algunos navegadores no resuelven bien estos MIME types por extensión;
    // se agregan explícitamente para que el file picker los muestre siempre.
    ".csv",
    ".md",
    ".html",
    ".htm",
].join(",");

export default function UploadZone({ onUpload, disabled, accept = ACCEPT_TYPES }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = (files) => {
        if (!files || !files.length) return;
        // MVP: un archivo a la vez. Si vienen varios, tomamos el primero.
        // Sprint 3: soportar múltiples uploads en paralelo.
        onUpload(files[0]);
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
        // Reset para permitir subir el mismo archivo dos veces seguidas (cambio de versión).
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
                accept={accept}
                onChange={onInputChange}
                style={{ display: "none" }}
                disabled={disabled}
            />
            <div className="nexusai-dropzone__icon">
                {disabled ? "⏳" : "⬆️"}
            </div>
            <div className="nexusai-dropzone__title">
                {disabled ? "Subiendo archivo..." : "Arrastrá tu archivo acá"}
            </div>
            <div className="nexusai-dropzone__hint">
                {disabled ? "Por favor esperá a que termine" : "o hacé click para seleccionar"}
            </div>
            <div className="nexusai-dropzone__formats">
                Formatos: PDF · DOCX · PPTX · XLSX · CSV · MD · HTML · TXT · Tamaño máximo: 20 MB
            </div>
        </div>
    );
}
