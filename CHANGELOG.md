# Changelog — NexusAI

Todos los cambios notables del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Versionado siguiendo [Semantic Versioning](https://semver.org/lang/es/).

---

## [v0.11.0] — 2026-07-28 — Post-MVP Sprint C

### Agregado
- feat(analytics): logging de interacciones anonimizadas para dashboard docente — DOC-D01 — cierra #232
- feat(analytics): dashboard de preguntas frecuentes agrupadas por tema — DOC-D02 — cierra #233
- feat(quiz): tipo de pregunta flashcard con nivel de dificultad — cierra #269
- feat(search): filtro de búsqueda por tipo de material — BUS-02 — cierra #271
- feat(calendar): vista de calendario del curso — CAL-01 — cierra #237
- feat(widget): reemplazar tira de pestañas por menú de navegación + unificar Modo Estudio — UX-01 — cierra #277
- feat(widget): mover disparador del FAB flotante a la navbar de Moodle — UX-02 — cierra #281
- feat(docentes): generador de examen docente con export en formato GIFT — cierra #235
- feat(search): filtro de búsqueda por unidad/sección del curso — BUS-05 — cierra #272
- feat(study): plan de estudio personalizado — Modo Estudio abre proactivo — cierra #285

---

## [v0.10.0] — 2026-07-12 — Post-MVP Sprint B

### Agregado
- feat(foros): tabla `forum_post_embeddings`, router y endpoints de similitud — F-01/F-02/F-03 — épica 06
- feat(foros): observer PHP para indexado automático de posts al crear/editar/eliminar — F-06 — épica 06
- feat(foros): detector de posts similares al escribir una nueva discusión — F-07/F-08/F-09 — épica 06
- feat(foros): endpoint `summarize-thread` con resumen generado por LLM — F-04 — épica 06
- feat(foros): endpoint `suggest-reply` y botón de sugerencia IA en páginas de discusión — F-05/F-10/F-11 — épica 06
- feat(quiz): preguntas de verdadero/falso, preguntas abiertas y tab Repaso — SP-03/SP-05/SP-10

### Corregido
- fix(rag): corregir truncado de contexto que cortaba documentos estructurados
- fix(plugin): agregar observer `discussion_created` para compatibilidad con Moodle 5.x

---

## [v0.9.0] — 2026-06-23 — Post-MVP Sprint A

### Agregado
- feat(documents): soporte de formatos PPTX, XLSX, CSV, Markdown y HTML como material de curso
- feat(documents): fallback OCR con Tesseract para PDFs escaneados y slides PPTX sin texto seleccionable
- feat(documents): confirmación obligatoria del docente antes de indexar materiales subidos
- feat(quiz): soporte multi-curso en generación de quiz, campo `has_file` en resultados de búsqueda
- feat(search): mejoras en búsqueda híbrida (semántica + full-text)

### Corregido
- fix(scripts): aplicar migraciones Alembic automáticamente al levantar el stack de desarrollo

---

## [v0.8.0-mvp] — 2026-06-01 — MVP Sprint 4

### Agregado
- feat(chat): asistente RAG con respuestas citadas sobre el material real del curso
- feat(chat): streaming de respuestas vía Server-Sent Events (SSE) en tiempo real
- feat(chat): citas clicables con preview del fragmento fuente en las respuestas
- feat(chat): historial de sesiones de chat con listado y recuperación de mensajes
- feat(chat): soporte multi-curso — el asistente responde sobre varios cursos del alumno
- feat(quiz): generador de preguntas de opción múltiple sobre el contenido del curso
- feat(docentes): gap detection — detección automática de preguntas sin respuesta en el material
- feat(widget): UI rediseñada con design tokens de shadcn/ui, estilos responsive mejorados
- feat(search): búsqueda semántica sobre el material del curso con filtro por curso
- feat(deploy): pipeline de deploy automático a Fly.io vía GitHub Actions
