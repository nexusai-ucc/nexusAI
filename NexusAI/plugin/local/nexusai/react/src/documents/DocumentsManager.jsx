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
 *  - Tabs Material / Gaps detectados (Feature G) / Analytics (ANALYTICS-01/02) /
 *    Preguntas frecuentes (DOC-D02).
 */

import { useEffect, useRef, useState } from "react";

import { listDocuments, uploadDocument } from "./api.js";
import { listCourseSections } from "../api/courseSections.js";
import DocumentsTable, { ErrorModal } from "./DocumentsTable.jsx";
import UploadZone from "./UploadZone.jsx";
import GapsPanel from "./GapsPanel.jsx";
import FaqDashboardPanel from "./FaqDashboardPanel.jsx";
import AnalyticsDashboardPanel from "./AnalyticsDashboardPanel.jsx";
import ExamGeneratorPanel from "./ExamGeneratorPanel.jsx";
import SearchPanel from "../components/SearchPanel.jsx";
import { IconBarChart, IconBookOpen, IconCheck, IconClipboardList, IconHelpCircle, IconSearch, IconTarget } from "../components/icons.jsx";

const STABLE_STATUSES = new Set(["indexed", "error"]);
const POLL_INTERVAL_MS = 3000;
// UX-17 (#387): cantidad de documentos que se piden por página, tanto en
// la carga inicial como en cada "Cargar más".
const PAGE_SIZE = 30;

// RDS-05 (#404): nav lateral data-driven — reemplaza las 6 tabs
// hardcodeadas de antes.
const NAV_ITEMS = [
    { key: "material",  label: "Material",             Icon: IconBookOpen },
    { key: "gaps",      label: "Gaps detectados",       Icon: IconTarget },
    { key: "analytics", label: "Analytics",             Icon: IconBarChart },
    { key: "faq",       label: "Preguntas frecuentes",  Icon: IconHelpCircle },
    { key: "exam",      label: "Generar examen",        Icon: IconClipboardList },
    { key: "search",    label: "Buscar",                Icon: IconSearch },
];

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

