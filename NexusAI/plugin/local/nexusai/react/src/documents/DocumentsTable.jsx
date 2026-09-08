/**
 * Tabla de documentos.
 *
 * El polling de estado se maneja en DocumentsManager (que usa listDocuments).
 * Esta tabla solo muestra el estado actual recibido via props y maneja la
 * confirmación + ejecución del borrado y del reemplazo de archivo (CONT-07).
 */

import { useRef, useState } from "react";

import { deleteDocument, getDocumentPreview, reindexDocument, replaceDocument } from "./api.js";
import { IconFileText } from "../components/icons.jsx";
import { useToast } from "../components/Toast.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";
import ConfirmModal, { useDismissable } from "../components/ConfirmModal.jsx";

const STABLE_STATUSES = new Set(["indexed", "error"]);

export default function DocumentsTable({ courseId, documents, onChange }) {
    const [deletingId, setDeletingId]   = useState(null);
    const [confirmDoc, setConfirmDoc]   = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const { showSuccess, showWarning } = useToast();

    // CONT-09 (#358): acciones en lote — selección múltiple + reindexar/borrar
    // varios documentos de una. Ejecución SECUENCIAL (no Promise.all), mismo
    // criterio que uploadQueue (SP-13): da feedback de progreso por ítem y no
    // satura el backend/LLM de golpe si se seleccionan muchos.
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [bulkConfirm, setBulkConfirm] = useState(null); // { type: "delete"|"reindex", docs }
    const [bulkRunning, setBulkRunning] = useState(false);
    const [bulkQueue, setBulkQueue]     = useState([]); // [{ id, filename, status, error }]

    const allSelected = documents.length > 0 && selectedIds.size === documents.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(documents.map((d) => d.id)));
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const requestBulkAction = (type) => {
        const docs = documents.filter((d) => selectedIds.has(d.id));
        if (!docs.length) return;
        setBulkConfirm({ type, docs });
    };

    const runBulkAction = async () => {
        const { type, docs } = bulkConfirm;
        setBulkConfirm(null);
        setBulkRunning(true);
        setBulkQueue(docs.map((d) => ({ id: d.id, filename: d.filename, status: "queued", error: null })));

        let failed = 0;
        for (const doc of docs) {
            setBulkQueue((prev) => prev.map((it) => (it.id === doc.id ? { ...it, status: "running" } : it)));
            try {
                if (type === "delete") {
                    await deleteDocument(courseId, doc.id);
                    onChange((prev) => prev.filter((d) => d.id !== doc.id));
                } else {
                    const updated = await reindexDocument(courseId, doc.id);
                    onChange((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...updated } : d)));
                }
                setBulkQueue((prev) => prev.map((it) => (it.id === doc.id ? { ...it, status: "done" } : it)));
            } catch (err) {
                failed += 1;
                const message = getFriendlyErrorMessage(
                    err,
                    type === "delete" ? "No se pudo eliminar." : "No se pudo reindexar."
                );
                setBulkQueue((prev) => prev.map((it) => (it.id === doc.id ? { ...it, status: "error", error: message } : it)));
            }
        }

        setBulkRunning(false);
        clearSelection();
        const ok = docs.length - failed;
        const verb = type === "delete" ? "eliminados" : "reindexados";
        if (failed === 0) {
            showSuccess(`${ok} documento${ok === 1 ? "" : "s"} ${verb} correctamente`);
            setBulkQueue([]);
        } else {
            showWarning(`${ok} de ${docs.length} documentos ${verb} — ${failed} con error`);
            // La cola queda visible con el detalle de qué falló (se limpia
            // sola en la próxima corrida, o el docente la descarta a mano).
        }
    };

    const dismissBulkQueue = () => setBulkQueue([]);

    // CONT-07 (#356): reemplazar el archivo de un documento sin cambiar su id.
    // Flujo: click "Reemplazar" → abre el file picker (input oculto) → al
    // elegir un archivo, se pide confirmación antes de llamar al backend.
    const [replacingId, setReplacingId] = useState(null);
    const [pendingReplaceDoc, setPendingReplaceDoc] = useState(null);
    const [replaceTarget, setReplaceTarget] = useState(null); // { doc, file }
    const [replaceError, setReplaceError] = useState(null);
    const replaceInputRef = useRef(null);

    const handleReplaceRequest = (doc) => {
        setPendingReplaceDoc(doc);
        replaceInputRef.current?.click();
    };

    const handleReplaceFileChosen = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // permite re-elegir el mismo archivo y disparar onChange igual
        if (file && pendingReplaceDoc) {
            setReplaceTarget({ doc: pendingReplaceDoc, file });
        }
        setPendingReplaceDoc(null);
    };

    const handleReplaceConfirm = async () => {
        const { doc, file } = replaceTarget;
        setReplaceTarget(null);
        setReplacingId(doc.id);
        try {
            const updated = await replaceDocument(courseId, doc.id, file);
            onChange((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...updated } : d)));
            showSuccess("Documento reemplazado correctamente");
        } catch (err) {
            setReplaceError(getFriendlyErrorMessage(err, "No se pudo reemplazar el documento. Intentá de nuevo."));
        } finally {
            setReplacingId(null);
        }
    };

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
            showSuccess("Documento eliminado correctamente");
        } catch (err) {
            setDeleteError(getFriendlyErrorMessage(err, "No se pudo eliminar el documento. Intentá de nuevo."));
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
            {selectedIds.size > 0 && (
                <div className="nexusai-bulkbar">
                    <span className="nexusai-bulkbar__count">
                        {selectedIds.size} seleccionado{selectedIds.size === 1 ? "" : "s"}
                    </span>
                    <button
                        type="button"
                        className="nexusai-link-btn"
                        onClick={() => requestBulkAction("reindex")}
                        disabled={bulkRunning}
                    >
                        Reindexar
                    </button>
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={() => requestBulkAction("delete")}
                        disabled={bulkRunning}
                    >
                        Eliminar
                    </button>
                    <button
                        type="button"
                        className="nexusai-bulkbar__cancel"
                        onClick={clearSelection}
                        disabled={bulkRunning}
                    >
                        Cancelar selección
                    </button>
                </div>
            )}

            {bulkQueue.length > 0 && (
                <ul className="nexusai-upload-queue">
                    {bulkQueue.map((item) => (
                        <li
                            key={item.id}
                            className={`nexusai-upload-queue__item ${item.status === "error" ? "nexusai-upload-queue__item--error" : ""}`}
                        >
                            <span className="nexusai-upload-queue__name">{item.filename}</span>
                            {item.status === "error" ? (
                                <>
                                    <span className="nexusai-upload-queue__status">{item.error}</span>
                                    {!bulkRunning && (
                                        <button
                                            type="button"
                                            className="nexusai-upload-queue__dismiss"
                                            onClick={dismissBulkQueue}
                                            aria-label={`Descartar error de ${item.filename}`}
                                        >
                                            ×
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="nexusai-upload-queue__status">
                                    {{ queued: "En cola...", running: "Procesando...", done: "Listo" }[item.status]}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div className="nexusai-table-wrap">
                <table className="nexusai-table">
                    <thead>
                        <tr>
                            <th className="nexusai-table__checkbox-col">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                    onChange={toggleSelectAll}
                                    aria-label="Seleccionar todos los documentos"
                                />
                            </th>
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
                                selected={selectedIds.has(doc.id)}
                                onToggleSelect={() => toggleSelectOne(doc.id)}
                                onDelete={() => handleDeleteRequest(doc)}
                                deleting={deletingId === doc.id}
                                onReplace={() => handleReplaceRequest(doc)}
                                replacing={replacingId === doc.id}
                                previewOpen={openPreviewId === doc.id}
                                preview={previews[doc.id]}
                                onTogglePreview={() => togglePreview(doc)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <input
                ref={replaceInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={handleReplaceFileChosen}
            />

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

            {replaceTarget && (
                <ConfirmModal
                    title="Reemplazar documento"
                    confirmLabel="Reemplazar"
                    cancelLabel="Cancelar"
                    onConfirm={handleReplaceConfirm}
                    onCancel={() => setReplaceTarget(null)}
                >
                    ¿Reemplazar <strong>{replaceTarget.doc.filename}</strong> por{" "}
                    <strong>{replaceTarget.file.name}</strong>? El documento se
                    re-indexa desde cero; las citas viejas del chat siguen
                    apuntando a este mismo material.
                </ConfirmModal>
            )}

            {bulkConfirm && (
                <ConfirmModal
                    title={bulkConfirm.type === "delete" ? "Eliminar documentos" : "Reindexar documentos"}
                    confirmLabel={bulkConfirm.type === "delete" ? "Eliminar" : "Reindexar"}
                    cancelLabel="Cancelar"
                    danger={bulkConfirm.type === "delete"}
                    onConfirm={runBulkAction}
                    onCancel={() => setBulkConfirm(null)}
                >
                    {bulkConfirm.type === "delete" ? (
                        <>
                            ¿Borrar <strong>{bulkConfirm.docs.length}</strong> documentos? Esto
                            elimina cada uno y todos sus chunks indexados. La acción no se puede
                            deshacer.
                        </>
                    ) : (
                        <>
                            ¿Reindexar <strong>{bulkConfirm.docs.length}</strong> documentos? Puede
                            tardar unos minutos por archivo.
                        </>
                    )}
                </ConfirmModal>
            )}

            {deleteError && (
                <ErrorModal
                    message={deleteError}
                    onClose={() => setDeleteError(null)}
                />
            )}

            {replaceError && (
                <ErrorModal
                    message={replaceError}
                    onClose={() => setReplaceError(null)}
                />
            )}
        </>
    );
}

// ============================================================
// Modal de error — exportado para que DocumentsManager lo use
// ============================================================

export function ErrorModal({ message, onClose }) {
    useDismissable(onClose);
    return (
        <div
            className="nexusai-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nexusai-error-title"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
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

function DocumentRow({ doc, selected, onToggleSelect, onDelete, deleting, onReplace, replacing, previewOpen, preview, onTogglePreview }) {
    const showDate = STABLE_STATUSES.has(doc.status);
    const canPreview = doc.status === "indexed";
    return (
        <>
            <tr className={`nexusai-table__row nexusai-table__row--${doc.status}`}>
                <td className="nexusai-table__checkbox-col">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        aria-label={`Seleccionar ${doc.filename}`}
                    />
                </td>
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
                        className="nexusai-link-btn"
                        onClick={onReplace}
                        disabled={replacing || deleting}
                    >
                        {replacing ? "Reemplazando..." : "Reemplazar"}
                    </button>
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={onDelete}
                        disabled={deleting || replacing}
                    >
                        {deleting ? "Borrando..." : "Eliminar"}
                    </button>
                </td>
            </tr>
            {previewOpen && (
                <tr className="nexusai-table__preview-row">
                    <td colSpan={5}>
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
