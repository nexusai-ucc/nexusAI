/**
 * SearchPanel — búsqueda híbrida en material del curso (Feature A / BUS-02).
 *
 * Cuando isTeacher=true (documentos page) el toggle de modo global no aparece:
 * el docente siempre busca en su propio curso.
 * Cuando isTeacher=false (uso futuro desde vista alumno) el toggle permite
 * cambiar entre "este curso" y "todos mis cursos".
 *
 * Filtro por tipo de material (BUS-02): mime type capturado al subir el
 * archivo, threadeado hasta el backend.
 * Filtro por unidad/sección (BUS-05): sección de Moodle asignada (opcional)
 * al subir el archivo. Se oculta en modo búsqueda global — los números de
 * sección no tienen sentido cruzando cursos.
 */

import { useEffect, useState } from "react";
import { searchMaterial } from "../api/search.js";
import { summarizeDocument } from "../api/summary.js";
import { listCourseSections } from "../api/courseSections.js";
import { IconBookOpen, IconFile, IconFileText, IconGlobe } from "./icons.jsx";

const MATERIAL_TYPE_LABELS = {
    "application/pdf": { es: "PDF", en: "PDF" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { es: "Word", en: "Word" },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { es: "PowerPoint", en: "PowerPoint" },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { es: "Excel", en: "Excel" },
    "text/plain": { es: "Texto", en: "Text" },
    "text/csv": { es: "CSV", en: "CSV" },
    "text/markdown": { es: "Markdown", en: "Markdown" },
    "text/html": { es: "HTML", en: "HTML" },
};
const MATERIAL_TYPE_FILTERS = Object.keys(MATERIAL_TYPE_LABELS);

function FileIcon({ filename }) {
    const ext = (filename || "").split(".").pop().toLowerCase();
    if (ext === "txt") return <IconFileText size={14} />;
    return <IconFile size={14} />;
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resalta los términos de `query` dentro de `text` envolviéndolos en <mark>.
 * Puramente client-side (nodos React, no dangerouslySetInnerHTML) — sin
 * riesgo de inyectar HTML crudo proveniente del contenido del documento. */
function highlightContent(text, query) {
    const terms = (query || "").split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 1);
    if (!text || !terms.length) return text;
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
    return text.split(pattern).map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase())
            ? <mark key={i}>{part}</mark>
            : part
    );
}

