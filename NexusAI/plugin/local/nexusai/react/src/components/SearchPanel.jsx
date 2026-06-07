/**
 * SearchPanel — búsqueda híbrida en material del curso (Feature A).
 *
 * Cuando isTeacher=true (documentos page) el toggle de modo global no aparece:
 * el docente siempre busca en su propio curso.
 * Cuando isTeacher=false (uso futuro desde vista alumno) el toggle permite
 * cambiar entre "este curso" y "todos mis cursos".
 */

import { useState } from "react";
import { searchMaterial } from "../api/search.js";
import { IconBookOpen, IconFile, IconFileText, IconGlobe } from "./icons.jsx";

function FileIcon({ filename }) {
    const ext = (filename || "").split(".").pop().toLowerCase();
    if (ext === "txt") return <IconFileText size={14} />;
    return <IconFile size={14} />;
}

export default function SearchPanel({
    courseId,
    sesskey,
    isTeacher = false,
    lang = "es",
}) {
    const [query, setQuery]           = useState("");
    const [results, setResults]       = useState(null);
    const [lastQuery, setLastQuery]   = useState("");
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState(null);
    const [globalMode, setGlobalMode] = useState(false);

    const L = lang === "es" ? {
        placeholder:  "Buscá en el material del curso...",
        button:       "Buscar",
        scopeCourse:  "Este curso",
        scopeGlobal:  "Todos mis cursos",
        noResults:    (q) => `No se encontraron resultados para "${q}".`,
        error:        "No se pudo realizar la búsqueda. Intentá de nuevo.",
        download:     "Descargar archivo original",
    } : {
        placeholder:  "Search in course material...",
        button:       "Search",
        scopeCourse:  "This course",
        scopeGlobal:  "All my courses",
        noResults:    (q) => `No results found for "${q}".`,
        error:        "Search failed. Please try again.",
        download:     "Download original file",
    };

    const performSearch = async (q) => {
        setLoading(true);
        setError(null);
        setLastQuery(q);
        try {
            const data = await searchMaterial({ query: q, courseId, global: globalMode });
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

    const openDownload = (documentId, resultCourseId) => {
        if (!documentId || !sesskey) return;
        const params = new URLSearchParams({
            document_id: documentId,
            courseid: String(resultCourseId || courseId || ""),
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

            {!isTeacher && (
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
                        <div className="nexusai-search__result-header">
                            {canDownload ? (
                                <button
                                    type="button"
                                    className="nexusai-search__filename nexusai-search__filename--btn"
                                    onClick={() => openDownload(r.document_id, r.course_id)}
                                    title={L.download}
                                >
                                    <FileIcon filename={r.document_filename} />
                                    {r.document_filename}
                                </button>
                            ) : (
                                <span className="nexusai-search__filename">
                                    <FileIcon filename={r.document_filename} />
                                    {r.document_filename}
                                </span>
                            )}
                        </div>
                        {globalMode && r.course_name && (
                            <p className="nexusai-search__course">{r.course_name}</p>
                        )}
                        <p className="nexusai-search__content">{r.content}</p>
                    </div>
                );
            })}
        </div>
    );
}
