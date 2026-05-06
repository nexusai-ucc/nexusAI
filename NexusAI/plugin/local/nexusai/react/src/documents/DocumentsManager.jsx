/**
 * Componente raíz de la vista docente — gestiona el estado completo:
 *   - lista de documentos del curso (carga inicial + actualizaciones)
 *   - estado del upload en curso
 *   - errores de carga / upload
 */

import { useEffect, useState } from "react";

import { listDocuments, uploadDocument } from "./api.js";
import UploadZone from "./UploadZone.jsx";
import DocumentsTable from "./DocumentsTable.jsx";

export default function DocumentsManager({ courseid, userid, lang = "es" }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    // Carga inicial.
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
                    setError("Error cargando documentos: " + (err.message || err));
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [courseid]);

    const handleUpload = async (file) => {
        setUploading(true);
        setError(null);
        try {
            const newDoc = await uploadDocument(courseid, file);
            // Lo agregamos al principio de la lista (orden cronológico descendente).
            setDocuments((prev) => [newDoc, ...prev]);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[NexusAI/documents] upload failed:", err);
            setError("Error al subir: " + (err.message || err));
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="nexusai-loading">
                Cargando documentos...
            </div>
        );
    }

    return (
        <div className="nexusai-documents">
            <p className="nexusai-documents__intro">
                Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos
                de este curso le hacen preguntas. La indexación tarda aproximadamente 30-60 segundos por PDF.
            </p>

            <UploadZone onUpload={handleUpload} disabled={uploading} />

            {error && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        className="nexusai-link-btn"
                        onClick={() => setError(null)}
                    >
                        Cerrar
                    </button>
                </div>
            )}

            <h3 className="nexusai-documents__heading">
                Material indexado ({documents.length})
            </h3>

            <DocumentsTable
                courseId={courseid}
                documents={documents}
                onChange={setDocuments}
            />
        </div>
    );
}
