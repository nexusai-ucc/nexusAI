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
 *  - Tabs Material / Preguntas de alumnos (Gaps + FAQ, RDS-08) / Analytics
 *    (ANALYTICS-01/02) / Generar examen / Buscar.
 */

import { useEffect, useRef, useState } from "react";

import { listDocuments, uploadDocument } from "./api.js";
import { listCourseSections } from "../api/courseSections.js";
import DocumentsTable, { ErrorModal } from "./DocumentsTable.jsx";
import UploadZone from "./UploadZone.jsx";
import StudentQuestionsPanel from "./StudentQuestionsPanel.jsx";
import AnalyticsDashboardPanel from "./AnalyticsDashboardPanel.jsx";
import ExamGeneratorPanel from "./ExamGeneratorPanel.jsx";
import HelpPanel from "./HelpPanel.jsx";
import SearchPanel from "../components/SearchPanel.jsx";
import Tooltip from "../components/Tooltip.jsx";
import { IconBarChart, IconBookOpen, IconCheck, IconClipboardList, IconHelpCircle, IconInfo, IconSearch } from "../components/icons.jsx";
import { ToastProvider, useToast } from "../components/Toast.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";
import Skeleton, { SkeletonScreen } from "../components/Skeleton.jsx";

// UX-12 (#370): silueta de carga de la pestaña Material — párrafo de intro,
// zona de subida y filas de la tabla de documentos indexados.
function MaterialSkeleton() {
    return (
        <SkeletonScreen label="Cargando documentos...">
            <Skeleton className="nexusai-skeleton-doc__intro" height={32} />
            <Skeleton className="nexusai-skeleton-doc__zone" />
            <Skeleton width="45%" height={15} style={{ marginBottom: 12 }} />
            <div className="nexusai-skeleton-doc__rows">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="nexusai-skeleton-doc__row">
                        <Skeleton width={16} height={16} radius={4} />
                        <Skeleton width={`${55 + ((i * 13) % 35)}%`} height={12} />
                        <Skeleton height={10} />
                        <Skeleton height={10} />
                        <Skeleton width={16} height={16} radius={4} />
                    </div>
                ))}
            </div>
        </SkeletonScreen>
    );
}

const STABLE_STATUSES = new Set(["indexed", "error"]);
const POLL_INTERVAL_MS = 3000;
// UX-17 (#387): cantidad de documentos que se piden por página, tanto en
// la carga inicial como en cada "Cargar más".
const PAGE_SIZE = 30;

// RDS-05 (#404): nav lateral data-driven — reemplaza las 6 tabs
// hardcodeadas de antes. ONB-07 (#430) suma "help".
const NAV_ITEMS = [
    { key: "material",  label: "Material",             Icon: IconBookOpen },
    { key: "questions", label: "Preguntas de alumnos",  Icon: IconHelpCircle },
    { key: "analytics", label: "Analytics",             Icon: IconBarChart },
    { key: "exam",      label: "Generar examen",        Icon: IconClipboardList },
    { key: "search",    label: "Buscar",                Icon: IconSearch },
    { key: "help",      label: "Ayuda",                 Icon: IconInfo },
];
const NAV_KEYS = new Set(NAV_ITEMS.map((item) => item.key));

// UX-05 (#345): descripción corta por tab para el tooltip del nav lateral.
const NAV_TOOLTIPS = {
    material:  "Subir y gestionar el material indexado del curso",
    questions: "Preguntas frecuentes y sin responder detectadas en el chat",
    analytics: "Estadísticas de uso e interacciones de los alumnos",
    exam:      "Generar un examen exportable a partir del material",
    search:    "Buscar dentro del material indexado",
    help:      "Qué hace cada herramienta de NexusAI",
};

