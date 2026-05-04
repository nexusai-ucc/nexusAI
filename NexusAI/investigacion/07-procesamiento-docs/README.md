# 07 — Procesamiento de documentos

Extracción de texto de los materiales del curso (PDFs, DOCX, TXT), limpieza,
chunking en fragmentos manejables y preparación para que el `EmbeddingProvider`
los vectorice e inserte en pgvector.

## Por qué esta etapa importa

El RAG funciona o falla en la calidad de los chunks. Si extraemos mal el texto
(headers/footers repetidos, tablas pegadas como soga de caracteres, ecuaciones
LaTeX rotas) o cortamos en lugares estúpidos (mitad de oración, mitad de tabla),
el retrieval va a traer ruido y el LLM va a alucinar o responder mal. Es la
parte menos glamorosa del pipeline pero la que más impacta el resultado final.

## Pipeline acordado

```
PDF/DOCX/TXT  →  Extracción texto  →  Limpieza  →  Chunking  →  Embedding  →  pgvector
                  (pdfplumber)        (regex)      (~500 tok      (text-      (ADR-002)
                                                    + 10% over)    embedding-
                                                                   004 / 3-small)
```

Cada bloque vive en una función pura testeable. La orquestación es un job
async que corre cuando un docente sube un PDF nuevo o pide re-indexar:
`app/documents/indexer.py` (TODO Sprint 2).

## Archivos

- [pdfplumber-chunking.md](pdfplumber-chunking.md) — pdfplumber vs alternativas (PyPDF2, pdfminer, unstructured), estrategia de chunking de ~500 tokens con 10% de overlap, manejo de tablas, headers y elementos repetidos.

## Decisiones tomadas

- **`pdfplumber`** como extractor por defecto — balance entre fidelidad de tablas y velocidad. Las alternativas más pesadas (`unstructured`, `marker`) requieren modelos ML adicionales que en el MVP no justifican el costo.
- **Chunks de ~500 tokens con 10% de overlap** — los chunks chicos mejoran la precisión del retrieval pero pierden contexto; el overlap mitiga el corte abrupto de oraciones.
- **Indexación offline (no en la request)** — cuando un docente sube un PDF, se enqueua un job y se le devuelve "indexando" inmediatamente. La consulta del alumno NO espera a que se procesen los PDFs.
- **Re-indexación incremental por hash** — cuando el docente toca el mismo PDF, comparamos hash y solo re-procesamos si cambió.

## Objetivo de la fase de investigación

Validar que `pdfplumber` cubre los casos típicos de material académico
(apuntes, guías de estudio, papers, slides exportados a PDF) y dejar
documentado el pipeline de preprocesamiento para que el indexer del
Sprint 2 sea solo implementar las decisiones ya tomadas.

## Pendiente (post-MVP)

- Soporte para DOCX nativo (no solo via conversión a PDF previa).
- Soporte para imágenes con OCR (Tesseract o equivalente) — material escaneado.
- Re-ranking por relevancia tras el retrieval inicial — mejorar precisión sin re-indexar.
- Análisis de calidad por chunk (descartar chunks con > N% caracteres no alfanuméricos, headers de página repetidos detectados, etc.).

## Referencias cruzadas

- [`02-rag/chunking-strategies.md`](../02-rag/chunking-strategies.md) — fundamento teórico del chunking.
- [`03-openai/embeddings.md`](../03-openai/embeddings.md) — modelo y dimensiones de los vectores.
- [`docs/adr/002-pgvector.md`](../../docs/adr/002-pgvector.md) — destino de los vectores.

---

*Última actualización: 2026-05-04 — Delfina Salinas*
