/**
 * ExamGeneratorPanel — generador de exámenes para el docente (EVAL-02, issue #235 / DOC-D04).
 *
 * El docente elige archivos del curso + tipo de pregunta + dificultad + cantidad,
 * genera un banco de preguntas con el mismo motor que el quiz de práctica del
 * alumno (services/api/app/quiz/router.py::generate-exam), lo previsualiza con
 * edición inline, y lo exporta como .txt en formato GIFT para importar al
 * banco de preguntas de Moodle.
 *
 * Estados: "setup" (elegir archivos + config) → "loading" → "preview" (editable) → "error".
 */

import { useEffect, useState } from "react";
import { listDocuments, listGaps, getFaqTopics } from "./api.js";
import { generateExam } from "../api/quiz.js";
import { downloadGiftFile } from "./gift.js";
import { IconClipboardList, IconDownload, IconFileText } from "../components/icons.jsx";
import { getFriendlyErrorMessage } from "../components/errors.js";

// DOC-D09 (#390): cuántos temas con dificultad detectada se ofrecen como
// máximo (combinados entre Gaps y FAQ) — coincide con el tope que acepta
// el backend (ExamGenerateRequest.focus_topics, max_length=15).
const MAX_FOCUS_TOPICS = 15;

/**
 * Trae temas con dificultad detectada desde Gaps (preguntas sin responder,
 * DOC-D06) y FAQ agrupada (analytics), los combina y ordena por frecuencia.
 * Gaps archivados quedan excluidos por default en listGaps (DOC-D08).
 */