function DocumentsManagerInner({ courseid, userid, sesskey, lang = "es", courseFullname, initialTab }) {
    const [documents, setDocuments]       = useState([]);
    const [total, setTotal]               = useState(0);
    const [loading, setLoading]           = useState(true);
    const [loadingMore, setLoadingMore]   = useState(false);
    const [uploading, setUploading]       = useState(false);
    const [error, setError]               = useState(null);
    // ONB-07 (#430): documents.php puede pedir un tab inicial vía ?tab=
    // (p.ej. el link "Ayuda" del checklist de revisión) — "material" si no
    // viene o no es una key válida.
    const [activeTab, setActiveTab]       = useState(
        NAV_KEYS.has(initialTab) ? initialTab : "material"
    ); // "material" | "questions" | "analytics" | "exam" | "search" | "help"
    const [sections, setSections]         = useState([]); // BUS-05: secciones del curso para el selector de upload
    const [selectedSection, setSelectedSection] = useState("");
    // CONT-06 (#320): cola de archivos subiéndose en secuencia — un item por
    // archivo, { key, filename, status: "queued"|"uploading"|"error", error }.
    // "uploading"/"queued" se sacan solos al terminar bien; "error" queda
    // visible (con botón para descartarlo) porque uno que falla no cancela
    // a los demás.
    const [uploadQueue, setUploadQueue]   = useState([]);
    const { showWarning } = useToast();

    // Ref para acceder al estado actual desde el closure del setInterval
    // sin incluirlo como dependencia del effect (evita recrear el interval).
    const documentsRef = useRef([]);
    documentsRef.current = documents;

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
                    setError(getFriendlyErrorMessage(err, "No se pudieron cargar los documentos.", lang));
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
            setError(getFriendlyErrorMessage(err, "No se pudieron cargar más documentos.", lang));
        } finally {
            setLoadingMore(false);
        }
    };

    // ── Upload ─────────────────────────────────────────────────────────────
    // CONT-06 (#320): recibe un array de archivos y los sube EN SECUENCIA
    // (no en paralelo — más simple y evita condiciones de carrera con la
    // detección de colisión de nombre y con documentsRef, que asumen un
    // upload a la vez). Si uno falla, se sigue con el siguiente.
    const handleUpload = async (files) => {
        const items = files.map((file, idx) => ({
            key: `${Date.now()}-${idx}-${file.name}`,
            file,
            filename: file.name,
            status: "queued",
            error: null,
        }));
        setUploadQueue((prev) => [...prev, ...items]);
        setUploading(true);

        const section = selectedSection === "" ? null : Number(selectedSection);

        for (const item of items) {
            setUploadQueue((prev) =>
                prev.map((q) => (q.key === item.key ? { ...q, status: "uploading" } : q))
            );
            try {
                const newDoc = await uploadDocument(courseid, item.file, section);
                // El backend devuelve 200 con el doc existente cuando el contenido
                // es idéntico (CONT-04). Si el id ya está en la lista, el doc está
                // indexado — no sobreescribir con la respuesta que puede traer fecha nula.
                if (documentsRef.current.some((d) => d.id === newDoc.id)) {
                    showWarning(`"${item.filename}" ya se encuentra indexado en este curso.`);
                } else {
                    setDocuments((prev) => [newDoc, ...prev]);
                    setTotal((prev) => prev + 1);
                }
                setUploadQueue((prev) => prev.filter((q) => q.key !== item.key));
            } catch (err) {
                const raw = err?.message || String(err);
                if (/HTTP\s+409\b/.test(raw)) {
                    showWarning(`"${item.filename}" ya se encuentra indexado en este curso.`);
                    setUploadQueue((prev) => prev.filter((q) => q.key !== item.key));
                } else {
                    const msg = getFriendlyErrorMessage(err, "No se pudo subir el archivo.", lang);
                    setUploadQueue((prev) =>
                        prev.map((q) => (q.key === item.key ? { ...q, status: "error", error: msg } : q))
                    );
                }
            }
        }

        setUploading(false);
    };

    const handleDismissUploadError = (key) => {
        setUploadQueue((prev) => prev.filter((q) => q.key !== key));
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <>
            <aside className="nexusai-doc-sidebar">
                <div className="nexusai-doc-sidebar__course">
                    <span className="nexusai-doc-sidebar__course-label">Curso</span>
                    <span className="nexusai-doc-sidebar__course-name">{courseFullname}</span>
                </div>

                <nav className="nexusai-doc-nav">
                    {NAV_ITEMS.map(({ key, label, Icon }) => (
                        <Tooltip key={key} label={NAV_TOOLTIPS[key]} placement="top">
                            <button
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
                        </Tooltip>
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
            ) : activeTab === "exam" ? (
                <ExamGeneratorPanel courseId={courseid} />
            ) : activeTab === "help" ? (
                <HelpPanel lang={lang} />
            ) : activeTab === "material" ? (
                loading ? (
                    <MaterialSkeleton />
                ) : (
                    <>
                        <p className="nexusai-documents__intro">
                            Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos
                            de este curso le hacen preguntas. Se aceptan PDF, DOCX, PPTX, XLSX, CSV, MD, HTML y TXT.
                            La indexación tarda aproximadamente 30-60 segundos por archivo.
                        </p>

                        <div className="nexusai-doc-card">
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

                            {uploadQueue.length > 0 && (
                                <ul className="nexusai-upload-queue">
                                    {uploadQueue.map((item) => (
                                        <li
                                            key={item.key}
                                            className={`nexusai-upload-queue__item nexusai-upload-queue__item--${item.status}`}
                                        >
                                            <span className="nexusai-upload-queue__name">{item.filename}</span>
                                            {item.status === "error" ? (
                                                <>
                                                    <span className="nexusai-upload-queue__status">{item.error}</span>
                                                    <button
                                                        type="button"
                                                        className="nexusai-upload-queue__dismiss"
                                                        onClick={() => handleDismissUploadError(item.key)}
                                                        aria-label={`Descartar error de ${item.filename}`}
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="nexusai-upload-queue__status">
                                                    {item.status === "uploading" ? "Subiendo..." : "En cola..."}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

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
                        </div>

                        {error && (
                            <ErrorModal
                                message={error}
                                onClose={() => setError(null)}
                            />
                        )}
                    </>
                )
            ) : (
                <StudentQuestionsPanel courseId={courseid} />
            )}
            </div>
        </>
    );
}

export default function DocumentsManager(props) {
    return (
        <div className="nexusai-documents">
            <ToastProvider>
                <DocumentsManagerInner {...props} />
            </ToastProvider>
        </div>
    );
}