export default function DocumentsManager({ courseid, userid, sesskey, lang = "es", courseFullname }) {
    const [documents, setDocuments]       = useState([]);
    const [total, setTotal]               = useState(0);
    const [loading, setLoading]           = useState(true);
    const [loadingMore, setLoadingMore]   = useState(false);
    const [uploading, setUploading]       = useState(false);
    const [error, setError]               = useState(null);
    const [warningToast, setWarningToast] = useState(null);
    const [activeTab, setActiveTab]       = useState("material"); // "material" | "gaps" | "faq" | "exam" | "search"
    const [sections, setSections]         = useState([]); // BUS-05: secciones del curso para el selector de upload
    const [selectedSection, setSelectedSection] = useState("");
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
                const data = await listDocuments(courseid, PAGE_SIZE, 0);
                if (!cancelled) {
                    setDocuments(data?.items || []);
                    setTotal(data?.total || 0);
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

    // ── Secciones del curso (BUS-05) ────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        listCourseSections(courseid).then((list) => {
            if (!cancelled) setSections(list || []);
        }).catch(() => {
            if (!cancelled) setSections([]);
        });
        return () => { cancelled = true; };
    }, [courseid]);

    // ── Polling automático ─────────────────────────────────────────────────
    // setInterval fijo: cada POLL_INTERVAL_MS consulta listDocuments si hay
    // algún doc en estado inestable. No depende de `documents` en el dep array,
    // así el interval no se recrea en cada actualización — usa documentsRef
    // para leer el estado fresco sin crear una dependencia.
    //
    // UX-17 (#387): pide `limit = documentsRef.current.length` en vez de
    // paginar desde cero — así el refresco automático respeta cuánto ya
    // cargó el docente con "Cargar más" en vez de devolverlo a la página 1.
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!documentsRef.current.some((d) => !STABLE_STATUSES.has(d.status))) {
                return; // nada pendiente, saltar este tick
            }
            try {
                const loadedCount = Math.max(documentsRef.current.length, PAGE_SIZE);
                const fresh = await listDocuments(courseid, loadedCount, 0);
                setDocuments(fresh?.items || []);
                setTotal(fresh?.total || 0);
            } catch (pollErr) {
                // Loguear pero no parar el polling — se reintenta en el próximo tick.
                // eslint-disable-next-line no-console
                console.warn("[NexusAI/documents] polling failed:", pollErr);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [courseid]); // solo se recrea si cambia el curso

    const hasMore = documents.length < total;

    // UX-17 (#387): wrapper de setDocuments para DocumentsTable — hoy solo
    // lo usa el borrado, que achica la lista. Mantiene `total` en sincro
    // con la cantidad real de documentos del curso (si no, quedaría
    // desactualizado y "Cargar más" ofrecería una página que ya no existe).
    const handleDocumentsChange = (updater) => {
        setDocuments((prev) => {
            const next = updater(prev);
            setTotal((t) => t - (prev.length - next.length));
            return next;
        });
    };

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const data = await listDocuments(courseid, PAGE_SIZE, documents.length);
            setDocuments((prev) => [...prev, ...(data?.items || [])]);
            setTotal(data?.total ?? total);
        } catch (err) {
            setError(extractErrorMessage(err));
        } finally {
            setLoadingMore(false);
        }
    };

    // ── Upload ─────────────────────────────────────────────────────────────
    const handleUpload = async (file) => {
        setUploading(true);
        setError(null);
        try {
            const section = selectedSection === "" ? null : Number(selectedSection);
            const newDoc = await uploadDocument(courseid, file, section);
            // El backend devuelve 200 con el doc existente cuando el contenido
            // es idéntico (CONT-04). Si el id ya está en la lista, el doc está
            // indexado — no sobreescribir con la respuesta que puede traer fecha nula.
            if (documentsRef.current.some((d) => d.id === newDoc.id)) {
                showWarningToast("Este documento ya se encuentra indexado en este curso.");
                return;
            }
            setDocuments((prev) => [newDoc, ...prev]);
            setTotal((prev) => prev + 1);
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
            <aside className="nexusai-doc-sidebar">
                <div className="nexusai-doc-sidebar__course">
                    <span className="nexusai-doc-sidebar__course-label">Curso</span>
                    <span className="nexusai-doc-sidebar__course-name">{courseFullname}</span>
                </div>

                <nav className="nexusai-doc-nav">
                    {NAV_ITEMS.map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            className={`nexusai-doc-nav__item ${activeTab === key ? "nexusai-doc-nav__item--active" : ""}`}
                            onClick={() => setActiveTab(key)}
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                            {key === "material" && (
                                <span className="nexusai-doc-nav__badge">{total}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="nexusai-doc-sidebar__status">
                    <IconCheck size={12} />
                    Asistente activo
                </div>
            </aside>

            <div className="nexusai-doc-content">
            {activeTab === "search" ? (
                <SearchPanel
                    courseId={courseid}
                    sesskey={sesskey}
                    isTeacher={true}
                    lang={lang}
                />
            ) : activeTab === "analytics" ? (
                <AnalyticsDashboardPanel courseId={courseid} />
            ) : activeTab === "faq" ? (
                <FaqDashboardPanel courseId={courseid} />
            ) : activeTab === "exam" ? (
                <ExamGeneratorPanel courseId={courseid} />
            ) : activeTab === "material" ? (
                loading ? (
                    <div className="nexusai-loading">Cargando documentos...</div>
                ) : (
                    <>
                        <p className="nexusai-documents__intro">
                            Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos
                            de este curso le hacen preguntas. Se aceptan PDF, DOCX, PPTX, XLSX, CSV, MD, HTML y TXT.
                            La indexación tarda aproximadamente 30-60 segundos por archivo.
                        </p>

                        {sections.length > 0 && (
                            <div className="nexusai-documents__section-picker">
                                <label htmlFor="nexusai-upload-section">Unidad/sección (opcional)</label>
                                <select
                                    id="nexusai-upload-section"
                                    className="nexusai-documents__section-select"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={uploading}
                                >
                                    <option value="">Sin asignar</option>
                                    {sections.map((s) => (
                                        <option key={s.section} value={s.section}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <UploadZone onUpload={handleUpload} disabled={uploading} />

                        <h3 className="nexusai-documents__heading">
                            Material indexado ({total})
                        </h3>

                        <DocumentsTable
                            courseId={courseid}
                            documents={documents}
                            onChange={handleDocumentsChange}
                        />

                        {hasMore && (
                            <button
                                type="button"
                                className="nexusai-documents__load-more"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? "Cargando..." : `Cargar más (${documents.length} de ${total})`}
                            </button>
                        )}

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
        </div>
    );
}
