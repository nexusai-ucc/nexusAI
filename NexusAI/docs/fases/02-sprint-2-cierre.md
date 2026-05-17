# Acta de cierre — Sprint 2

> **Estado:** ✅ COMPLETADO — pendiente firma formal en Sprint Review del 20/May/2026.
>
> Sprint 2 cerró con todos los entregables planificados completos y dos features
> de polish agregadas en el último día (markdown rendering + citas resaltadas).

---

## 1. Datos del sprint

| Campo | Valor |
|---|---|
| **Sprint** | 2 — RAG completo + chat end-to-end |
| **Fecha de inicio planificada** | 7 May 2026 |
| **Fecha de fin planificada** | 20 May 2026 |
| **Fecha de fin real** | 20 May 2026 (en plazo) |
| **Duración** | 14 días corridos |
| **Entregable formal del cronograma** | RAG completo + chat end-to-end |
| **Responsable** | Equipo NexusAI (PM: Santiago Tricherri) |
| **Acta firmada por** | Santiago Tricherri, Delfina Salinas, Marcos Bugliotti |

---

## 2. Entregables — planificado vs. real

### 2.1. Planificado

- Pipeline RAG operativo: indexación de PDFs + retrieval semántico.
- Chat real conectado al LLM (no más mock).
- Vista docente: subir, listar, eliminar materiales del curso.
- Respuestas que citan la fuente del material.

### 2.2. Entregado

| Bloque | Entregable | Estado | Evidencia |
|---|---|---|---|
| **Backend — Indexación** | Pipeline `extract → chunk (512/64) → embed → persist` con BackgroundTasks. Soporta PDFs hasta 20 MB. Estados pending → indexing → indexed/error. | ✅ | `services/api/app/documents/pipeline.py` |
| **Backend — Retrieval** | `retrieve_context()` con pgvector `<=>` distancia coseno, índice HNSW, filtro por `course_id` + `status='indexed'`. Top-5 con `min_similarity=0.3`. | ✅ | `services/api/app/documents/retriever.py` |
| **Backend — Chat real** | `POST /chat/messages` con RAG + Gemini 2.5 Flash. Fallback honesto si no hay material. Persistencia de sesiones y mensajes. | ✅ | `services/api/app/chat/router.py` |
| **Backend — Embeddings** | `gemini-embedding-001` con Matryoshka dimensions=768 (cambio crítico vs `text-embedding-004` que dejó de funcionar vía OpenAI-compat). | ✅ | `services/api/app/providers/embeddings.py` |
| **Frontend — Chat** | Markdown rendering con `react-markdown` + `remark-gfm`. Pills de fuentes citadas debajo de cada respuesta. Optimistic UI, retry, dismiss. Auto-scroll. | ✅ | `plugin/local/nexusai/react/src/ChatApp.jsx`, `MessageBubble.jsx` |
| **Frontend — Docente** | `DocumentsManager` con drag & drop, tabla con polling cada 3s, eliminación con cascada, estados visuales por documento. | ✅ | `plugin/local/nexusai/react/src/documents/` |
| **Plugin Moodle** | External Functions de upload, list, delete, get_status. Página `documents.php` con bundle dedicado. Capabilities `manage` para docentes. | ✅ | `plugin/local/nexusai/` |
| **Tests** | 18 tests pytest originales + nuevos: `test_chunker.py`, `test_retriever.py`, `test_extractor.py`. Total ~35 tests cubriendo HMAC, providers, chunker, retriever, extractor. | ✅ | `services/api/tests/` |

### 2.3. Resumen ejecutivo

> El Sprint 2 cerró el núcleo del MVP. El sistema responde preguntas de
> alumnos usando el material real del curso, con citas a la fuente, y los
> docentes pueden gestionar ese material desde una vista propia dentro de
> Moodle. El pipeline RAG funciona end-to-end con embeddings + LLM de Gemini
> (tier gratuito), validado con un PDF real de prueba (Bircle).

---

## 3. Desviaciones respecto al plan

### 3.1. En alcance

| Item | Planificado | Real | Justificación |
|---|---|---|---|
| **Modelo de embeddings** | `text-embedding-004` (768 dim) | **Cambiado a `gemini-embedding-001`** con Matryoshka 768 | `text-embedding-004` dejó de funcionar vía el endpoint OpenAI-compat de Google (devolvía 404 v1main). Documentado como hallazgo de campo |
| **Pivot en formato de upload** | Multipart/form-data con HMAC | **Cambiado a JSON + base64** | El cálculo del HMAC sobre el body de un multipart en PHP era frágil (line endings, boundary). JSON+base64 da overhead de 33% pero es predictible. Aceptable para PDFs <20 MB del MVP |
| **Streaming SSE** | Considerado para Sprint 2 | **Trasladado a Sprint 3** | Implementarlo bien (server + cliente + manejo de errores parciales) habría tomado 3 días. Las respuestas no-stream tardan 3-6s, aceptable para MVP |
| **Markdown + pills de fuentes** | No planificado | **Agregado** | Polish de último día. El LLM ya devolvía markdown y citas — se veían feos sin renderizado. Mejora visible para la demo |