export default function SearchPanel({
    courseId,
    sesskey,
    isTeacher = false,
    lang = "es",
    scopeOverride,
}) {
    const [query, setQuery]           = useState("");
    const [results, setResults]       = useState(null);
    const [lastQuery, setLastQuery]   = useState("");
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [globalMode, setGlobalMode] = useState(false);
    const [materialType, setMaterialType] = useState("");
    const [summaries, setSummaries] = useState({});
    const [section, setSection] = useState(""); // "" = todas | "-1" = sin asignar | número = sección real
    const [sections, setSections] = useState([]);

    const effectiveGlobal = scopeOverride !== undefined ? scopeOverride : globalMode;

    useEffect(() => {
        let cancelled = false;
        listCourseSections(courseId).then((list) => {
            if (!cancelled) setSections(list || []);
        }).catch(() => {
            if (!cancelled) setSections([]);
        });
        return () => { cancelled = true; };
    }, [courseId]);

    const L = lang === "es" ? {
        placeholder:  "Buscá en el material del curso...",
        button:       "Buscar",
        scopeCourse:  "Este curso",
        scopeGlobal:  "Todos mis cursos",
        typeAll:      "Todos",
        sectionAll:   "Todas las unidades",
        sectionUnassigned: "Sin unidad asignada",
        noResults:    (q) => `No se encontraron resultados para "${q}".`,
        error:        "No se pudo realizar la búsqueda. Intentá de nuevo.",
        openFile:        "Abrir ↗",
        summarize:       "Resumir",
        hideSummary:     "Ocultar resumen",
        summaryLabel:    "Resumen generado por IA",
        summaryError:    "No se pudo generar el resumen. Intentá de nuevo.",
    } : {
        placeholder:  "Search in course material...",
        button:       "Search",
        scopeCourse:  "This course",
        scopeGlobal:  "All my courses",
        typeAll:      "All",
        sectionAll:   "All sections",
        sectionUnassigned: "Unassigned",
        noResults:    (q) => `No results found for "${q}".`,
        error:        "Search failed. Please try again.",
        openFile:        "Open ↗",
        summarize:       "Summarize",
        hideSummary:     "Hide summary",
        summaryLabel:    "AI-generated summary",
        summaryError:    "Could not generate summary. Try again.",
    };

    const performSearch = async (q) => {
        setLoading(true);
        setError(null);
        setLastQuery(q);
        try {
            const data = await searchMaterial({
                query: q,
                courseId,
                global: effectiveGlobal,
                materialType,
                section: section === "" || section === "-1" ? null : Number(section),
                sectionUnassigned: section === "-1",
            });
            setResults(data);
        } catch {
            setError(L.error);
        } finally {
            setLoading(false);
            document.activeElement?.blur();
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        await performSearch(query.trim());
    };

    const switchScope = (toGlobal) => {
        setGlobalMode(toGlobal);
        setResults(null);
        setError(null);
    };

    const changeMaterialType = (mime) => {
        setMaterialType(mime);
        setResults(null);
        setError(null);
    };

    const handleSummarize = async (documentId) => {
        const current = summaries[documentId];
        if (current?.text) {
            setSummaries(prev => ({ ...prev, [documentId]: { ...prev[documentId], visible: !prev[documentId].visible } }));
            return;
        }
        setSummaries(prev => ({ ...prev, [documentId]: { loading: true, text: null, error: null, visible: true } }));
        try {
            const data = await summarizeDocument({ documentId, courseId });
            setSummaries(prev => ({ ...prev, [documentId]: { loading: false, text: data.summary, error: null, visible: true } }));
        } catch {
            setSummaries(prev => ({ ...prev, [documentId]: { loading: false, text: null, error: L.summaryError, visible: true } }));
        }
    };

    const changeSection = (value) => {
        setSection(value);
        setResults(null);
        setError(null);
    };

    const openDownload = (filename, resultCourseId) => {
        if (!filename || !sesskey) return;
        const params = new URLSearchParams({
            courseid: String(resultCourseId || courseId || ""),
            filename,
            sesskey,
        });
        window.open(
            `/local/nexusai/document_download.php?${params}`,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className="nexusai-search">
            <form onSubmit={handleSearch} className="nexusai-search__form">
                <input
                    type="text"
                    className="nexusai-search__input"
                    placeholder={L.placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={500}
                />
                <button
                    type="submit"
                    className="nexusai-search__btn"
                    disabled={loading || !query.trim()}
                >
                    {loading ? "..." : L.button}
                </button>
            </form>

            {!isTeacher && scopeOverride === undefined && (
                <div className="nexusai-search__scope">
                    <button
                        type="button"
                        className={`nexusai-search__scope-btn${!globalMode ? " nexusai-search__scope-btn--active" : ""}`}
                        onClick={() => switchScope(false)}
                    >
                        <IconBookOpen size={12} />
                        {L.scopeCourse}
                    </button>
                    <button
                        type="button"
                        className={`nexusai-search__scope-btn${globalMode ? " nexusai-search__scope-btn--active" : ""}`}
                        onClick={() => switchScope(true)}
                    >
                        <IconGlobe size={12} />
                        {L.scopeGlobal}
                    </button>
                </div>
            )}

            <div className="nexusai-search__typebtns">
                <button
                    type="button"
                    className={`nexusai-search__typebtn ${materialType === "" ? "nexusai-search__typebtn--active" : ""}`}
                    onClick={() => changeMaterialType("")}
                >
                    {L.typeAll}
                </button>
                {MATERIAL_TYPE_FILTERS.map((mime) => (
                    <button
                        key={mime}
                        type="button"
                        className={`nexusai-search__typebtn ${materialType === mime ? "nexusai-search__typebtn--active" : ""}`}
                        onClick={() => changeMaterialType(mime)}
                    >
                        {MATERIAL_TYPE_LABELS[mime][lang === "es" ? "es" : "en"]}
                    </button>
                ))}
            </div>

            {!effectiveGlobal && sections.length > 0 && (
                <select
                    className="nexusai-search__sectionselect"
                    value={section}
                    onChange={(e) => changeSection(e.target.value)}
                    aria-label={L.sectionAll}
                >
                    <option value="">{L.sectionAll}</option>
                    <option value="-1">{L.sectionUnassigned}</option>
                    {sections.map((s) => (
                        <option key={s.section} value={s.section}>{s.name}</option>
                    ))}
                </select>
            )}

            {error && (
                <div className="nexusai-error" role="alert">
                    <p className="nexusai-error__text">{error}</p>
                </div>
            )}

            {results && results.total === 0 && (
                <p className="nexusai-search__empty">{L.noResults(lastQuery)}</p>
            )}

            {results && results.results.map((r, i) => {
                const canDownload = !!r.document_id && !!sesskey;
                return (
                    <div
                        key={`${r.document_filename}-${r.chunk_index}-${i}`}
                        className="nexusai-search__result"
                    >
                        {r.document_id && (
                            <button
                                type="button"
                                className="nexusai-search__summarize-btn"
                                onClick={() => handleSummarize(r.document_id)}
                                disabled={summaries[r.document_id]?.loading}
                            >
                                {summaries[r.document_id]?.loading
                                    ? "..."
                                    : summaries[r.document_id]?.text && summaries[r.document_id]?.visible
                                        ? L.hideSummary
                                        : L.summarize}
                            </button>
                        )}
                        <div className="nexusai-search__result-header">
                            <span className="nexusai-search__filename">
                                <FileIcon filename={r.document_filename} />
                                {r.document_filename}
                            </span>
                            <div className="nexusai-search__result-actions">
                                {r.mime_type && MATERIAL_TYPE_LABELS[r.mime_type] && (
                                    <span className="nexusai-search__type-badge">
                                        {MATERIAL_TYPE_LABELS[r.mime_type][lang === "es" ? "es" : "en"]}
                                    </span>
                                )}
                                {canDownload && (
                                    <button
                                        type="button"
                                        className="nexusai-search__open-btn"
                                        onClick={() => openDownload(r.document_filename, r.course_id)}
                                    >
                                        {L.openFile}
                                    </button>
                                )}
                            </div>
                        </div>
                        {effectiveGlobal && r.course_name && (
                            <p className="nexusai-search__course">{r.course_name}</p>
                        )}
                        <p className="nexusai-search__content">{highlightContent(r.content, lastQuery)}</p>
                        {r.document_id && summaries[r.document_id]?.visible && (
                            <div className="nexusai-search__summary">
                                <p className="nexusai-search__summary-label">{L.summaryLabel}</p>
                                {summaries[r.document_id].loading && (
                                    <p className="nexusai-search__summary-text nexusai-search__summary-text--loading">...</p>
                                )}
                                {summaries[r.document_id].error && (
                                    <p className="nexusai-search__summary-text nexusai-search__summary-text--error">
                                        {summaries[r.document_id].error}
                                    </p>
                                )}
                                {summaries[r.document_id].text && (
                                    <p className="nexusai-search__summary-text">{summaries[r.document_id].text}</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
