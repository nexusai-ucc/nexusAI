/**
 * Tabla de documentos.
 *
 * El polling de estado se maneja en DocumentsManager (que usa listDocuments).
 * Esta tabla solo muestra el estado actual recibido via props y maneja la
 * confirmación + ejecución del borrado.
 */

import { useRef, useState } from "react";

import { deleteDocument, replaceDocument } from "./api.js";
import { IconFileText } from "../components/icons.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const STABLE_STATUSES = new Set(["indexed", "error"]);

export default function DocumentsTable({ courseId, documents, onChange }) {
    const [deletingId, setDeletingId]   = useState(null);
    const [confirmDoc, setConfirmDoc]   = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [successToast, setSuccessToast] = useState(null);
    const toastTimerRef = useRef(null);

    // CONT-07: reemplazar archivo manteniendo document_id.
    const [replacingId, setReplacingId] = useState(null);
    const [replaceTarget, setReplaceTarget] = useState(null); // { doc, file } pendiente de confirmar
    const [replaceError, setReplaceError] = useState(null);

    // CONT-08: preview del texto extraído (expand/collapse por fila).
    const [expanded, setExpanded] = useState({});
    const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleDeleteRequest = (doc) => {
        setConfirmDoc(doc);
    };

    const handleDeleteConfirm = async () => {
        const doc = confirmDoc;
        setConfirmDoc(null);
        setDeletingId(doc.id);
        try {
            await deleteDocument(courseId, doc.id);
            onChange((prev) => prev.filter((d) => d.id !== doc.id));
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setSuccessToast("Documento eliminado correctamente");
            toastTimerRef.current = setTimeout(() => setSuccessToast(null), 3000);
        } catch (err) {
            setDeleteError(err.message || String(err));
        } finally {
            setDeletingId(null);
        }
    };

    const handleReplaceRequest = (doc, file) => {
        setReplaceTarget({ doc, file });
    };

    const handleReplaceConfirm = async () => {
        const { doc, file } = replaceTarget;
        setReplaceTarget(null);
        setReplacingId(doc.id);
        try {
            const updated = await replaceDocument(courseId, doc.id, file);
            onChange((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setSuccessToast("Documento reemplazado, indexando de nuevo...");
            toastTimerRef.current = setTimeout(() => setSuccessToast(null), 3000);
        } catch (err) {
            setReplaceError(err.message || String(err));
        } finally {
            setReplacingId(null);
        }
    };

    if (documents.length === 0) {
        return (
            <div className="nexusai-empty">
                <p>Todavía no hay documentos indexados para este curso.</p>
                <p className="nexusai-empty__hint">
                    Subí tu primer PDF arrastrándolo arriba.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="nexusai-table-wrap">
                <table className="nexusai-table">
                    <thead>
                        <tr>
                            <th>Archivo</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                doc={doc}
                                onDelete={() => handleDeleteRequest(doc)}
                                deleting={deletingId === doc.id}
                                onReplace={(file) => handleReplaceRequest(doc, file)}
                                replacing={replacingId === doc.id}
                                expanded={!!expanded[doc.id]}
                                onToggleExpand={() => toggleExpand(doc.id)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {confirmDoc && (
                <ConfirmDeleteModal
                    filename={confirmDoc.filename}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDoc(null)}
                />
            )}

            {deleteError && (
                <ErrorModal
                    message={deleteError}
                    onClose={() => setDeleteError(null)}
                />
            )}

            {replaceTarget && (
                <ConfirmModal
                    title="Reemplazar documento"
                    message={
                        <>
                            ¿Reemplazar <strong>{replaceTarget.doc.filename}</strong> por{" "}
                            <strong>{replaceTarget.file.name}</strong>? El contenido indexado
                            actual se borra y se vuelve a indexar desde cero. La acción no se
                            puede deshacer.
                        </>
                    }
                    confirmLabel="Reemplazar"
                    variant="danger"
                    onConfirm={handleReplaceConfirm}
                    onCancel={() => setReplaceTarget(null)}
                />
            )}

            {replaceError && (
                <ErrorModal
                    message={replaceError}
                    onClose={() => setReplaceError(null)}
                />
            )}

            {successToast && (
                <div className="nexusai-toast nexusai-toast--success" role="status">
                    {successToast}
                </div>
            )}
        </>
    );
}

// ============================================================
// Modal de confirmación de borrado
// ============================================================

function ConfirmDeleteModal({ filename, onConfirm, onCancel }) {
    return (
        <div className="nexusai-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="nexusai-modal-title">
            <div className="nexusai-modal">
                <h2 className="nexusai-modal__title" id="nexusai-modal-title">
                    Eliminar documento
                </h2>
                <p className="nexusai-modal__body">
                    ¿Borrar <strong>{filename}</strong>? Esto elimina el documento y todos
                    sus chunks indexados. La acción no se puede deshacer.
                </p>
                <div className="nexusai-modal__actions">
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--secondary"
                        onClick={onCancel}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--danger"
                        onClick={onConfirm}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Modal de error — exportado para que DocumentsManager lo use
// ============================================================

export function ErrorModal({ message, onClose }) {
    return (
        <div className="nexusai-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="nexusai-error-title">
            <div className="nexusai-modal">
                <h2 className="nexusai-modal__title nexusai-modal__title--error" id="nexusai-error-title">
                    Error
                </h2>
                <p className="nexusai-modal__body nexusai-modal__body--error">
                    {message}
                </p>
                <div className="nexusai-modal__actions nexusai-modal__actions--end">
                    <button
                        type="button"
                        className="nexusai-btn nexusai-btn--secondary"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Fila de tabla
// ============================================================

function DocumentRow({ doc, onDelete, deleting, onReplace, replacing, expanded, onToggleExpand }) {
    const showDate = STABLE_STATUSES.has(doc.status);
    const canPreview = doc.status === "indexed" && !!doc.text_preview;
    const replaceInputRef = useRef(null);
    const busy = deleting || replacing;

    const handleReplaceClick = () => {
        if (busy) return;
        replaceInputRef.current?.click();
    };
    const handleReplaceInputChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // permite reemplazar por el mismo nombre de archivo dos veces seguidas
        if (file) onReplace(file);
    };

    return (
        <>
            <tr className={`nexusai-table__row nexusai-table__row--${doc.status}`}>
                <td>
                    <div className="nexusai-table__filename">
                        <span className="nexusai-table__filename-icon"><IconFileText size={14} /></span>
                        {doc.filename}
                    </div>
                    {(doc.status === "indexing" || replacing) && (
                        <div className="nexusai-table__progress">
                            <div className="nexusai-table__progress-fill"></div>
                        </div>
                    )}
                </td>
                <td>
                    <StatusBadge status={doc.status} errorMessage={doc.error_message} />
                </td>
                <td className="nexusai-table__date">
                    {showDate ? formatIndexedAt(doc.updated_at) : "—"}
                </td>
                <td className="nexusai-table__actions">
                    {canPreview && (
                        <button
                            type="button"
                            className="nexusai-link-btn"
                            onClick={onToggleExpand}
                        >
                            {expanded ? "Ocultar extracto" : "Ver extracto"}
                        </button>
                    )}
                    <input
                        ref={replaceInputRef}
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleReplaceInputChange}
                    />
                    <button
                        type="button"
                        className="nexusai-link-btn"
                        onClick={handleReplaceClick}
                        disabled={busy}
                    >
                        {replacing ? "Reemplazando..." : "Reemplazar"}
                    </button>
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={onDelete}
                        disabled={busy}
                    >
                        {deleting ? "Borrando..." : "Eliminar"}
                    </button>
                </td>
            </tr>
            {expanded && canPreview && (
                <tr className="nexusai-table__preview-row">
                    <td colSpan={4}>
                        <div className="nexusai-table__preview">
                            <p className="nexusai-table__preview-label">Extracto del texto indexado</p>
                            <p className="nexusai-table__preview-text">{doc.text_preview}</p>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function formatIndexedAt(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status, errorMessage }) {
    const labels = {
        pending:  { text: "En cola",   cls: "pending" },
        indexing: { text: "Indexando", cls: "indexing" },
        indexed:  { text: "Indexado",  cls: "indexed" },
        error:    { text: "Error",     cls: "error" },
    };
    const info = labels[status] || { text: status || "—", cls: "unknown" };

    return (
        <span
            className={`nexusai-badge nexusai-badge--${info.cls}`}
            title={status === "error" ? (errorMessage || "") : ""}
        >
            {info.text}
        </span>
    );
}