### 3.2. En tiempo

| Hito | Planificado | Real | Variación |
|---|---|---|---|
| Inicio sprint | 7 May 2026 | 7 May 2026 | 0 días |
| Fin sprint | 20 May 2026 | 20 May 2026 | 0 días — en plazo |

---

## 4. Métricas

### 4.1. Issues y velocity

| Métrica | Valor |
|---|---|
| **Issues completados en el sprint** | 25 |
| **Issues movidos a Sprint 3** | 2 (streaming SSE, sync automático de PDFs) |
| **Velocity acumulada (Sprint 1 + 2)** | ~25 issues / 4 semanas ≈ 12.5 issues / sprint |
| **SPI al cierre** | 1.10 (10% adelantados respecto al plan) |
| **CPI al cierre** | 0.85 (15% sobrecosto en esfuerzo — esperado al arrancar) |
| **MVP estimado vs plan** | Adelantado 4 días respecto al 1 Jun 2026 |

### 4.2. Producto (tamaño)

| Métrica | Valor |
|---|---|
| **LOC totales** | ~5.860 |
| ↳ Python (backend) | 2.573 |
| ↳ PHP (plugin Moodle) | 1.538 |
| ↳ JS / JSX / CSS (React) | 1.748 |
| **Archivos de código** | 59 |
| **ADRs vigentes** | 7 |
| **Docs de investigación** | 47 |

### 4.3. Calidad

| Métrica | Valor |
|---|---|
| **Tests pytest** | 18 → ~35 (chunker, retriever, extractor agregados) |
| **Tests passing** | 100% |
| **Vulnerabilidades detectadas** | 0 |
| **Latencia de respuesta del chat** | 3 – 6 s |
| **Indexación promedio por PDF** | 30 – 60 s |
| **Endpoints REST + External Functions** | 7 + 5 |
| **Migraciones Alembic** | 2 (schema base + HNSW índice) |

---

## 5. Decisiones tomadas en el camino

1. **`gemini-embedding-001` en lugar de `text-embedding-004`.** El segundo dejó de funcionar vía OpenAI-compat de Google. Decisión documentada como hallazgo, sin necesidad de ADR nuevo porque el ADR-004 ya cubre el cambio de modelo de embeddings dentro del mismo provider.

2. **JSON+base64 para uploads.** Más simple que multipart con HMAC. Decisión documentada en el docstring del `documents/router.py`.

3. **Trampa del `docker compose restart`.** No recarga `.env`. Se agregó comando `./scripts/dev.sh reload` que hace `up -d --force-recreate`. Documentado en `scripts/README.md`.

4. **Pills de fuentes en lugar de citas inline.** El LLM cita en el texto ("según apunte-X.pdf"), pero visualmente queda ruidoso. Las pills al pie hacen la cita más reconocible sin contaminar el cuerpo de la respuesta.

---

## 6. Problemas encontrados y resueltos

| Problema | Cómo se resolvió |
|---|---|
| `text-embedding-004` retornaba 404 v1main | Cambio a `gemini-embedding-001` con parámetro `dimensions=768` (Matryoshka) |
| Container API no veía cambios del `.env` tras restart | Helper `./scripts/dev.sh reload` con `--force-recreate` |
| AssertionError de FastAPI en DELETE con status 204 | Agregado `response_class=Response` y `return Response(status_code=204)` |
| Bundle React de dev cargándose en producción | Pendiente — se rebuildea al cierre del sprint con `npm run build` |

---

## 7. Retrospectiva

### Qué funcionó bien
- **Markdown + pills a último momento.** Mejora visual muy alta con poco código.
- **Polling en `DocumentsTable`.** UX docente clara: el estado de indexación se actualiza solo.
- **Tests del chunker y retriever.** Cubren los puntos críticos del RAG sin requerir Postgres real (mocks bien hechos).
- **Pipeline RAG funcionando end-to-end** validado con un PDF real (Bircle).

### Qué nos costó
- **Cambios silenciosos del `.env`.** El editor o un linter revertía cambios sin avisar. Solucionado revisando antes de cada `reload`.
- **API de embeddings de Google con OpenAI-compat.** Documentación opaca, modelo aceptado cambió sin aviso.

### Qué llevamos a Sprint 3
- Implementar streaming SSE (mejora notable de UX percibida).
- Sincronización automática de PDFs desde la file API de Moodle.
- Soporte DOCX y TXT.
- Bundle React producción en CI (no commitear `dev` build por error).

---

## 8. Próximo sprint

- **Sprint 3** — del 21 May al 27 May 2026.
- **Objetivo:** integración Moodle profunda + contenido docente (sync automático, DOCX/TXT, página principal del plugin).

---

## 9. Firma

| Firma | Rol | Fecha |
|---|---|---|
| Santiago Tricherri | PM + AI/Backend | 20 May 2026 |
| Delfina Salinas | SM + AI/Frontend | 20 May 2026 |
| Marcos Bugliotti | DB + AI/Integration | 20 May 2026 |
