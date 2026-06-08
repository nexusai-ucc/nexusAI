# Sprint 4 — MVP completo

<!--
Fuente reciclable:
- git log mayo 2026: 7 commits feat: A-G + UI shadcn + fixes
- GitHub issues #253 a #258 (MVP-A a MVP-F)
- PLAN_NUEVAS_FEATURES.md
-->

## Objetivo

Cerrar el MVP con 7 features que demuestran el alcance completo de NexusAI
para la defensa.

## Duración

mayo 2026 — junio 2026.

## Features entregadas

### Feature A — Buscador semántico

**Versión:** 0.4.0 · **Commit:** `ef44ad6` · **Issue:** #253

Endpoint y UI de retrieval puro sobre pgvector. Devuelve fragmentos relevantes
del material del curso a una consulta del alumno, sin pasar por el LLM.

### Feature B — Chat multi-curso

**Versión:** 0.4.0 · **Commit:** `ef44ad6` · **Issue:** #254

Toggle 📚/🌐 que permite al alumno consultar material de TODOS sus cursos a la
vez, no solo el actual. El LLM cita la materia de cada fragmento.

### Feature C — Streaming SSE

**Versión:** 0.5.0 · **Commit:** `6a15cd7` · **Issue:** #255

Respuesta token-por-token con Server-Sent Events. Primer token en ~1s vs ~8s
del modo sync. Mantiene Hybrid PHP Proxy (ADR-001) — HMAC server-to-server.

### Feature D — Citas clickeables con preview

**Versión:** 0.6.0 · **Commit:** `27ef377` · **Issue:** #256

Las pills de "Fuentes:" son botones que expanden el fragmento exacto usado por
el LLM, con score de similaridad. Cierra el loop visual del RAG.

### Feature E — Historial de conversaciones

**Versión:** 0.7.0 · **Commit:** `9b426b9` · **Issue:** #257

Dropdown 🕐 con sesiones previas del alumno, ordenadas por última actividad.
Click → carga mensajes y permite continuar la conversación.

### Feature F — Quiz generator

**Versión:** 0.8.0 · **Commit:** `5f9f6c5` · **Issue:** #258

Pestaña "Quiz" que genera preguntas de opción múltiple sobre el material.
4 opciones, feedback inmediato con explicación + archivo fuente, score final.

### Feature G — Detección de gaps del docente

**Versión:** 0.9.0 · **Commit:** TODO

Sistema registra automáticamente preguntas de alumnos que el material no pudo
responder (chunks=0 o max_sim<0.4 o LLM dice "no encontré"). El docente ve un
reporte de gaps en `NexusAI · Materials`. Feedback loop pedagógico.

## Entregables del sprint

- Plugin v0.9.x con las 7 features
- 6 issues cerradas con commit linkeado (#253-#258)
- GitHub Release v0.8.0-mvp con ZIP descargable
- Backend deployado en Railway (autodeploy via GitHub Actions)
- README con instrucciones de instalación para cualquier Moodle

## Retrospectiva

TODO — Qué salió bien (streaming, citas), qué costó (LLM "follow-the-example"
en prompts, gaps con señal solo del retrieval), qué cambiaríamos.


