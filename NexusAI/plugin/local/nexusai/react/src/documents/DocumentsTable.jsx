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

export default function DocumentsTable({ courseId, documents, onChange, lang = "es" }) {
    const [deletingId, setDeletingId]   = useState(null);
    const [confirmDoc, setConfirmDoc]   = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const { showSuccess, showWarning } = useToast();

    const L = lang === "es" ? {
        selected:        (n) => `${n} seleccionado${n === 1 ? "" : "s"}`,
        reindex:         "Reindexar",
        delete:          "Eliminar",
        cancelSelection: "Cancelar selección",
        discardErrorOf:  (name) => `Descartar error de ${name}`,
        queued:          "En cola...",
        running:         "Procesando...",
        done:            "Listo",
        selectAllAria:   "Seleccionar todos los documentos",
        colFile:         "Archivo",
        colStatus:       "Estado",
        colDate:         "Fecha",
        emptyTitle:      "Todavía no subiste material a este curso.",
        emptyHint:       "Arrastrá un PDF, DOCX o TXT arriba y NexusAI lo indexa para que el asistente pueda responder sobre su contenido.",
        deleteTitle:     "Eliminar documento",
        deleteConfirm:   "Eliminar",
        cancel:          "Cancelar",
        deleteBody:      (name) => <>¿Borrar <strong>{name}</strong>? Esto elimina el documento y todos sus chunks indexados. La acción no se puede deshacer.</>,
        replaceTitle:    "Reemplazar documento",
        replaceConfirm:  "Reemplazar",
        replaceBody:     (oldName, newName) => <>¿Reemplazar <strong>{oldName}</strong> por <strong>{newName}</strong>? El documento se re-indexa desde cero; las citas viejas del chat siguen apuntando a este mismo material.</>,
        bulkDeleteTitle: "Eliminar documentos",
        bulkReindexTitle:"Reindexar documentos",
        bulkDeleteBody:  (n) => <>¿Borrar <strong>{n}</strong> documentos? Esto elimina cada uno y todos sus chunks indexados. La acción no se puede deshacer.</>,
        bulkReindexBody: (n) => <>¿Reindexar <strong>{n}</strong> documentos? Puede tardar unos minutos por archivo.</>,
        deleteErrorGeneric:  "No se pudo eliminar.",
        reindexErrorGeneric: "No se pudo reindexar.",
        bulkSuccessDelete:  (ok) => `${ok} documento${ok === 1 ? "" : "s"} eliminados correctamente`,
        bulkSuccessReindex: (ok) => `${ok} documento${ok === 1 ? "" : "s"} reindexados correctamente`,
        bulkPartialDelete:  (ok, tot, failed) => `${ok} de ${tot} documentos eliminados — ${failed} con error`,
        bulkPartialReindex: (ok, tot, failed) => `${ok} de ${tot} documentos reindexados — ${failed} con error`,
        replaceErrorGeneric: "No se pudo reemplazar el documento. Intentá de nuevo.",
        deleteSuccess:       "Documento eliminado correctamente",
        replaceSuccess:      "Documento reemplazado correctamente",
        deleteErrorDoc:      "No se pudo eliminar el documento. Intentá de nuevo.",
        errorTitle:          "Error",
        close:               "Cerrar",
    } : {
        selected:        (n) => `${n} selected`,
        reindex:         "Reindex",
        delete:          "Delete",
        cancelSelection: "Cancel selection",
        discardErrorOf:  (name) => `Dismiss error for ${name}`,
        queued:          "Queued...",
        running:         "Processing...",
        done:            "Done",
        selectAllAria:   "Select all documents",
        colFile:         "File",
        colStatus:       "Status",
        colDate:         "Date",
        emptyTitle:      "You haven't uploaded any material to this course yet.",
        emptyHint:       "Drag a PDF, DOCX or TXT above and NexusAI indexes it so the assistant can answer about its content.",
        deleteTitle:     "Delete document",
        deleteConfirm:   "Delete",
        cancel:          "Cancel",
        deleteBody:      (name) => <>Delete <strong>{name}</strong>? This removes the document and all its indexed chunks. This action can't be undone.</>,
        replaceTitle:    "Replace document",
        replaceConfirm:  "Replace",
        replaceBody:     (oldName, newName) => <>Replace <strong>{oldName}</strong> with <strong>{newName}</strong>? The document is re-indexed from scratch; old chat citations keep pointing to this same material.</>,
        bulkDeleteTitle: "Delete documents",
        bulkReindexTitle:"Reindex documents",
        bulkDeleteBody:  (n) => <>Delete <strong>{n}</strong> documents? This removes each one and all its indexed chunks. This action can't be undone.</>,
        bulkReindexBody: (n) => <>Reindex <strong>{n}</strong> documents? This can take a few minutes per file.</>,
        deleteErrorGeneric:  "Couldn't delete it.",
        reindexErrorGeneric: "Couldn't reindex it.",
        bulkSuccessDelete:  (ok) => `${ok} document${ok === 1 ? "" : "s"} deleted successfully`,
        bulkSuccessReindex: (ok) => `${ok} document${ok === 1 ? "" : "s"} reindexed successfully`,
        bulkPartialDelete:  (ok, tot, failed) => `${ok} of ${tot} documents deleted — ${failed} with errors`,
        bulkPartialReindex: (ok, tot, failed) => `${ok} of ${tot} documents reindexed — ${failed} with errors`,
        replaceErrorGeneric: "Couldn't replace the document. Try again.",
        deleteSuccess:       "Document deleted successfully",
        replaceSuccess:      "Document replaced successfully",
        deleteErrorDoc:      "Couldn't delete the document. Try again.",
        errorTitle:          "Error",
        close:               "Close",
    };

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
                    type === "delete" ? L.deleteErrorGeneric : L.reindexErrorGeneric,
                    lang
                );
                setBulkQueue((prev) => prev.map((it) => (it.id === doc.id ? { ...it, status: "error", error: message } : it)));
            }
        }

        setBulkRunning(false);
        clearSelection();
        const ok = docs.length - failed;
        if (failed === 0) {
            showSuccess(type === "delete" ? L.bulkSuccessDelete(ok) : L.bulkSuccessReindex(ok));
            setBulkQueue([]);
        } else {
            showWarning(
                type === "delete"
                    ? L.bulkPartialDelete(ok, docs.length, failed)
                    : L.bulkPartialReindex(ok, docs.length, failed)
            );
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
            showSuccess(L.replaceSuccess);
        } catch (err) {
            setReplaceError(getFriendlyErrorMessage(err, L.replaceErrorGeneric, lang));
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
            showSuccess(L.deleteSuccess);
        } catch (err) {
            setDeleteError(getFriendlyErrorMessage(err, L.deleteErrorDoc, lang));
        } finally {
            setDeletingId(null);
        }
    };

    if (documents.length === 0) {
        return (
            <div className="nexusai-empty">
                <p>{L.emptyTitle}</p>
                <p className="nexusai-empty__hint">
                    {L.emptyHint}
                </p>
            </div>
        );
    }

    return (
        <>
            {selectedIds.size > 0 && (
                <div className="nexusai-bulkbar">
                    <span className="nexusai-bulkbar__count">
                        {L.selected(selectedIds.size)}
                    </span>
                    <button
                        type="button"
                        className="nexusai-link-btn"
                        onClick={() => requestBulkAction("reindex")}
                        disabled={bulkRunning}
                    >
                        {L.reindex}
                    </button>
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={() => requestBulkAction("delete")}
                        disabled={bulkRunning}
                    >
                        {L.delete}
                    </button>
                    <button
                        type="button"
                        className="nexusai-bulkbar__cancel"
                        onClick={clearSelection}
                        disabled={bulkRunning}
                    >
                        {L.cancelSelection}
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
                                            aria-label={L.discardErrorOf(item.filename)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="nexusai-upload-queue__status">
                                    {{ queued: L.queued, running: L.running, done: L.done }[item.status]}
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
                                    aria-label={L.selectAllAria}
                                />
                            </th>
                            <th>{L.colFile}</th>
                            <th>{L.colStatus}</th>
                            <th>{L.colDate}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                doc={doc}
                                lang={lang}
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
                    title={L.deleteTitle}
                    confirmLabel={L.deleteConfirm}
                    cancelLabel={L.cancel}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDoc(null)}
                >
                    {L.deleteBody(confirmDoc.filename)}
                </ConfirmModal>
            )}

            {replaceTarget && (
                <ConfirmModal
                    title={L.replaceTitle}
                    confirmLabel={L.replaceConfirm}
                    cancelLabel={L.cancel}
                    onConfirm={handleReplaceConfirm}
                    onCancel={() => setReplaceTarget(null)}
                >
                    {L.replaceBody(replaceTarget.doc.filename, replaceTarget.file.name)}
                </ConfirmModal>
            )}

            {bulkConfirm && (
                <ConfirmModal
                    title={bulkConfirm.type === "delete" ? L.bulkDeleteTitle : L.bulkReindexTitle}
                    confirmLabel={bulkConfirm.type === "delete" ? L.delete : L.reindex}
                    cancelLabel={L.cancel}
                    danger={bulkConfirm.type === "delete"}
                    onConfirm={runBulkAction}
                    onCancel={() => setBulkConfirm(null)}
                >
                    {bulkConfirm.type === "delete"
                        ? L.bulkDeleteBody(bulkConfirm.docs.length)
                        : L.bulkReindexBody(bulkConfirm.docs.length)}
                </ConfirmModal>
            )}

            {deleteError && (
                <ErrorModal
                    message={deleteError}
                    onClose={() => setDeleteError(null)}
                    lang={lang}
                />
            )}

            {replaceError && (
                <ErrorModal
                    message={replaceError}
                    onClose={() => setReplaceError(null)}
                    lang={lang}
                />
            )}
        </>
    );
}

