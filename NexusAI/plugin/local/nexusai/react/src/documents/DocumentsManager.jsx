// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Part of the NexusAI plugin (local_nexusai).
 *
 * @copyright  2026 NexusAI Team — UCC
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Root component of the teacher view.
 *
 * Responsibilities:
 *  - Global state of the document list (initial load + updates).
 *  - Automatic polling: while there are pending/indexing docs, refreshes the whole
 *    list every POLL_INTERVAL_MS using listDocuments (which includes updated_at).
 *  - Upload: adds the new doc to the list only if the backend confirms success
 *    and the id is not there yet (avoids overwriting an existing doc with a null date).
 *  - Upload errors (incl. 409 and duplicates): shows ErrorModal, does not touch the list.
 *  - Tabs Material / Student questions (Gaps + FAQ, RDS-08) / Analytics
 *    (ANALYTICS-01/02) / Generate exam / Search.
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

// UX-12 (#370): loading skeleton of the Material tab — intro paragraph,
// upload area and rows of the indexed documents table.
function MaterialSkeleton({ lang = "es" }) {
    return (
        <SkeletonScreen label={lang === "es" ? "Cargando documentos..." : "Loading documents..."}>
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
// UX-17 (#387): number of documents requested per page, both on the
// initial load and on each "Load more".
const PAGE_SIZE = 30;

// RDS-05 (#404): data-driven side nav — replaces the 6 hardcoded tabs
// from before. ONB-07 (#430) adds "help".
function navItems(lang) {
    return lang === "es" ? [
        { key: "material",  label: "Material",             Icon: IconBookOpen },
        { key: "questions", label: "Preguntas de alumnos",  Icon: IconHelpCircle },
        { key: "analytics", label: "Analytics",             Icon: IconBarChart },
        { key: "exam",      label: "Generar examen",        Icon: IconClipboardList },
        { key: "search",    label: "Buscar",                Icon: IconSearch },
        { key: "help",      label: "Ayuda",                 Icon: IconInfo },
    ] : [
        { key: "material",  label: "Material",             Icon: IconBookOpen },
        { key: "questions", label: "Student questions",     Icon: IconHelpCircle },
        { key: "analytics", label: "Analytics",             Icon: IconBarChart },
        { key: "exam",      label: "Generate exam",         Icon: IconClipboardList },
        { key: "search",    label: "Search",                Icon: IconSearch },
        { key: "help",      label: "Help",                  Icon: IconInfo },
    ];
}
const NAV_KEYS = new Set(navItems("es").map((item) => item.key));

// UX-05 (#345): short description per tab for the side nav tooltip.
function navTooltips(lang) {
    return lang === "es" ? {
        material:  "Subir y gestionar el material indexado del curso",
        questions: "Preguntas frecuentes y sin responder detectadas en el chat",
        analytics: "Estadísticas de uso e interacciones de los alumnos",
        exam:      "Generar un examen exportable a partir del material",
        search:    "Buscar dentro del material indexado",
        help:      "Qué hace cada herramienta de NexusAI",
    } : {
        material:  "Upload and manage the course's indexed material",
        questions: "Frequent and unanswered questions detected in the chat",
        analytics: "Usage stats and student interactions",
        exam:      "Generate an exportable exam from the material",
        search:    "Search within the indexed material",
        help:      "What each NexusAI tool does",
    };
}

function DocumentsManagerInner({ courseid, userid, sesskey, lang = "es", courseFullname, initialTab }) {
    const [documents, setDocuments]       = useState([]);
    const [total, setTotal]               = useState(0);
    const [loading, setLoading]           = useState(true);
    const [loadingMore, setLoadingMore]   = useState(false);
    const [uploading, setUploading]       = useState(false);
    const [error, setError]               = useState(null);
    // ONB-07 (#430): documents.php can ask for an initial tab via ?tab=
    // (e.g. the "Help" link of the review checklist) — "material" if it does
    // not come or is not a valid key.
    const [activeTab, setActiveTab]       = useState(
        NAV_KEYS.has(initialTab) ? initialTab : "material"
    ); // "material" | "questions" | "analytics" | "exam" | "search" | "help"
    const [sections, setSections]         = useState([]); // BUS-05: course sections for the upload selector
    const [selectedSection, setSelectedSection] = useState("");
    const [visibleToStudents, setVisibleToStudents] = useState(true); // VIS-03: the activity's eye icon
    // CONT-06 (#320): queue of files being uploaded in sequence — one item per
    // file, { key, filename, status: "queued"|"uploading"|"error", error }.
    // "uploading"/"queued" go away on their own when they finish well; "error" stays
    // visible (with a button to dismiss it) because one that fails does not cancel
    // the others.
    const [uploadQueue, setUploadQueue]   = useState([]);
    const { showWarning } = useToast();

    const L = lang === "es" ? {
        loadDocsError:   "No se pudieron cargar los documentos.",
        loadMoreError:   "No se pudieron cargar más documentos.",
        uploadError:     "No se pudo subir el archivo.",
        alreadyIndexed:  (name) => `"${name}" ya se encuentra indexado en este curso.`,
        course:          "Curso",
        assistantActive: "Asistente activo",
        intro:           "Los archivos que subís acá quedan disponibles para el asistente NexusAI cuando los alumnos de este curso le hacen preguntas. Se aceptan PDF, DOCX, PPTX, XLSX, CSV, MD, HTML y TXT. La indexación tarda aproximadamente 30-60 segundos por archivo.",
        sectionLabel:    "Unidad del aula",
        chooseSection:   "Elegí una unidad",
        visibleLabel:    "Visible para alumnos",
        visibleHint:     "Cada archivo se crea como una actividad \"Archivo\" en esa unidad. Si lo dejás oculto, los alumnos no lo ven en el aula ni el asistente lo usa para responderles.",
        uploading:       "Subiendo...",
        queued:          "En cola...",
        dismissUploadError: (name) => `Descartar error de ${name}`,
        indexedMaterial: (n) => `Material indexado (${n})`,
        loading:         "Cargando...",
        loadMore:        (a, b) => `Cargar más (${a} de ${b})`,
    } : {
        loadDocsError:   "Couldn't load the documents.",
        loadMoreError:   "Couldn't load more documents.",
        uploadError:     "Couldn't upload the file.",
        alreadyIndexed:  (name) => `"${name}" is already indexed in this course.`,
        course:          "Course",
        assistantActive: "Assistant active",
        intro:           "Files you upload here become available to the NexusAI assistant when this course's students ask it questions. PDF, DOCX, PPTX, XLSX, CSV, MD, HTML and TXT are accepted. Indexing takes about 30-60 seconds per file.",
        sectionLabel:    "Course unit",
        chooseSection:   "Choose a unit",
        visibleLabel:    "Visible to students",
        visibleHint:     "Each file is created as a \"File\" activity in that unit. If you leave it hidden, students do not see it in the classroom and the assistant does not use it to answer them.",
        uploading:       "Uploading...",
        queued:          "Queued...",
        dismissUploadError: (name) => `Dismiss error for ${name}`,
        indexedMaterial: (n) => `Indexed material (${n})`,
        loading:         "Loading...",
        loadMore:        (a, b) => `Load more (${a} of ${b})`,
    };

    // Ref to read the current state from the setInterval closure without
    // adding it as a dependency of the effect (avoids recreating the interval).
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
                    setError(getFriendlyErrorMessage(err, L.loadDocsError, lang));
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [courseid]);

    // ── Course sections (BUS-05) ────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        listCourseSections(courseid).then((list) => {
            if (!cancelled) setSections(list || []);
        }).catch(() => {
            if (!cancelled) setSections([]);
        });
        return () => { cancelled = true; };
    }, [courseid]);

    // ── Automatic polling ──────────────────────────────────────────────────
    // Fixed setInterval: every POLL_INTERVAL_MS it calls listDocuments if any
    // doc is in an unstable state. It does not depend on `documents` in the dep
    // array, so the interval is not recreated on every update — it uses documentsRef
    // to read the fresh state without creating a dependency.
    //
    // UX-17 (#387): asks for `limit = documentsRef.current.length` instead of
    // paging from zero — so the automatic refresh respects how much the
    // teacher already loaded with "Load more" instead of sending them back to page 1.
    useEffect(() => {
        const intervalId = setInterval(async () => {
            if (!documentsRef.current.some((d) => !STABLE_STATUSES.has(d.status))) {
                return; // nothing pending, skip this tick
            }
            try {
                const loadedCount = Math.max(documentsRef.current.length, PAGE_SIZE);
                const fresh = await listDocuments(courseid, loadedCount, 0);
                setDocuments(fresh?.items || []);
                setTotal(fresh?.total || 0);
            } catch (pollErr) {
                // Log but do not stop polling — it is retried on the next tick.
                // eslint-disable-next-line no-console
                console.warn("[NexusAI/documents] polling failed:", pollErr);
            }
        }, POLL_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [courseid]); // only recreated if the course changes

    const hasMore = documents.length < total;

    // UX-17 (#387): setDocuments wrapper for DocumentsTable — today only
    // deletion uses it, which shrinks the list. Keeps `total` in sync with
    // the real number of documents of the course (otherwise it would get
    // stale and "Load more" would offer a page that no longer exists).
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
            setError(getFriendlyErrorMessage(err, L.loadMoreError, lang));
        } finally {
            setLoadingMore(false);
        }
    };

    // ── Upload ─────────────────────────────────────────────────────────────
    // CONT-06 (#320): receives an array of files and uploads them IN SEQUENCE
    // (not in parallel — simpler and avoids race conditions with the name
    // collision detection and with documentsRef, which assume one upload at
    // a time). If one fails, it goes on with the next one.
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

        // Without a list of sections (it did not load) it uploads to General (0).
        const section = selectedSection === "" ? 0 : Number(selectedSection);

        for (const item of items) {
            setUploadQueue((prev) =>
                prev.map((q) => (q.key === item.key ? { ...q, status: "uploading" } : q))
            );
            try {
                const newDoc = await uploadDocument(courseid, item.file, section, visibleToStudents);
                // The backend returns 200 with the existing doc when the content
                // is identical (CONT-04). If the id is already in the list, the doc
                // is indexed — do not overwrite it with the response, which may carry a null date.
                if (documentsRef.current.some((d) => d.id === newDoc.id)) {
                    showWarning(L.alreadyIndexed(item.filename));
                } else {
                    setDocuments((prev) => [newDoc, ...prev]);
                    setTotal((prev) => prev + 1);
                }
                setUploadQueue((prev) => prev.filter((q) => q.key !== item.key));
            } catch (err) {
                const raw = err?.message || String(err);
                if (/HTTP\s+409\b/.test(raw)) {
                    showWarning(L.alreadyIndexed(item.filename));
                    setUploadQueue((prev) => prev.filter((q) => q.key !== item.key));
                } else {
                    const msg = getFriendlyErrorMessage(err, L.uploadError, lang);
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

    const NAV_ITEMS = navItems(lang);
    const NAV_TOOLTIPS = navTooltips(lang);

    return (
        <>
            <aside className="nexusai-doc-sidebar">
                <div className="nexusai-doc-sidebar__course">
                    <span className="nexusai-doc-sidebar__course-label">{L.course}</span>
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
                    {L.assistantActive}
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
                <AnalyticsDashboardPanel courseId={courseid} courseName={courseFullname} lang={lang} />
            ) : activeTab === "exam" ? (
                <ExamGeneratorPanel courseId={courseid} lang={lang} />
            ) : activeTab === "help" ? (
                <HelpPanel lang={lang} />
            ) : activeTab === "material" ? (
                loading ? (
                    <MaterialSkeleton lang={lang} />
                ) : (
                    <>
                        <p className="nexusai-documents__intro">
                            {L.intro}
                        </p>

                        <div className="nexusai-doc-card">
                            {sections.length > 0 && (
                                <div className="nexusai-documents__section-picker">
                                    <label htmlFor="nexusai-upload-section">{L.sectionLabel}</label>
                                    <select
                                        id="nexusai-upload-section"
                                        className="nexusai-documents__section-select"
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        disabled={uploading}
                                    >
                                        <option value="" disabled>{L.chooseSection}</option>
                                        {sections.map((s) => (
                                            <option key={s.section} value={s.section}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <label className="nexusai-visibility-toggle" htmlFor="nexusai-upload-visible">
                                <input
                                    id="nexusai-upload-visible"
                                    type="checkbox"
                                    checked={visibleToStudents}
                                    onChange={(e) => setVisibleToStudents(e.target.checked)}
                                    disabled={uploading}
                                />
                                <span>{L.visibleLabel}</span>
                            </label>
                            <p className="nexusai-documents__hint">{L.visibleHint}</p>

                            <UploadZone onUpload={handleUpload} disabled={uploading || (sections.length > 0 && selectedSection === "")} lang={lang} />

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
                                                        aria-label={L.dismissUploadError(item.filename)}
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="nexusai-upload-queue__status">
                                                    {item.status === "uploading" ? L.uploading : L.queued}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <h3 className="nexusai-documents__heading">
                                {L.indexedMaterial(total)}
                            </h3>

                            <DocumentsTable
                                courseId={courseid}
                                documents={documents}
                                onChange={handleDocumentsChange}
                                lang={lang}
                            />

                            {hasMore && (
                                <button
                                    type="button"
                                    className="nexusai-documents__load-more"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? L.loading : L.loadMore(documents.length, total)}
                                </button>
                            )}
                        </div>

                        {error && (
                            <ErrorModal
                                message={error}
                                onClose={() => setError(null)}
                                lang={lang}
                            />
                        )}
                    </>
                )
            ) : (
                <StudentQuestionsPanel courseId={courseid} lang={lang} />
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
