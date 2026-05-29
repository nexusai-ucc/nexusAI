/**
 * Componente raíz de la vista docente.
 *
 * Responsabilidades:
 *  - Estado global de la lista de documentos (carga inicial + actualizaciones).
 *  - Polling automático: mientras haya docs pending/indexing, refresca la lista
 *    completa cada POLL_INTERVAL_MS usando listDocuments (que incluye updated_at).
 *  - Upload: agrega el doc nuevo a la lista solo si el backend confirma éxito
 *    y el id no existe ya (evita sobreescribir un doc existente con fecha nula).
 *  - Errores de upload (incl. 409 y duplicados): muestra ErrorModal, no toca lista.
 *  - Tabs Material / Gaps detectados (Feature G).
 */

import { useEffect, useRef, useState } from "react";

import { listDocuments, uploadDocument } from "./api.js";
import DocumentsTable, { ErrorModal } from "./DocumentsTable.jsx";
import UploadZone from "./UploadZone.jsx";
import GapsPanel from "./GapsPanel.jsx";
import { IconBookOpen, IconTarget } from "../components/icons.jsx";

const STABLE_STATUSES = new Set(["indexed", "error"]);
const POLL_INTERVAL_MS = 3000;

/**
 * Extrae el mensaje legible de un error de Moodle/FastAPI.
 *
 * Moodle formatea los errores de backend como:
 *   "Error del backend NexusAI: HTTP 409: {"detail": "mensaje limpio"}"
 * Intentamos sacar el "detail" primero; si no, lo que sigue al código HTTP.
 */
function extractErrorMessage(err) {
    const raw = err?.message || String(err);
    // Intentar extraer el campo "detail" del JSON de FastAPI embebido en el string.
    const detailMatch = raw.match(/"detail"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (detailMatch) return detailMatch[1];
    // Fallback: tomar lo que va después de "HTTP NNN: "
    const httpMatch = raw.match(/HTTP\s+\d+[:\s]+(.+)/s);
    if (httpMatch) return httpMatch[1].trim();
    return raw;
}

export default function DocumentsManager({ courseid, userid, lang = "es" }) {
    const [documents, setDocuments]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [uploading, setUploading]       = useState(false);
    const [error, setError]               = useState(null);
    const [warningToast, setWarningToast] = useState(null);
    const [activeTab, setActiveTab]       = useState("material"); // "material" | "gaps"
    const warningTimerRef = useRef(null);

    // Ref para acceder al estado actual desde el closure del setInterval
    // sin incluirlo como dependencia del effect (evita recrear el interval).
    const documentsRef = useRef([]);
    documentsRef.current = documents;

    const showWarningToast = (message) => {
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        setWarningToast(message);
        warningTimerRef.current = setTimeout(() => setWarningToast(null), 3000);
    };

    // ── Carga inicial ──────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const docs = await listDocuments(courseid);
                if (!cancelled) {
                    setDocuments(docs);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(extractErrorMessage(err));
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [courseid]);

    // ── Polling automático ─────────────────────────────────────────────────
    // setInterval fijo: cada POLL_INTERVAL_MS consulta listDocuments si hay
    // algún doc en estado inestable. No depende de `documents` en el dep array,
    // así el interval no se recrea en cada actualización — usa documentsRef
    // para leer el estado fresco sin crear una dependencia.
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!documentsRef.current.some((d) => !STABLE_STATUSES.has(d.status))) {
                return; // nada pendiente, saltar este tick
            }
            try {
                const fresh = await listDocuments(courseid);
                setDocuments(fresh);
            } catch (pollErr) {
                // Loguear pero no parar el polling — se reintenta en el próximo tick.
                // eslint-disable-next-line no-console
                console.warn("[NexusAI/documents] polling failed:", pollErr);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [courseid]); // solo se recrea si cambia el curso

    // ── Upload ─────────────────────────────────────────────────────────────
    const handleUpload = async (file) => {
        setUploading(true);
        setError(null);
        try {
            const newDoc = await uploadDocument(courseid, file);
            // El backend devuelve 200 con el doc existente cuando el contenido
            // es idéntico (CONT-04). Si el id ya está en la lista, el doc está
            // indexado — no sobreescribir con la respuesta que puede traer fecha nula.
            if (documentsRef.current.some((d) => d.id === newDoc.id)) {
                showWarningToast("Este documento ya se encuentra indexado en este curso.");
                return;
            }
            setDocuments((prev) => [newDoc, ...prev]);
        } catch (err) {
            const raw = err?.message || String(err);
            if (/HTTP\s+409\b/.test(raw)) {
                showWarningToast("Este documento ya se encuentra indexado en este curso.");
            } else {
                setError(extractErrorMessage(err));
            }
        } finally {
            setUploading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="nexusai-documents">
            {/* Tabs Material / Gaps (Feature G) */}
            <div className="nexusai-doc-tabs">
                <button
                    type="button"
                    className={`nexusai-doc-tab ${activeTab === "material" ? "nexusai-doc-tab--active" : ""}`}
                    onClick={() => setActiveTab("material")}
                >
                    <IconBookOpen size={15} />
                    Material
                </button>
                <button
                    type="button"
                    className={`nexusai-doc-tab ${activeTab === "gaps" ? "nexusai-doc-tab--active" : ""}`}
                    onClick={() => setActiveTab("gaps")}
                >
                    <IconTarget size={15} />
                    Gaps detectados
                </button>
            </div>

            {activeTab === "material" ? (
                loading ? (
                    <div className="nexusai-loading">Cargando documentos...</div>
                ) : (
                    <>
                        <p className="nexusai-documents__intro">
                            Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos
                            de este curso le hacen preguntas. Se aceptan PDF, DOCX y TXT. La indexación tarda
                            aproximadamente 30-60 segundos por archivo.
                        </p>

                        <UploadZone onUpload={handleUpload} disabled={uploading} />

                        <h3 className="nexusai-documents__heading">
                            Material indexado ({documents.length})
                        </h3>

                        <DocumentsTable
                            courseId={courseid}
                            documents={documents}
                            onChange={setDocuments}
                        />

                        {error && (
                            <ErrorModal
                                message={error}
                                onClose={() => setError(null)}
                            />
                        )}

                        {warningToast && (
                            <div className="nexusai-toast nexusai-toast--warning" role="status">
                                {warningToast}
                            </div>
                        )}
                    </>
                )
            ) : (
                <GapsPanel courseId={courseid} />
            )}
        </div>
    );
}