// ============================================================
// Modal de error — exportado para que DocumentsManager lo use
// ============================================================

export function ErrorModal({ message, onClose, lang = "es" }) {
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
                    {lang === "es" ? "Error" : "Error"}
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
                        {lang === "es" ? "Cerrar" : "Close"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Fila de tabla
// ============================================================

function DocumentRow({ doc, lang, selected, onToggleSelect, onDelete, deleting, onReplace, replacing, previewOpen, preview, onTogglePreview }) {
    const showDate = STABLE_STATUSES.has(doc.status);
    const canPreview = doc.status === "indexed";

    const L = lang === "es" ? {
        selectAria:  (name) => `Seleccionar ${name}`,
        hideText:    "Ocultar texto",
        viewText:    "Ver texto extraído",
        replacing:   "Reemplazando...",
        replace:     "Reemplazar",
        deleting:    "Borrando...",
        delete:      "Eliminar",
    } : {
        selectAria:  (name) => `Select ${name}`,
        hideText:    "Hide text",
        viewText:    "View extracted text",
        replacing:   "Replacing...",
        replace:     "Replace",
        deleting:    "Deleting...",
        delete:      "Delete",
    };

    return (
        <>
            <tr className={`nexusai-table__row nexusai-table__row--${doc.status}`}>
                <td className="nexusai-table__checkbox-col">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        aria-label={L.selectAria(doc.filename)}
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
                    <StatusBadge status={doc.status} errorMessage={doc.error_message} lang={lang} />
                </td>
                <td className="nexusai-table__date">
                    {showDate ? formatIndexedAt(doc.updated_at, lang) : "—"}
                </td>
                <td className="nexusai-table__actions">
                    {canPreview && (
                        <button
                            type="button"
                            className="nexusai-link-btn"
                            onClick={onTogglePreview}
                            aria-expanded={previewOpen}
                        >
                            {previewOpen ? L.hideText : L.viewText}
                        </button>
                    )}
                    <button
                        type="button"
                        className="nexusai-link-btn"
                        onClick={onReplace}
                        disabled={replacing || deleting}
                    >
                        {replacing ? L.replacing : L.replace}
                    </button>
                    <button
                        type="button"
                        className="nexusai-link-btn nexusai-link-btn--danger"
                        onClick={onDelete}
                        disabled={deleting || replacing}
                    >
                        {deleting ? L.deleting : L.delete}
                    </button>
                </td>
            </tr>
            {previewOpen && (
                <tr className="nexusai-table__preview-row">
                    <td colSpan={5}>
                        <DocumentPreview preview={preview} lang={lang} />
                    </td>
                </tr>
            )}
        </>
    );
}

// ============================================================
// Preview del texto extraído (CONT-08 / #357)
// ============================================================

function DocumentPreview({ preview, lang = "es" }) {
    const L = lang === "es" ? {
        loading:   "Cargando texto extraído...",
        loadError: (e) => `No se pudo cargar el texto extraído: ${e}`,
        noText:    "No hay texto extraído todavía para este documento.",
        label:     "Primeros caracteres del texto que NexusAI indexó de este archivo. Si se ve vacío o con símbolos raros, la extracción falló (típico en PDFs escaneados sin OCR).",
    } : {
        loading:   "Loading extracted text...",
        loadError: (e) => `Couldn't load the extracted text: ${e}`,
        noText:    "There's no extracted text yet for this document.",
        label:     "First characters of the text NexusAI indexed from this file. If it looks empty or has odd symbols, extraction failed (typical for scanned PDFs without OCR).",
    };

    if (!preview || preview.loading) {
        return <p className="nexusai-preview__status">{L.loading}</p>;
    }
    if (preview.error) {
        return (
            <p className="nexusai-preview__status nexusai-preview__status--error">
                {L.loadError(preview.error)}
            </p>
        );
    }
    const { preview: text, truncated } = preview.data || {};
    if (!text) {
        return (
            <p className="nexusai-preview__status">
                {L.noText}
            </p>
        );
    }
    return (
        <div className="nexusai-preview">
            <p className="nexusai-preview__label">
                {L.label}
            </p>
            <pre className="nexusai-preview__text">{text}{truncated ? "…" : ""}</pre>
        </div>
    );
}

function formatIndexedAt(isoString, lang = "es") {
    if (!isoString) return "—";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const pad = (n) => String(n).padStart(2, "0");
    if (lang === "es") {
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusBadge({ status, errorMessage, lang = "es" }) {
    const labels = lang === "es" ? {
        pending:  { text: "En cola",   cls: "pending" },
        indexing: { text: "Indexando", cls: "indexing" },
        indexed:  { text: "Indexado",  cls: "indexed" },
        error:    { text: "Error",     cls: "error" },
    } : {
        pending:  { text: "Queued",    cls: "pending" },
        indexing: { text: "Indexing",  cls: "indexing" },
        indexed:  { text: "Indexed",   cls: "indexed" },
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
