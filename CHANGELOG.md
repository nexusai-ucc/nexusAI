# Changelog — NexusAI

Todos los cambios notables del proyecto se documentan en este archivo.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Versionado siguiendo [Semantic Versioning](https://semver.org/lang/es/).

---

## [v0.17.8] — 2026-09-08 — Post-MVP Sprint G (cierre) + backlog chico

### Agregado
- feat(chat): entrada de voz — botón de micrófono en el composer, graba con MediaRecorder y transcribe con Groq Whisper; el texto se muestra para confirmar/editar antes de enviar, nunca se envía directo — VOICE-01 — cierra #314
- feat(study): exportar un quiz de práctica a PDF (imprimible, sin revelar respuestas) — SP-17 — cierra #363
- feat(analytics): reemplazar las barras CSS de Analytics por un componente con tooltip real (hover + foco) y scroll horizontal para muchos días — ANALYTICS-04 — cierra #371
- feat(analytics): exportar el reporte de Analytics a PDF, respetando el filtro de fecha activo — ANALYTICS-03 — cierra #316
- feat(calendar): vista de mes en grilla dentro del widget de calendario — CAL-05 — cierra #364
- feat(calendar): exportar el calendario del curso a `.ics` — CAL-06 — cierra #365
- feat(foros): detección de urgencia/frustración en posts del foro (heurística sin LLM) — FOR-05 — cierra #366
- feat(foros): resumen semanal de actividad del foro para el docente (digest) — FOR-06 — cierra #367
- feat(foros): notificar el digest semanal a un webhook externo (Slack/Discord/Teams) — FOR-07 — cierra #378
- feat(buscador): historial de búsquedas recientes — BUS-06 — cierra #361
- feat(buscador): mejor estado vacío cuando la búsqueda no encuentra nada — BUS-07 — cierra #362
- feat(docentes): acciones en lote sobre documentos (selección múltiple, borrado/reindexado) — CONT-09 — cierra #358
- feat(study): racha de estudio / gamificación liviana — SP-16 — cierra #354
- feat(widget): modo oscuro en todo el widget — UX-11 — cierra #369
- feat(widget): skeletons de carga en vez de spinners genéricos — UX-12 — cierra #370
- feat(widget): pasada de accesibilidad (tamaño de fuente, alto contraste, reducir animaciones) — UX-10 — cierra #368
- feat(chat): contador de caracteres cerca del límite del input — ASIST-05 — cierra #375
- feat(ci): mover `moodle-ci.yml`/`frontend-ci.yml`/`backend-ci.yml` a la raíz real del repo git — nunca corrían — PUB-01 — refs #309
- docs: LICENSE del plugin (GPL v3) + aclarar licenciamiento dual por subárbol, reescribir README del plugin como landing pública — PUB-01 — refs #309

---

## [v0.17.0]–[v0.17.4] — 2026-09-01 a 2026-09-07 — Onboarding + Study Planner + Calendario genérico

### Agregado
- feat(onboarding): external function de estado de setup del curso — ONB-02 — cierra #425
- feat(onboarding): tutorial paso a paso al crear un curso nuevo — ONB-03 — cierra #426
- feat(onboarding): modo revisión al editar un curso existente — ONB-04 — cierra #427
- feat(onboarding): persistir dismissal/"no aplica" + acceso permanente al tutorial — ONB-05/06 — cierra #428, #429
- feat(onboarding): pestaña Ayuda en NexusAI Materiales — ONB-07/08 — cierra #430, #431
- feat(docentes): reemplazar documento manteniendo su id — CONT-07 — cierra #356
- feat(study): descartar un tema del plan de estudio sin borrar todo el historial — SP-13 — cierra #323
- feat(docentes): subir varios archivos de material a la vez — CONT-06 — cierra #320
- feat(study): dificultad sugerida en el quiz de práctica según historial de aciertos — SP-12 — cierra #322
- feat(calendar): mostrar eventos genéricos del curso, no solo entregas/exámenes — CAL-04 — cierra #319
- feat(study): repetición espaciada (spaced repetition) para flashcards — SP-11 — cierra #315
- feat(chat): feedback 👍/👎 del alumno sobre la calidad de las respuestas — ASIST-01 — cierra #321

---

## [v0.15.0] — 2026-08-29 — Preview de documentos + feed de calendario

### Agregado
- feat(docentes): preview del texto extraído de un documento en la vista docente — CONT-08 — cierra #357
- feat(calendar): feed `.ics` suscribible del calendario del curso — CAL-07 — cierra #377

---

## [v0.14.2] — 2026-08-17 — Post-MVP Sprint C (cierre) + Rediseño de interfaz

### Agregado
- feat(docentes): archivar preguntas sin respuesta en Gaps detectados — DOC-D08 — cierra #383
- feat(exam): generar preguntas de examen desde temas con más dificultad (Gaps/FAQ) — DOC-D09 — cierra #390
- feat(calendar): alertas configurables por el alumno — CAL-02 — cierra #238
- feat(docentes): exportación al sistema de cuestionarios nativo de Moodle — DOC-D05 — cierra #236
- feat(docentes): detección de lagunas de contenido — DOC-D03 — cierra #234
- feat(study): resumen pre-parcial por fecha de examen — BUS-04 — cierra #231
- feat(widget): rediseño de interfaz — chat pasa de dropdown flotante a panel lateral acoplado — RDS-01/02 — cierra #400, #401
- feat(docentes): nav lateral + restyle completo del panel docente (Material/Analytics/Gaps/FAQ/Generar examen/Buscar) en lenguaje visual tipo dashboard — RDS-05/06/07 — cierra #404, #405, #406
- feat(docentes): unificar Gaps + FAQ en un solo panel — RDS-08 — cierra #416

### Corregido
- fix(mobile): aumentar área táctil de los botones de ícono del widget — UX-04 — cierra #325
- fix(mobile): scroll horizontal de respaldo en la tabla de documentos — UX-03 — cierra #324
- fix(ux): paginar historial de errores de quiz en Repaso — UX-19 — cierra #389
- fix(ux): paginar historial de sesiones del alumno (antes fijo en 20) — UX-18 — cierra #388
- fix(ux): paginar tabla de materiales del docente — UX-17 — cierra #387
- fix(ux): mejorar manejo visual/funcional de Analytics con volumen alto de datos — UX-16 — cierra #386
- fix(ux): paginar preguntas en Gaps detectados — UX-15 — cierra #385
- fix(chat): colapsar texto largo pegado o en respuestas — ASIST-06 — cierra #384
- fix(upload): usar ModalSaveCancel para el modal de material en Moodle 5.x

### Revertido
- revert(widget): modo estudio vía chat en lenguaje natural — RDS-03 — no persistía en quiz_errors/quiz_attempts, se mantiene el motor de quiz estructurado

### Documentación
- docs(repo): crear CHANGELOG.md y actualizar estado en README — DOC-REPO-01 — cierra #297

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
