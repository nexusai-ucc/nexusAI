/**
 * Tabla de documentos con polling automático.
 *
 * Mientras hay al menos un documento en estado pending/indexing, se hace
 * polling cada 3 segundos al backend para actualizar el estado. Cuando
 * todos están en estados estables (indexed | error), el polling se detiene.
 */

import { useEffect, useRef, useState } from "react";

import { deleteDocument, getDocumentStatus } from "./api.js";

const POLL_INTERVAL_MS = 3000;
const STABLE_STATUSES = new Set(["indexed", "error"]);

export default function DocumentsTable({ courseId, documents, onChange }) {
    const [deletingId, setDeletingId] = useState(null);
    const pollingTimer = useRef(null);

    // Polling: si hay alguno en pending/indexing, refrescamos cada 3s.
    useEffect(() => {
        const hasPending = documents.some((d) => !STABLE_STATUSES.has(d.status));
        if (!hasPending) {
            // No hay nada que polear, asegurarse de limpiar timer si quedó.
            if (pollingTimer.current) {
                clearTimeout(pollingTimer.current);
                pollingTimer.current = null;
            }
            return;
        }

        const tick = async () => {
            try {
                // Refrescar solo los documentos pending/indexing en paralelo.
                const updates = await Promise.all(
                    documents
                        .filter((d) => !STABLE_STATUSES.has(d.status))
                        .map((d) => getDocumentStatus(courseId, d.id))
                );
                onChange((prev) => {
                    const byId = new Map(updates.map((u) => [u.id, u]));
                    return prev.map((d) => byId.get(d.id) || d);
                });
            } catch (err) {
                // eslint-disable-next-line no-console
                console.warn("[NexusAI/documents] polling failed:", err);
            }
        };

        pollingTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
        return () => {
            if (pollingTimer.current) clearTimeout(pollingTimer.current);
        };
    }, [documents, courseId, onChange]);

    const handleDelete = async (doc) => {
        const confirmed = window.confirm(
            `¿Borrar "${doc.filename}"? Esto elimina el documento y todos sus chunks indexados. La acción no se puede deshacer.`
        );
        if (!confirmed) return;

        setDeletingId(doc.id);
        try {
            await deleteDocument(courseId, doc.id);
            onChange((prev) => prev.filter((d) => d.id !== doc.id));
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[NexusAI/documents] delete failed:", err);
            alert("Error al borrar: " + (err.message || err));
        } finally {
            setDeletingId(null);
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
                            onDelete={() => handleDelete(doc)}
                            deleting={deletingId === doc.id}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function formatIndexedAt(isoString) {
    if (!isoString) return "—";
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DocumentRow({ doc, onDelete, deleting }) {
    const showDate = STABLE_STATUSES.has(doc.status);
    return (
        <tr className={`nexusai-table__row nexusai-table__row--${doc.status}`}>
            <td>
                <div className="nexusai-table__filename">{doc.filename}</div>
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
    );
}

function StatusBadge({ status, errorMessage }) {
    const labels = {
        pending:  { text: "En cola",     cls: "pending" },
        indexing: { text: "Indexando",   cls: "indexing" },
        indexed:  { text: "✓ Indexado",  cls: "indexed" },
        error:    { text: "✕ Error",     cls: "error" },
    };
    const info = labels[status] || { text: status, cls: "unknown" };

    return (
        <span
            className={`nexusai-badge nexusai-badge--${info.cls}`}
            title={status === "error" ? errorMessage : ""}
        >
            {info.text}
        </span>
    );
}
