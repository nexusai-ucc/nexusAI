# Estado del proyecto — inventario de todo lo construido

> Documento de referencia, no un changelog cronológico (para eso está
> [`CHANGELOG.md`](../../CHANGELOG.md), que cubre release por release hasta
> v0.17.8). Esto es un inventario **por área funcional** de todo lo que
> existe hoy en el producto, para tener el panorama completo antes de
> planificar trabajo nuevo. Generado revisando el historial real de PRs, el
> estado del GitHub Project y el código en sí (no de memoria).
>
> **Última actualización:** 22/09/2026.

---

## 1. Resumen ejecutivo

- **Equipo:** Santiago Tricherri (PM/Backend), Delfina Salinas (Scrum
  Master/Frontend), Marcos Bugliotti (Base de datos/Integración).
- **Tramo:** primer commit 23/04/2026 → hoy, ~5 meses.
- **Estado del backlog:** **213/221 issues en Done (96.4%)** en el GitHub
  Project #5. Quedan 8 sin empezar, todas explícitamente post-MVP o
  diferidas a un sprint futuro (ver sección 5).
- **Fase actual:** Post-MVP Sprint D en adelante. Próximo hito formal:
  informe Check 2 PI (antes del 03/11/2026). Defensa de tesis: 26/02/2027.
- **En paralelo:** sprint de hardening + publicación en el Moodle Plugins
  Directory (Marketplace) — plugin en `MATURITY_BETA`, v0.18.1, i18n a
  inglés, CI corriendo contra PostgreSQL y MySQL.
- **Arquitectura en una línea:** plugin Moodle (PHP) + frontend React
  (bundle AMD) + backend FastAPI con RAG sobre PostgreSQL/pgvector,
  comunicándose vía proxy PHP→Python firmado con HMAC (nunca expuesto
  directo al browser).

---

## 2. Arquitectura — dónde mirar

