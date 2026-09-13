/**
 * HelpPanel — pestaña "Ayuda" de NexusAI Materiales (ONB-07 / #430).
 *
 * Explica qué es y para qué sirve cada una de las 5 herramientas del panel
 * docente. Copy transcripto de `AYUDA_DOCENTE_ONBOARDING.md` sección 5
 * (ONB-08 / #431) — traducción directa al inglés, el doc fuente solo tiene
 * español.
 *
 * Contenido 100% estático, sin llamadas a la API.
 */

const T = {
    es: {
        intro: "Guía rápida de las herramientas de NexusAI en este curso.",
        cards: [
            {
                title: "Material",
                body: "Acá subís y gestionás los archivos que alimentan al asistente. Cada archivo pasa por un proceso de indexado (lo ves como “procesando” → “indexado”). Una vez indexado, el asistente puede citarlo en sus respuestas. Podés reemplazar un archivo manteniendo su historial.",
            },
            {
                title: "Preguntas de alumnos (Gaps + FAQ)",
                body: "Gaps detectados: temas sobre los que tus alumnos preguntan mucho y el material no cubre bien — te señala dónde reforzar. FAQ: las preguntas más frecuentes agrupadas por tema, para que veas qué les cuesta sin leer cada conversación.",
            },
            {
                title: "Analytics",
                body: "Uso del asistente en tu curso: cuántas consultas, en qué unidades se concentran, evolución en el tiempo. Sirve para ver qué temas generan más dudas.",
            },
            {
                title: "Generar examen",
                body: "Crea un borrador de examen (múltiple choice, V/F, desarrollo) a partir del material indexado. Exportable en formato GIFT para importar a Moodle. Siempre revisá y editá las preguntas antes de usarlas.",
            },
            {
                title: "Buscar",
                body: "Búsqueda semántica sobre todo el material del curso: encontrás dónde se explica un concepto aunque no sepas el nombre exacto del archivo.",
            },
        ],
    },
    en: {
        intro: "Quick guide to the NexusAI tools in this course.",
        cards: [
            {
                title: "Material",
                body: "This is where you upload and manage the files that feed the assistant. Each file goes through an indexing process (you'll see “processing” → “indexed”). Once indexed, the assistant can cite it in its answers. You can replace a file while keeping its history.",
            },
            {
                title: "Student questions (Gaps + FAQ)",
                body: "Detected gaps: topics your students ask about a lot that the material doesn't cover well — flags where to reinforce. FAQ: the most frequent questions grouped by topic, so you can see what's tripping students up without reading every conversation.",
            },
            {
                title: "Analytics",
                body: "Assistant usage in your course: how many queries, which units they concentrate on, evolution over time. Useful for seeing which topics generate the most doubts.",
            },
            {
                title: "Generate exam",
                body: "Creates a draft exam (multiple choice, true/false, open-ended) from the indexed material. Exportable as GIFT to import into Moodle. Always review and edit the questions before using them.",
            },
            {
                title: "Search",
                body: "Semantic search across all the course material: find where a concept is explained even if you don't know the exact file name.",
            },
        ],
    },
};

export default function HelpPanel({ lang = "es" }) {
    const t = T[lang] || T.es;

    return (
        <>
            <p className="nexusai-documents__intro">{t.intro}</p>

            <div className="nexusai-doc-card nexusai-help">
                {t.cards.map(({ title, body }) => (
                    <div key={title} className="nexusai-help__card">
                        <h3 className="nexusai-documents__heading nexusai-help__card-title">{title}</h3>
                        <p className="nexusai-help__card-body">{body}</p>
                    </div>
                ))}
            </div>
        </>
    );
}
