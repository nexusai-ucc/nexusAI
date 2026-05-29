/**
 * SearchPanel — panel de búsqueda semántica en el material del curso.
 *
 * Muestra resultados como cards con: nombre del archivo, fragmento de texto
 * relevante y badge con el score de similitud. No usa LLM ni sesiones.
 */

import { useState } from "react";
import { searchMaterial } from "../api/search.js";
import { IconFile, IconSearch } from "./icons.jsx";

export default function SearchPanel({ courseId, lang = "es" }) {
    const [query, setQuery]     = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const data = await searchMaterial({ query: query.trim(), courseId });
            setResults(data);
        } catch (err) {
            setError(err.message || (lang === "es" ? "Error en la búsqueda" : "Search error"));
        } finally {
            setLoading(false);
        }
    };

    const similarityColor = (s) => {
        if (s >= 0.75) return "#16a34a";
        if (s >= 0.5)  return "#d97706";
        return "#6b7280";
    };

    const labels = lang === "es"
        ? {
            placeholder: "Buscá un tema en el material del curso...",
            button:      "Buscar",
            empty:       "No encontré fragmentos relacionados en el material del curso.",
            relevant:    "relevante",
        }
        : {
            placeholder: "Search in course material...",
            button:      "Search",
            empty:       "No relevant fragments found in the course material.",
            relevant:    "relevant",
        };

    return (
        <div className="nexusai-search">
            <form onSubmit={handleSearch} className="nexusai-search__form">
                <input
                    type="text"
                    className="nexusai-search__input"
                    placeholder={labels.placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                    maxLength={500}
                />
                <button
                    type="submit"
                    className="nexusai-search__btn"
                    disabled={loading || !query.trim()}
                >
                    {loading ? "..." : labels.button}
                </button>
            </form>

            {error && (
                <div className="nexusai-error" role="alert">
                    <p className="nexusai-error__text">{error}</p>
                </div>
            )}

            {results && results.total === 0 && (
                <p className="nexusai-search__empty">{labels.empty}</p>
            )}

            {results && results.results.map((r, i) => (
                <div key={`${r.document_filename}-${r.chunk_index}-${i}`} className="nexusai-search__result">
                    <div className="nexusai-search__result-header">
                        <span className="nexusai-search__filename">
                            <IconFile size={13} />
                            {r.document_filename}
                        </span>
                        <span
                            className="nexusai-search__score"
                            style={{ color: similarityColor(r.similarity) }}
                        >
                            {Math.round(r.similarity * 100)}% {labels.relevant}
                        </span>
                    </div>
                    <p className="nexusai-search__content">{r.content}</p>
                </div>
            ))}
        </div>
    );
}