- [`docs/architecture.md`](./architecture.md) — visión de 10 minutos del
  sistema. **Ojo: está fechado 5/mayo/2026, antes de que el MVP estuviera
  terminado** ("Faltan para el MVP: retrieval semántico, endpoint de
  upload..."). Sirve para entender las 3 capas y los 2 principios rectores
  (una sola base de datos con pgvector, backend agnóstico de proveedor LLM
  vía `LLMProvider`/`EmbeddingProvider`), pero no refleja el estado actual.
- [`docs/adr/`](./adr/) — las decisiones de arquitectura reales y vigentes:
  001 (monolito, no microservicios), 002 (pgvector como única base, no
  ChromaDB), 003 (abstracción multi-proveedor LLM), 004 (Gemini en MVP →
  OpenAI en prod), 005 (autenticación HMAC en 3 capas PHP↔Python), 006
  (estrategia de Privacy API), 010 (alcance del copiloto de onboarding
  docente), 011 (deploy self-hosted en Oracle Cloud, reemplaza
  Railway/Fly.io).
- Modelo de permisos (`plugin/local/nexusai/db/access.php`): 3
  capabilities — `local/nexusai:use` (leer/usar: alumno + docente),
  `local/nexusai:manage` (gestionar material: solo docente/manager),
  `local/nexusai:viewanalytics` (ver Analytics: solo docente/manager,
  definida junto con `:manage` aunque hoy da el mismo acceso).

---

## 3. Funcionalidades construidas, por área

### 3.1 Asistente / Chat

- Chat RAG con citas a la fuente real del material del curso; si no hay
  material que respalde la respuesta, lo admite en vez de inventar.
- Streaming SSE (`/api/v1/chat/stream`) + versión no-streaming.
- Multi-sesión: historial, borrar sesión puntual, ver mensajes de una
  sesión, dropdown de historial.
- Multi-curso: buscar respuesta cruzando todos los cursos del alumno con
  material indexado, no solo el curso actual.
- Feedback 👍/👎 anónimo por respuesta (ASIST-01).
- Regenerar respuesta (ASIST-03), colapsar texto largo pegado/respondido
  (ASIST-06), contador de caracteres cerca del límite (ASIST-05).
- Renderizado de LaTeX/MathJax (ASIST-04) y Markdown en las respuestas.
- Entrada de voz: botón de micrófono, graba con MediaRecorder, transcribe
  con Groq Whisper, el texto se muestra para confirmar/editar antes de
  enviarse — nunca se envía directo (VOICE-01).
- Resiliencia del LLM: fallback automático Gemini → OpenAI, y cadena de
  modelos gratuitos de Gemini antes de caer a Groq (INFRA-01/03).
- Cache de respuestas repetidas en Redis (INFRA-02).
- Moderación de contenido y rate limiting (por minuto y diario) en
  `/api/v1/chat/messages`.
- Detección de idioma de la interfaz para responder en el idioma correcto,
  con fallback para preguntas muy cortas donde no se puede detectar.

### 3.2 Study Planner / Quiz

- Generador de quiz de práctica: opción múltiple, verdadero/falso,
  completar espacios, preguntas abiertas (evaluadas por IA), flashcards, y
  modo mixto.
- Dificultad adaptativa sugerida según historial de aciertos (SP-12, no
  vinculante).
- Repetición espaciada (spaced repetition, algoritmo SM-2) para flashcards
  — resumen de vencidas, revisión, batch de repaso (SP-11).
- Historial de intentos, errores registrados con feedback IA, sugerencias
  de repaso agrupadas por archivo fuente.
- Plan de estudio personalizado combinando errores de quiz + gaps de chat
  + próximo evento de calendario; descartar un tema puntual sin borrar
  todo el historial (SP-13).
- Racha de estudio / gamificación liviana (SP-16).
- Pantalla de revisión post-quiz, modo con tiempo límite opcional
  (SP-14/15).
- Exportar un quiz a PDF para estudiar offline (SP-17).
- Generador de examen para docentes (`exam_generate`, capability
  `:manage`, distinto del quiz de práctica): elige archivos + tipo +
  dificultad + cantidad, preview editable, export a formato GIFT para
  importar al banco de preguntas de Moodle (DOC-D04/D05/D09 — incluye
  priorizar temas con dificultad detectada en Gaps/FAQ).

### 3.3 Buscador

- Búsqueda híbrida (semántica + texto) sobre el material del curso,
  deduplicada y puntuada.
- Filtro por tipo de material y por sección/unidad del curso (BUS-02/05).
- Modo global multi-curso para alumnos.
- Historial de búsquedas recientes y mejor estado vacío (BUS-06/07).
- Resumen automático de PDF/unidad y resumen combinado pre-parcial por
  fecha de examen (BUS-03/04).

### 3.4 Documentos / Gestión docente

- Subida de material: PDF, DOCX, TXT, PPTX, XLSX, CSV, Markdown, HTML,
  hasta 20MB, con fallback OCR (Tesseract) y deduplicado por
  curso+nombre+hash (CONT-04).
- Subida múltiple de archivos a la vez (CONT-06).
- Reemplazar un documento manteniendo su id e historial (CONT-07).
- Re-indexar desde disco sin volver a subir (CONT-09).
- Preview del texto extraído (CONT-08).
- Acciones en lote: selección múltiple, borrado/reindexado (CONT-09).
- Flujo separado para material que el docente subió nativo a una sección
  de Moodle y que NexusAI ofrece indexar (`confirm_pending_upload` /
  `dismiss_pending_upload` / `get_pending_uploads`).
- Resumen LLM de un documento (cacheado en Redis por versión del archivo).

### 3.5 Analytics / Dashboard docente

- Dashboard agregado: preguntas más frecuentes, uso diario, distribución
  de puntajes de quiz, ratio de gaps de contenido, ratio de feedback,
  temas distintos (ANALYTICS-01/02).
- Dashboard de FAQ agrupado por tema vía clustering semántico con LLM
  (DOC-D02).
- Gaps de contenido: preguntas que el material no responde bien,
  agrupadas por similitud semántica; archivar/desarchivar (DOC-D03/D06,
  DOC-D08).
- Export a PDF (respetando el filtro de fecha activo) y a CSV
  (ANALYTICS-03, DOC-D07).
- Gráficos reales con tooltip (hover + foco) y scroll horizontal para
  rangos largos, reemplazando las barras CSS originales (ANALYTICS-04).

### 3.6 Calendario

- Vista de calendario del curso con fechas reales (entregas, exámenes) y
  eventos genéricos (CAL-01, CAL-04).
- Vista de mes en grilla (CAL-05).
- Alertas configurables por el alumno + notificación de material nuevo
  subido (CAL-02/03).
- Export puntual a `.ics` y feed `.ics` suscribible por URL (Google/Apple
  Calendar se suscriben y refrescan solos, autenticado con token opaco por
  alumno) (CAL-06/07).

### 3.7 Foros

- Detección de posts duplicados/similares mientras el alumno escribe
  (FOR-02).
- Sugerencia de respuesta RAG+LLM al publicar (FOR-03).
- Resumen automático de un hilo (FOR-04).
- Detección de urgencia/frustración en posts (heurística, sin LLM) y
  digest semanal de actividad para el docente (FOR-05/06).
- Notificar el digest a un webhook externo (Slack/Discord/Teams) (FOR-07).
- Auto-indexado de posts nuevos vía observer de Moodle.

### 3.8 Onboarding docente

- ADR de alcance (ONB-01) + endpoint de estado de setup del curso
  (ONB-02, 100% de lectura, sin escribir nada).
- Tutorial paso a paso al crear un curso nuevo, y modo revisión al editar
  uno existente (ONB-03/04).
- Persistencia de dismissal/progreso en `user_preferences` de Moodle core
  (sin tabla propia) + acceso permanente para reabrir la ayuda (ONB-05/06).
- Pestaña "Ayuda" en NexusAI Materiales explicando las 5 herramientas
  docentes (ONB-07/08).

### 3.9 Privacidad

- Autoservicio del alumno: exportar/borrar su propio historial
  (mensajes, intentos y errores de quiz) por curso — los intentos de quiz
  se anonimizan, no se borran, para no romper el dashboard de Analytics
  del docente (PRIV-01).
- Flujo admin GDPR: `\core_privacy\local\request\plugin\provider` +
  `core_userlist_provider`, enganchado a Site administration → Users →
  Privacy → Data requests, para que un admin procese un pedido sin
  depender del autoservicio del alumno. Aproxima "en qué cursos tiene
  datos este user" vía inscripción + capability `local/nexusai:use`
  (el backend no tiene un índice propio de eso).

### 3.10 Seguridad

- Auditoría OWASP Top 10 + dependency scanning en CI (SEC-01,
  `docs/security/owasp-audit-2026-08.md`).
- Autenticación HMAC firmada en las 3 capas PHP→Python (ADR-005),
  `$USER->id` siempre resuelto del lado servidor, nunca de un parámetro
  del cliente.
- Rate limiting por minuto y diario, moderación de contenido en el chat.
- Fix de seguridad: reemplazo de accesos directos a `$_GET` por
  `optional_param()` (hardening previo al envío a Marketplace).

### 3.11 UX transversal

- Tooltips explicativos, confirmación antes de acciones destructivas,
  sistema de Toast reutilizable (UX-05/06/07).
- Auditoría de mensajes de error y de estados vacíos en todos los paneles
  (UX-08/09).
- Auditoría de accesibilidad (teclado + lector de pantalla) (UX-10).
- Modo oscuro en todo el widget (UX-11).
- Loading skeletons en vez de spinners genéricos (UX-12).
- Atajos de teclado globales, persistencia de la pestaña activa entre
  navegaciones (UX-13/14).
- Paginación real donde antes no la había: Gaps, tabla de materiales,
  Analytics con volumen alto, historial de sesiones, historial de errores
  de quiz (UX-15 a UX-19).
- Ajustes mobile: scroll horizontal de respaldo en tablas, área táctil de
  44px en botones de ícono (UX-03/04).

### 3.12 Rediseño de frontend (agosto 2026)

- Chat: de dropdown flotante a sidebar acoplado que empuja el contenido
  del curso (RDS-01), historial como vista de panel en vez de overlay
  (RDS-02).
- Docente: de tabs horizontales a nav lateral tipo dashboard (RDS-05),
  tarjetas de stats + "Salud del contenido" en Analytics (RDS-06), restyle
  de Material/Gaps/FAQ/Generar examen/Buscar (RDS-07), unificación de
  Preguntas frecuentes y Gaps en un solo panel con selector interno
  (RDS-08).
- **Nota:** RDS-03 (Modo estudio integrado vía chat en lenguaje natural)
  se implementó y **se revirtió** — no persistía correctamente en
  `quiz_errors`/`quiz_attempts`. Se mantiene el motor de quiz estructurado
  original. Sigue pendiente [RDS-04] (Enter IME-safe en el composer, ver
  sección 5).

### 3.13 Integración Moodle / Infraestructura

- Plugin tipo `local` completo: estructura, capabilities, servicios
  registrados, identificación de usuario autenticado, acceso a datos del
  curso, gestión de roles y permisos, comunicación PHP→Python vía proxy
  HMAC.
- Bundle React compilado como módulo AMD embebido en el plugin.
- Deploy en Oracle Cloud "Always Free" (2 VMs ARM) — reemplazó
  Railway/Fly.io (ADR-011). *Nota: el deploy self-hosted específico
  [DEPLOY-02] sigue en Todo, ver sección 5 — lo que está hecho es el
  deploy de staging/prod actual, no la variante self-hosted documentada.*
- CI real (`moodle-ci.yml`) corriendo desde la raíz correcta del repo git
  (bug corregido en PUB-01, antes nunca se ejecutaba), contra Moodle 4.1 y
  4.5, PostgreSQL y MySQL.
- Fix de compatibilidad Moodle 5.x (modal de confirmación de material,
  observer de foros) (INT-02).

### 3.14 Publicación / Moodle Marketplace

- Investigación completa del checklist de publicación
  (`investigacion/01-moodle/publicacion-marketplace.md`), incluyendo por
  qué el monorepo bloquea el registro y el plan de `git subtree split`.
- Repos separados ya creados y sincronizados automáticamente desde
  `development`: `moodle-local_nexusai` y `nexusai-backend`.
- Cumplimiento del Moodle Coding Standard (105 archivos, 810 errores + 138
  warnings → 0) y fix de `thirdpartylibs.xml`.
- Traducción completa a inglés: comentarios de código, strings de UI,
  README, mensajes de error — con las respuestas del asistente siguiendo
  el idioma de la interfaz de Moodle.
- Ícono del plugin (256×256), `MATURITY_BETA`, self-host docs para
  reviewers (`docs/REVIEWER_TESTING.md`, `docker-compose.selfhost.yml`),
  imagen Docker pública del backend.
- Seguimiento del estado de envío en
  [`docs/MARKETPLACE_SUBMISSION_STATUS.md`](./MARKETPLACE_SUBMISSION_STATUS.md)
  — consultar ese archivo para el estado más actualizado del envío en sí.

---

## 4. Hitos y pivotes estructurales

| Fecha | Hito |
|---|---|
| 02–03/05/2026 | Pivote de arquitectura durante la investigación: de ChromaDB a PostgreSQL+pgvector, antes de escribir código real. |
| 01/06/2026 | **MVP entregado** (v0.8.0-mvp): chat RAG, streaming SSE, citas, quiz MCQ, detección de gaps, búsqueda semántica. |
| 23/06/2026 | Post-MVP Sprint A (v0.9.0): ingesta multi-formato (PPTX/XLSX/CSV/MD/HTML) + OCR. |
| 12/07/2026 | Post-MVP Sprint B (v0.10.0): épica de Foros con IA completa. |
| 28/07/2026 | Post-MVP Sprint C (v0.11.0): la semana más cargada — calendario, filtros de búsqueda, analytics, generador de examen, plan de estudio y rediseño de nav, todo el mismo día. |
| 17/08/2026 | Cierre de Sprint C + Rediseño de interfaz (v0.14.2): reescritura de UI (RDS), con el revert de RDS-03 como único rollback claro de la historia. |
| 08/09/2026 | Cierre de Sprint G + backlog chico (v0.17.8): entrada de voz, exports PDF/CSV/ICS, modo oscuro, accesibilidad, primera suite de tests automatizados (QA-01/02). |
| 13–21/09/2026 | Push de hardening + envío a Moodle Marketplace: fix de seguridad, Privacy API admin, MySQL en CI, auditoría OWASP, i18n completo a inglés, self-host docs, `MATURITY_BETA`. |

---

## 5. Lo que falta (8 items, ninguno oculto)

Todos post-MVP salvo el marcado, con su sprint/prioridad asignada en el
board:

| Issue | Título | Épica | Prioridad / sprint |
|---|---|---|---|
| [#380 INT-01](https://github.com/nexusai-ucc/nexusAI/issues/380) | Investigación: sincronización real con Google Calendar vía OAuth2 | Calendario | Baja, post-MVP |
| [#249 PI-06](https://github.com/nexusai-ucc/nexusAI/issues/249) | Preparar PPT y speech para defensa (1/feb) | Documentación | Alta, sprint:entrega |
| [#250 PI-07](https://github.com/nexusai-ucc/nexusAI/issues/250) | Last check y ajustes pre-defensa (1–7/feb) | Documentación | Alta, sprint:entrega |
| [#264 TEST-01](https://github.com/nexusai-ucc/nexusAI/issues/264) | Protocolo y plan de pruebas con usuarios reales | Gestión | Alta, sprint:post-c |
| [#265 TEST-02](https://github.com/nexusai-ucc/nexusAI/issues/265) | Ejecución y análisis de pruebas con usuarios reales | Gestión | Alta, sprint:entrega |
| [#318 DEPLOY-02](https://github.com/nexusai-ucc/nexusAI/issues/318) | Deploy self-hosted en Oracle Cloud (Always Free) — reemplaza DEPLOY-01 | Integración | Alta, sprint:post-g |
| [#351 INV-15](https://github.com/nexusai-ucc/nexusAI/issues/351) | Investigación: soporte nativo en la app oficial de Moodle (Ionic) | Integración | Media, post-MVP |
| [#403 RDS-04](https://github.com/nexusai-ucc/nexusAI/issues/403) | Chat: Enter IME-safe en el composer | Rediseño frontend | Media (único no post-MVP) |

**Nota de estado del board:** [#402 RDS-03](https://github.com/nexusai-ucc/nexusAI/issues/402)
figura Done en el GitHub Project pero sigue abierto en GitHub — bug
conocido del flujo (mergeó a `development`, no a `main`, y por eso nunca
se auto-cerró). Se cuenta como hecho en este documento porque el código
real está mergeado y funcionando (ver 3.12 para el detalle del revert
posterior de su primera versión).

---

## 6. Referencias

- [`CHANGELOG.md`](../../CHANGELOG.md) — detalle release por release
  (hasta v0.17.8; el sprint de hardening de Marketplace, sept. 2026,
  todavía no tiene entrada ahí).
- [`docs/adr/`](./adr/) — decisiones de arquitectura vigentes.
- [`docs/architecture.md`](./architecture.md) — visión general (desactualizada, ver sección 2).
- [`docs/MARKETPLACE_SUBMISSION_STATUS.md`](./MARKETPLACE_SUBMISSION_STATUS.md) — estado del envío al Marketplace.
- [`plugin/local/nexusai/README.md`](../plugin/local/nexusai/README.md) — landing pública del plugin, lista de features cara al usuario.
- [GitHub Project #5](https://github.com/orgs/nexusai-ucc/projects/5) — board completo, 221 issues.