async function fetchFocusTopicCandidates(courseId) {
    const [gapsRes, faqRes] = await Promise.all([
        listGaps(courseId, 30, 30, false, 0).catch(() => ({ items: [] })),
        getFaqTopics(courseId, 30).catch(() => ({ topics: [] })),
    ]);

    const fromGaps = (gapsRes?.items || []).map((g) => ({
        label: g.question,
        source: "gap",
        count: g.count,
    }));
    const fromFaq = (faqRes?.topics || []).map((t) => ({
        label: t.topic,
        source: "faq",
        count: t.count,
    }));

    const seen = new Set();
    const merged = [];
    for (const item of [...fromGaps, ...fromFaq]) {
        const key = item.label.trim().toLowerCase();
        if (!item.label.trim() || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
    }
    merged.sort((a, b) => b.count - a.count);
    return merged.slice(0, MAX_FOCUS_TOPICS);
}

function questionTypes(lang) {
    return lang === "es" ? [
        { value: "multiple_choice", label: "Opción múltiple" },
        { value: "true_false", label: "Verdadero / Falso" },
        { value: "open", label: "Preguntas abiertas" },
        { value: "mix", label: "Mixto" },
    ] : [
        { value: "multiple_choice", label: "Multiple choice" },
        { value: "true_false", label: "True / False" },
        { value: "open", label: "Open questions" },
        { value: "mix", label: "Mixed" },
    ];
}

function difficulties(lang) {
    return lang === "es" ? [
        { value: "easy", label: "Fácil" },
        { value: "medium", label: "Media" },
        { value: "hard", label: "Difícil" },
    ] : [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
    ];
}

export default function ExamGeneratorPanel({ courseId, lang = "es" }) {
    const [stage, setStage] = useState("setup"); // setup | loading | preview | error
    const [wizardStep, setWizardStep] = useState("files"); // files | configure (solo dentro de stage "setup")
    const [documents, setDocuments] = useState([]);
    const [docsLoading, setDocsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [topic, setTopic] = useState("");
    const [questionType, setQuestionType] = useState("multiple_choice");
    const [difficulty, setDifficulty] = useState("medium");
    const [numQuestions, setNumQuestions] = useState(10);
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState(null);

    // DOC-D09 (#390): "incluir temas con dificultad detectada" (Gaps/FAQ).
    const [includeFocusTopics, setIncludeFocusTopics] = useState(false);
    const [focusTopics, setFocusTopics] = useState([]); // candidatos {label, source, count}
    const [focusTopicsLoading, setFocusTopicsLoading] = useState(false);
    const [focusTopicsLoaded, setFocusTopicsLoaded] = useState(false);
    const [selectedFocusTopics, setSelectedFocusTopics] = useState({}); // key(label+source) -> bool

    const L = lang === "es" ? {
        intro:            "Elegí de qué archivos del curso querés generar preguntas de examen. El banco generado se puede editar acá mismo y exportar como .txt en formato GIFT para importarlo directamente al banco de preguntas de Moodle.",
        stepFiles:        "Archivos",
        stepConfigure:    "Configurar",
        chooseFiles:      (n) => `Elegí los archivos (${n} seleccionados)`,
        loadingMaterial:  "Cargando material del curso...",
        noMaterialTitle:  "Todavía no hay material indexado en este curso.",
        noMaterialSub:    "Subí archivos en la tab \"Material\" antes de generar un examen.",
        next:             "Siguiente",
        configureTitle:   "Configurá el examen",
        topicLabel:       "Tema (opcional)",
        topicPlaceholder: "Ej: derivadas, unidad 3...",
        questionTypeLabel:"Tipo de pregunta",
        difficultyLabel:  "Dificultad",
        numQuestionsLabel:"Cantidad de preguntas",
        includeFocus:     "Incluir temas con dificultad detectada (Gaps y preguntas frecuentes)",
        searchingFocus:   "Buscando temas con dificultad detectada...",
        noFocusTopics:    "No hay suficientes preguntas de alumnos (Gaps o FAQ) todavía para sugerir temas.",
        back:             "Atrás",
        generate:         "Generar examen",
        loadingExam:      "Generando preguntas de examen...",
        goBack:           "Volver",
        bankGenerated:    (n) => `Banco generado (${n} preguntas)`,
        backToConfigure:  "Volver a configurar",
        exportGift:       "Exportar como GIFT (Moodle)",
        removeQuestion:   "Eliminar pregunta",
        explanationPlaceholder: "Explicación / respuesta modelo",
        source:           (name) => `Fuente: ${name}`,
        sourceTopic:      (topic) => `Tema con dificultad detectada: ${topic}`,
        genericError:     "No se pudo generar el examen. Intentá de nuevo.",
    } : {
        intro:            "Choose which course files you want to generate exam questions from. You can edit the generated bank right here and export it as a .txt in GIFT format to import directly into Moodle's question bank.",
        stepFiles:        "Files",
        stepConfigure:    "Configure",
        chooseFiles:      (n) => `Choose the files (${n} selected)`,
        loadingMaterial:  "Loading course material...",
        noMaterialTitle:  "There's no indexed material in this course yet.",
        noMaterialSub:    "Upload files in the \"Material\" tab before generating an exam.",
        next:             "Next",
        configureTitle:   "Configure the exam",
        topicLabel:       "Topic (optional)",
        topicPlaceholder: "E.g.: derivatives, unit 3...",
        questionTypeLabel:"Question type",
        difficultyLabel:  "Difficulty",
        numQuestionsLabel:"Number of questions",
        includeFocus:     "Include topics with detected difficulty (Gaps and frequently asked questions)",
        searchingFocus:   "Looking for topics with detected difficulty...",
        noFocusTopics:    "There aren't enough student questions (Gaps or FAQ) yet to suggest topics.",
        back:             "Back",
        generate:         "Generate exam",
        loadingExam:      "Generating exam questions...",
        goBack:           "Go back",
        bankGenerated:    (n) => `Bank generated (${n} questions)`,
        backToConfigure:  "Back to configuration",
        exportGift:       "Export as GIFT (Moodle)",
        removeQuestion:   "Remove question",
        explanationPlaceholder: "Explanation / model answer",
        source:           (name) => `Source: ${name}`,
        sourceTopic:      (topic) => `Topic with detected difficulty: ${topic}`,
        genericError:     "Couldn't generate the exam. Try again.",
    };

    useEffect(() => {
        let cancelled = false;
        listDocuments(courseId)
            .then((data) => {
                if (!cancelled) {
                    // UX-17 (#387): sin limit, listDocuments trae todos los
                    // documentos del curso (hasta el tope interno del backend)
                    // — necesario acá para poder elegir de cualquiera.
                    setDocuments((data?.items || []).filter((d) => d.status === "indexed"));
                    setDocsLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) setDocsLoading(false);
            });
        return () => { cancelled = true; };
    }, [courseId]);

    const toggleDoc = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const focusTopicKey = (t) => `${t.source}:${t.label}`;

    const toggleIncludeFocusTopics = (checked) => {
        setIncludeFocusTopics(checked);
        if (checked && !focusTopicsLoaded) {
            setFocusTopicsLoading(true);
            fetchFocusTopicCandidates(courseId)
                .then((topics) => {
                    setFocusTopics(topics);
                    // Todos preseleccionados — el docente puede destildar los que no quiera.
                    setSelectedFocusTopics(
                        Object.fromEntries(topics.map((t) => [focusTopicKey(t), true]))
                    );
                })
                .finally(() => {
                    setFocusTopicsLoading(false);
                    setFocusTopicsLoaded(true);
                });
        }
    };

    const toggleFocusTopic = (t) => {
        const key = focusTopicKey(t);
        setSelectedFocusTopics((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGenerate = async () => {
        if (!selectedIds.length) return;
        setStage("loading");
        setError(null);
        try {
            const chosenFocusTopics = includeFocusTopics
                ? focusTopics
                    .filter((t) => selectedFocusTopics[focusTopicKey(t)])
                    .map((t) => ({ label: t.label, source: t.source }))
                : [];
            const result = await generateExam({
                courseId,
                documentIds: selectedIds,
                topic: topic.trim(),
                numQuestions,
                questionType,
                difficulty,
                focusTopics: chosenFocusTopics,
            });
            setQuestions(result.questions || []);
            setStage("preview");
        } catch (err) {
            setError(getFriendlyErrorMessage(err, L.genericError, lang));
            setStage("error");
        }
    };

    const updateQuestion = (index, field, value) => {
        setQuestions((prev) =>
            prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
        );
    };

    const updateOption = (qIndex, optIndex, value) => {
        setQuestions((prev) =>
            prev.map((q, i) => {
                if (i !== qIndex) return q;
                const options = [...q.options];
                options[optIndex] = value;
                return { ...q, options };
            })
        );
    };

    const removeQuestion = (index) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleExport = () => {
        downloadGiftFile(questions, `examen-nexusai-curso-${courseId}.txt`);
    };

    const handleReset = () => {
        setStage("setup");
        setWizardStep("files");
        setQuestions([]);
        setError(null);
    };

    return (
        <div className="nexusai-exam">
            <p className="nexusai-documents__intro">
                {L.intro}
            </p>

            {stage === "setup" && (
                <div className="nexusai-exam__setup nexusai-doc-card">
                    <div className="nexusai-exam__steps">
                        <span className={`nexusai-exam__step ${wizardStep === "files" ? "nexusai-exam__step--active" : ""}`}>
                            <span className="nexusai-exam__step-num">1</span>
                            {L.stepFiles}
                        </span>
                        <span className="nexusai-exam__step-arrow">→</span>
                        <span className={`nexusai-exam__step ${wizardStep === "configure" ? "nexusai-exam__step--active" : ""}`}>
                            <span className="nexusai-exam__step-num">2</span>
                            {L.stepConfigure}
                        </span>
                    </div>

                    {wizardStep === "files" ? (
                        <>
                            <h3 className="nexusai-documents__heading">
                                {L.chooseFiles(selectedIds.length)}
                            </h3>

                            {docsLoading ? (
                                <div className="nexusai-loading">{L.loadingMaterial}</div>
                            ) : documents.length === 0 ? (
                                <div className="nexusai-gaps__empty">
                                    <p className="nexusai-gaps__empty-title">
                                        {L.noMaterialTitle}
                                    </p>
                                    <p className="nexusai-gaps__empty-sub">
                                        {L.noMaterialSub}
                                    </p>
                                </div>
                            ) : (
                                <ul className="nexusai-exam__doclist">
                                    {documents.map((doc) => (
                                        <li key={doc.id} className="nexusai-exam__docitem">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(doc.id)}
                                                    onChange={() => toggleDoc(doc.id)}
                                                />
                                                <IconFileText size={14} />
                                                <span>{doc.filename}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <button
                                type="button"
                                className="nexusai-btn nexusai-btn--primary"
                                disabled={!selectedIds.length}
                                onClick={() => setWizardStep("configure")}
                            >
                                {L.next}
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="nexusai-documents__heading">{L.configureTitle}</h3>
                            <div className="nexusai-exam__form">
                                <label className="nexusai-exam__field">
                                    {L.topicLabel}
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder={L.topicPlaceholder}
                                        maxLength={200}
                                    />
                                </label>

                                <label className="nexusai-exam__field">
                                    {L.questionTypeLabel}
                                    <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                                        {questionTypes(lang).map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="nexusai-exam__field">
                                    {L.difficultyLabel}
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                        {difficulties(lang).map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="nexusai-exam__field">
                                    {L.numQuestionsLabel}
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                                    />
                                </label>
                            </div>

                            <div className="nexusai-exam__focus">
                                <label className="nexusai-exam__focus-toggle">
                                    <input
                                        type="checkbox"
                                        checked={includeFocusTopics}
                                        onChange={(e) => toggleIncludeFocusTopics(e.target.checked)}
                                    />
                                    {L.includeFocus}
                                </label>

                                {includeFocusTopics && focusTopicsLoading && (
                                    <div className="nexusai-loading">{L.searchingFocus}</div>
                                )}

                                {includeFocusTopics && !focusTopicsLoading && focusTopicsLoaded && focusTopics.length === 0 && (
                                    <p className="nexusai-exam__focus-empty">
                                        {L.noFocusTopics}
                                    </p>
                                )}

                                {includeFocusTopics && !focusTopicsLoading && focusTopics.length > 0 && (
                                    <ul className="nexusai-exam__doclist nexusai-exam__focus-list">
                                        {focusTopics.map((t) => (
                                            <li key={focusTopicKey(t)} className="nexusai-exam__docitem">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selectedFocusTopics[focusTopicKey(t)]}
                                                        onChange={() => toggleFocusTopic(t)}
                                                    />
                                                    <span className={`nexusai-exam__focus-badge nexusai-exam__focus-badge--${t.source}`}>
                                                        {t.source === "gap" ? "Gap" : "FAQ"}
                                                    </span>
                                                    <span>{t.label}</span>
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="nexusai-exam__wizard-actions">
                                <button
                                    type="button"
                                    className="nexusai-btn"
                                    onClick={() => setWizardStep("files")}
                                >
                                    {L.back}
                                </button>
                                <button
                                    type="button"
                                    className="nexusai-btn nexusai-btn--primary"
                                    disabled={!selectedIds.length}
                                    onClick={handleGenerate}
                                >
                                    <IconClipboardList size={15} />
                                    {L.generate}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {stage === "loading" && (
                <div className="nexusai-loading">{L.loadingExam}</div>
            )}

            {stage === "error" && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="nexusai-btn" onClick={handleReset}>{L.goBack}</button>
                </div>
            )}

            {stage === "preview" && (
                <div className="nexusai-exam__preview">
                    <div className="nexusai-exam__preview-header">
                        <h3 className="nexusai-documents__heading">
                            {L.bankGenerated(questions.length)}
                        </h3>
                        <div className="nexusai-exam__preview-actions">
                            <button type="button" className="nexusai-btn" onClick={handleReset}>
                                {L.backToConfigure}
                            </button>
                            <button
                                type="button"
                                className="nexusai-btn nexusai-btn--primary"
                                disabled={!questions.length}
                                onClick={handleExport}
                            >
                                <IconDownload size={15} />
                                {L.exportGift}
                            </button>
                        </div>
                    </div>

                    {questions.map((q, i) => (
                        <div key={i} className="nexusai-exam__question">
                            <div className="nexusai-exam__question-head">
                                <span className="nexusai-exam__question-number">#{i + 1} · {q.question_type}</span>
                                <button
                                    type="button"
                                    className="nexusai-exam__remove"
                                    onClick={() => removeQuestion(i)}
                                    aria-label={L.removeQuestion}
                                >
                                    ×
                                </button>
                            </div>

                            <textarea
                                className="nexusai-exam__question-text"
                                value={q.question}
                                onChange={(e) => updateQuestion(i, "question", e.target.value)}
                                rows={2}
                            />

                            {q.question_type !== "open" && q.options?.length > 0 && (
                                <div className="nexusai-exam__options">
                                    {q.options.map((opt, oi) => (
                                        <label key={oi} className="nexusai-exam__option">
                                            <input
                                                type="radio"
                                                checked={q.correct_index === oi}
                                                onChange={() => updateQuestion(i, "correct_index", oi)}
                                            />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updateOption(i, oi, e.target.value)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            )}

                            <textarea
                                className="nexusai-exam__explanation"
                                value={q.explanation}
                                onChange={(e) => updateQuestion(i, "explanation", e.target.value)}
                                rows={2}
                                placeholder={L.explanationPlaceholder}
                            />

                            {q.source_filename && (
                                <div className="nexusai-exam__source">{L.source(q.source_filename)}</div>
                            )}
                            {q.source_topic && (
                                <div className="nexusai-exam__source nexusai-exam__source--topic">
                                    {L.sourceTopic(q.source_topic)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
