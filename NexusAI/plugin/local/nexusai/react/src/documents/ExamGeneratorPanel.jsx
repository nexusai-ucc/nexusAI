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
import { listDocuments } from "./api.js";
import { generateExam } from "../api/quiz.js";
import { downloadGiftFile } from "./gift.js";
import { IconClipboardList, IconDownload, IconFileText } from "../components/icons.jsx";

const QUESTION_TYPES = [
    { value: "multiple_choice", label: "Opción múltiple" },
    { value: "true_false", label: "Verdadero / Falso" },
    { value: "open", label: "Preguntas abiertas" },
    { value: "mix", label: "Mixto" },
];

const DIFFICULTIES = [
    { value: "easy", label: "Fácil" },
    { value: "medium", label: "Media" },
    { value: "hard", label: "Difícil" },
];

export default function ExamGeneratorPanel({ courseId }) {
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

    const handleGenerate = async () => {
        if (!selectedIds.length) return;
        setStage("loading");
        setError(null);
        try {
            const result = await generateExam({
                courseId,
                documentIds: selectedIds,
                topic: topic.trim(),
                numQuestions,
                questionType,
                difficulty,
            });
            setQuestions(result.questions || []);
            setStage("preview");
        } catch (err) {
            setError(err?.message || "No se pudo generar el examen. Intentá de nuevo.");
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
                Elegí de qué archivos del curso querés generar preguntas de examen. El banco
                generado se puede editar acá mismo y exportar como .txt en formato GIFT para
                importarlo directamente al banco de preguntas de Moodle.
            </p>

            {stage === "setup" && (
                <div className="nexusai-exam__setup nexusai-doc-card">
                    <div className="nexusai-exam__steps">
                        <span className={`nexusai-exam__step ${wizardStep === "files" ? "nexusai-exam__step--active" : ""}`}>
                            <span className="nexusai-exam__step-num">1</span>
                            Archivos
                        </span>
                        <span className="nexusai-exam__step-arrow">→</span>
                        <span className={`nexusai-exam__step ${wizardStep === "configure" ? "nexusai-exam__step--active" : ""}`}>
                            <span className="nexusai-exam__step-num">2</span>
                            Configurar
                        </span>
                    </div>

                    {wizardStep === "files" ? (
                        <>
                            <h3 className="nexusai-documents__heading">
                                Elegí los archivos ({selectedIds.length} seleccionados)
                            </h3>

                            {docsLoading ? (
                                <div className="nexusai-loading">Cargando material del curso...</div>
                            ) : documents.length === 0 ? (
                                <div className="nexusai-gaps__empty">
                                    <p className="nexusai-gaps__empty-title">
                                        Todavía no hay material indexado en este curso.
                                    </p>
                                    <p className="nexusai-gaps__empty-sub">
                                        Subí archivos en la tab "Material" antes de generar un examen.
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
                                Siguiente
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="nexusai-documents__heading">Configurá el examen</h3>
                            <div className="nexusai-exam__form">
                                <label className="nexusai-exam__field">
                                    Tema (opcional)
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Ej: derivadas, unidad 3..."
                                        maxLength={200}
                                    />
                                </label>

                                <label className="nexusai-exam__field">
                                    Tipo de pregunta
                                    <select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                                        {QUESTION_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="nexusai-exam__field">
                                    Dificultad
                                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                        {DIFFICULTIES.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="nexusai-exam__field">
                                    Cantidad de preguntas
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                                    />
                                </label>
                            </div>

                            <div className="nexusai-exam__wizard-actions">
                                <button
                                    type="button"
                                    className="nexusai-btn"
                                    onClick={() => setWizardStep("files")}
                                >
                                    Atrás
                                </button>
                                <button
                                    type="button"
                                    className="nexusai-btn nexusai-btn--primary"
                                    disabled={!selectedIds.length}
                                    onClick={handleGenerate}
                                >
                                    <IconClipboardList size={15} />
                                    Generar examen
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {stage === "loading" && (
                <div className="nexusai-loading">Generando preguntas de examen...</div>
            )}

            {stage === "error" && (
                <div className="nexusai-alert nexusai-alert--error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="nexusai-btn" onClick={handleReset}>Volver</button>
                </div>
            )}

            {stage === "preview" && (
                <div className="nexusai-exam__preview">
                    <div className="nexusai-exam__preview-header">
                        <h3 className="nexusai-documents__heading">
                            Banco generado ({questions.length} preguntas)
                        </h3>
                        <div className="nexusai-exam__preview-actions">
                            <button type="button" className="nexusai-btn" onClick={handleReset}>
                                Volver a configurar
                            </button>
                            <button
                                type="button"
                                className="nexusai-btn nexusai-btn--primary"
                                disabled={!questions.length}
                                onClick={handleExport}
                            >
                                <IconDownload size={15} />
                                Exportar como GIFT (Moodle)
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
                                    aria-label="Eliminar pregunta"
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
                                placeholder="Explicación / respuesta modelo"
                            />

                            {q.source_filename && (
                                <div className="nexusai-exam__source">Fuente: {q.source_filename}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
