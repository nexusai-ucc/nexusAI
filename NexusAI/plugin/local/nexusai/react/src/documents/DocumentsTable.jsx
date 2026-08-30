/**
 * Tabla de documentos.
 *
 * El polling de estado se maneja en DocumentsManager (que usa listDocuments).
 * Esta tabla solo muestra el estado actual recibido via props y maneja la
 * confirmación + ejecución del borrado.
 */

import { useRef, useState } from "react";

import { deleteDocument, getDocumentPreview } from "./api.js";
import { IconFileText } from "../components/icons.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const STABLE_STATUSES = new Set(["indexed", "error"]);

export default function DocumentsTable({ courseId, documents, onChange }) {
    const [deletingId, setDeletingId]   = useState(null);
    const [confirmDoc, setConfirmDoc]   = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [successToast, setSuccessToast] = useState(null);
    const toastTimerRef = useRef(null);

    // CONT-08 (#357): preview del texto extraído, por documento y bajo demanda.
    // { [docId]: { loading, error, data } }
    const [previews, setPreviews] = useState({});
    const [openPreviewId, setOpenPreviewId] = useState(null);

    const togglePreview = async (doc) => {
        if (openPreviewId === doc.id) {
            setOpenPreviewId(null);
            return;
        }
        setOpenPreviewId(doc.id);
        if (previews[doc.id]?.data || previews[doc.id]?.loading) return;

        setPreviews((prev) => ({ ...prev, [doc.id]: { loading: true } }));
        try {
            const data = await getDocumentPreview(courseId, doc.id);
            setPreviews((prev) => ({ ...prev, [doc.id]: { loading: false, data } }));
        } catch (err) {
            setPreviews((prev) => ({
                ...prev,
                [doc.id]: { loading: false, error: err.message || String(err) },
            }));
        }
    };

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

    if (documents.length === 0) {
        return (
            <div className="nexusai-empty">
                <p>Todavía no subiste material a este curso.</p>
                <p className="nexusai-empty__hint">
                    Arrastrá un PDF, DOCX o TXT arriba y NexusAI lo indexa para que
                    el asistente pueda responder sobre su contenido.
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
                                previewOpen={openPreviewId === doc.id}
                                preview={previews[doc.id]}
                                onTogglePreview={() => togglePreview(doc)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {confirmDoc && (
                <ConfirmModal
                    title="Eliminar documento"
                    confirmLabel="Eliminar"
                    cancelLabel="Cancelar"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDoc(null)}
                >
                    ¿Borrar <strong>{confirmDoc.filename}</strong>? Esto elimina el
                    documento y todos sus chunks indexados. La acción no se puede
                    deshacer.
                </ConfirmModal>
            )}

            {deleteError && (
                <ErrorModal
                    message={deleteError}
                    onClose={() => setDeleteError(null)}
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

function DocumentRow({ doc, onDelete, deleting, previewOpen, preview, onTogglePreview }) {
    const showDate = STABLE_STATUSES.has(doc.status);
    const canPreview = doc.status === "indexed";
    return (
        <>
            <tr className={`nexusai-table__row nexusai-table__row--${doc.status}`}>
                <td>
                    <div className="nexusai-table__filename">
                        <span className="nexusai-table__filename-icon"><IconFileText size={14} /></span>
                        {doc.filename}
                    </div>
                    {doc.status === "indexing" && (
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
                            onClick={onTogglePreview}
                            aria-expanded={previewOpen}
                        >
                            {previewOpen ? "Ocultar texto" : "Ver texto extraído"}
                        </button>
                    )}
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={onDelete}
                        disabled={deleting}
                    >
                        {deleting ? "Borrando..." : "Eliminar"}
                    </button>
                </td>
            </tr>
            {previewOpen && (
                <tr className="nexusai-table__preview-row">
                    <td colSpan={4}>
                        <DocumentPreview preview={preview} />
                    </td>
                </tr>
            )}
        </>
    );
}

// ============================================================
// Preview del texto extraído (CONT-08 / #357)
// ============================================================

function DocumentPreview({ preview }) {
    if (!preview || preview.loading) {
        return <p className="nexusai-preview__status">Cargando texto extraído...</p>;
    }
    if (preview.error) {
        return (
            <p className="nexusai-preview__status nexusai-preview__status--error">
                No se pudo cargar el texto extraído: {preview.error}
            </p>
        );
    }
    const { preview: text, truncated } = preview.data || {};
    if (!text) {
        return (
            <p className="nexusai-preview__status">
                No hay texto extraído todavía para este documento.
            </p>
        );
    }
    return (
        <div className="nexusai-preview">
            <p className="nexusai-preview__label">
                Primeros caracteres del texto que NexusAI indexó de este archivo.
                Si se ve vacío o con símbolos raros, la extracción falló (típico en
                PDFs escaneados sin OCR).
            </p>
            <pre className="nexusai-preview__text">{text}{truncated ? "…" : ""}</pre>
        </div>
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
