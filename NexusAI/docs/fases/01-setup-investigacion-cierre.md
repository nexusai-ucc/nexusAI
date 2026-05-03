# Acta de cierre — Fase 1: Setup e Investigación

> **Estado:** [ ] BORRADOR — completar con datos reales antes de presentar
>
> **Cómo usar este documento:**
> 1. Reemplazar todos los `TODO` y placeholders en negrita.
> 2. Completar EVM con números reales del cierre.
> 3. Cierre formal: firmar el acta en la reunión de cierre con todo el equipo presente.
> 4. Presentar a Belén Zarazaga (Admin de Proyectos) como entregable de la fase.

---

## 1. Datos de la fase

| Campo | Valor |
|---|---|
| **Fase** | 1 — Setup e Investigación |
| **Fecha de inicio planificada** | 9 Abr 2026 |
| **Fecha de fin planificada** | 22 Abr 2026 |
| **Fecha de fin real** | **TODO** (formato: DD MMM 2026) |
| **Duración planificada** | 14 días corridos |
| **Duración real** | **TODO** días |
| **Entregable formal del cronograma** | Entorno + arquitectura |
| **Responsable de la fase** | Equipo NexusAI (PM: Santiago Tricherri) |
| **Acta firmada por** | Santiago Tricherri, Delfina Salinas, Marcos Bugliotti |
| **Fecha de firma** | **TODO** |

---

## 2. Entregables — planificado vs. real

### 2.1. Lo que estaba planificado

Según cronograma original, la fase entregaba:

- Entorno de desarrollo configurado (Moodle, Python, Node).
- Documento de arquitectura validado.
- Investigación técnica de los componentes principales.
- Relevamiento con docentes y stakeholders.

### 2.2. Lo que efectivamente se entregó

| Bloque | Entregable | Estado al cierre | Evidencia / link |
|---|---|---|---|
| **Investigación técnica** | 39 docs en `investigacion/` cubriendo Moodle, RAG, LLMs, pgvector, FastAPI, React, procesamiento docs, estado del arte | ✅ COMPLETADO | [`investigacion/`](../../investigacion/) |
| **Investigación contexto** | Estado del arte (4 plugins Moodle IA + 5 competidores externos), encuesta docentes diseñada, reunión con Leandro | ⚠️ PARCIAL | encuesta sin resultados aún, requisitos UCC pendientes |
| **Setup técnico** | Repo en org GitHub `nexusai-ucc`, estructura de carpetas, CI workflows, Docker Compose, scripts dev | ✅ COMPLETADO | https://github.com/nexusai-ucc/nexusAI |
| **Documentación arquitectura** | `docs/architecture.md` + 4 ADRs aceptados + 5 diagramas Mermaid | ✅ COMPLETADO | [`docs/`](../) |
| **Decisiones arquitectónicas formales** | ADR-001 monolito modular, ADR-002 pgvector, ADR-003 multi-provider LLM, ADR-004 Gemini MVP/OpenAI prod | ✅ COMPLETADO | [`docs/adr/`](../adr/) |
| **Primera prueba funcional** | API RAG operativa con vista docente (carga + estado de indexación) y vista alumno (chat) | ✅ COMPLETADO | reportar evidencia (URL, screenshots) en `investigacion/00-pruebas-iniciales/` (TODO) |
| **Reunión técnico Moodle UCC** | — | ❌ PENDIENTE | a coordinar vía Leandro |
| **Encuesta docentes — resultados** | — | ❌ PENDIENTE | encuesta enviada, esperando respuestas |

### 2.3. Resumen ejecutivo

**TODO** Una o dos frases del PM resumiendo el cierre. Ejemplo:

> La Fase 1 cerró con todos los entregables técnicos completados y un avance significativo respecto del plan original (SPI > 1). Los entregables de relevamiento de stakeholders quedaron parcialmente abiertos y se trasladan al Sprint 1 sin impactar el camino crítico al MVP.

---

## 3. Desviaciones respecto al plan

### 3.1. En alcance

| Item | Planificado | Real | Justificación |
|---|---|---|---|
| Investigación técnica | Cobertura básica de stack | **Sobre-cumplida** — 39 docs detallados | Se aprovechó documentación técnica externa (PDF guía) + investigación profunda de Marcos sobre arquitectura del plugin |
| Decisión de base vectorial | ChromaDB (asumida en anteproyecto) | Cambiada a **pgvector sobre PostgreSQL** | Marcos identificó que pgvector permite queries SQL+vector unificadas, una sola DB que operar. Documentado en ADR-002 |
| Modelo LLM | OpenAI GPT-4o-mini fija | **Multi-provider agnóstico** (Gemini MVP gratis, OpenAI prod) | Necesidad de validar con usuarios reales sin gasto en MVP. Documentado en ADR-003 y ADR-004 |
| Reunión técnico Moodle UCC | Cerrada en la fase | **Trasladada a Sprint 1** | No se logró coordinar agenda con el técnico vía Leandro. No bloquea desarrollo MVP |

### 3.2. En tiempo

| Hito | Planificado | Real | Variación |
|---|---|---|---|
| Inicio fase | 9 Abr | **TODO** | — |
| Fin fase | 22 Abr | **TODO** | **TODO** días (+/-) |

### 3.3. En equipo / capacidad

**TODO** Cualquier evento relevante: enfermedad, vacaciones, etc. Si nada relevante, escribir "Sin desviaciones de capacidad."

---

## 4. Métricas EVM finales

> **Nota:** los valores al 13 Abr fueron SPI 2.44, CPI 0.95. Estos números deben recalcularse al **cierre real** de la fase. Santiago (PM) llena esta sección.

### 4.1. Resumen

| Métrica | Valor |
|---|---|
| **PV** (Valor Planificado a la fecha de cierre) | **TODO** SP |
| **EV** (Valor Ganado a la fecha de cierre) | **TODO** SP |
| **AC** (Costo Real a la fecha de cierre — horas-persona o equiv.) | **TODO** |
| **SV** = EV − PV | **TODO** SP |
| **CV** = EV − AC | **TODO** |
| **SPI** = EV / PV | **TODO** |
| **CPI** = EV / AC | **TODO** |
| **EAC** (Estimate at Completion) | **TODO** |
| **ETC** (Estimate to Complete) | **TODO** |

### 4.2. Interpretación

**TODO** 2-3 líneas explicando qué significan los números. Ejemplo:

> Cerramos la fase con SPI > 1, lo que indica que avanzamos más rápido que lo planificado, gracias a la disponibilidad de documentación técnica de referencia y dedicación full-time del equipo. CPI cercano a 1 confirma que el costo real estuvo alineado con el presupuesto. Proyectamos llegar al MVP antes de la fecha planificada (1 Jun 2026).

### 4.3. Proyección al MVP

| Métrica | Valor |
|---|---|
| Fecha planificada MVP | 1 Jun 2026 |
| Fecha proyectada MVP (basada en SPI actual) | **TODO** |
| Días de adelanto / atraso proyectado | **TODO** |

---

## 5. Lecciones aprendidas

### 5.1. Qué funcionó bien

**TODO** 3-5 puntos. Ejemplos para inspirarse:

- La documentación técnica externa (guía PDF de Moodle + RAG) ahorró ~1 semana de investigación desde cero.
- Decidir tempranamente migrar a pgvector evitó complejidad de operar 2 DBs en paralelo.
- Diseñar arquitectura agnóstica de LLM desde el día 1 desbloqueó MVP gratuito con Gemini.
- Sincronización asincrónica del equipo (sin daily sync) permitió avance en paralelo sin reuniones excesivas.
- Repo organizado con investigación + ADRs facilita onboarding y defensa al jurado.

### 5.2. Qué no funcionó / qué cambiaríamos

**TODO** 3-5 puntos. Ejemplos:

- Subestimamos el tiempo de coordinación con stakeholders externos (técnico Moodle UCC).
- Hubiera sido útil empezar la primera prueba funcional **antes** de cerrar toda la documentación.
- La encuesta docente debería haber salido la primera semana, no la segunda.
- **TODO** completar con observaciones reales del equipo.

### 5.3. Qué cambiamos para los próximos sprints

**TODO** 2-3 acciones concretas. Ejemplos:

- Incluir un **smoke test E2E** en cada sprint, no solo al cierre.
- Coordinar reuniones con stakeholders externos al **inicio** del sprint, no al final.
- Mantener la encuesta docente abierta + difundir activamente cada semana.

---

## 6. Riesgos identificados para Sprint 2+

Riesgos que se trasladan a sprints siguientes (priorizados por impacto × probabilidad):

| ID | Riesgo | Probabilidad | Impacto | Mitigación planeada | Dueño |
|---|---|---|---|---|---|
| R1 | Aprobación institucional UCC demora más de 4-6 semanas | Alta | Alto | Plan B = demo Docker local para defensa MVP. Iniciar trámite ya | Marcos / Leandro |
| R2 | Tier gratuito de Gemini insuficiente al escalar piloto | Media | Medio | ADR-004 documenta switch a OpenAI con solo cambio de env vars | Santiago |
| R3 | Calidad RAG con material real menor a benchmarks estimados | Media | Alto | Dataset de evaluación con 30-50 preguntas + dataset propio en Sprint 2 | Santiago |
| R4 | Restricciones de privacidad de Gemini sobre datos de alumnos | Media | Alto | Confirmar términos antes del piloto. Plan B: nomic-embed-text local | Marcos |
| R5 | Bundle React + CSP de Moodle: colisiones en producción | Baja | Medio | Smoke test E2E temprano en Sprint 1, no al final del MVP | Delfi |
| R6 | Reunión técnico Moodle UCC no se concreta | Media | Medio | Si no avanza en Sprint 1, escalar al PI o usar Plan B (demo Docker) | Marcos / Leandro |
| R7 | Rate limits de Gemini (1.500 req/día) saturan piloto | Baja-Media | Bajo | Queue de requests en FastAPI + monitoring de cuota | Santiago |

**TODO** agregar/quitar riesgos según lo que el equipo identifique en la reunión de cierre.

---

## 7. Backlog ajustado

### 7.1. Items que se descubrieron durante la fase y se agregan al backlog

**TODO** completar. Ejemplos posibles:

- Migración de schema 768 → 1536 dim cuando se pase a producción (script automatizado) — `chore`, post-MVP, 3 SP, Marcos.
- Dataset de evaluación RAG con ground truth — `task`, Sprint 2, 5 SP, Santiago + Leandro.
- Investigación de retrieval híbrido (BM25 + dense) — `feat` post-MVP, 8 SP, Santiago.
- Acuerdo con UCC IT sobre whitelist de dominio externo del backend — `task`, Sprint 3, 2 SP, Marcos.
- **TODO** otros que aparezcan.

### 7.2. Items que cambian de estimación

**TODO** ¿Algún item del backlog original cambió de SP por lo aprendido en la fase?

| Item | SP original | SP nuevo | Justificación |
|---|---|---|---|
| **TODO** | | | |

### 7.3. Items que se eliminan del backlog

**TODO** ¿Hay tareas que dejaron de tener sentido por las decisiones de arquitectura?

Ejemplos:

- Tareas relacionadas con instalación/operación de ChromaDB → eliminadas (decisión pgvector).
- Tareas de rotación de modelo OpenAI fijo → reemplazadas por gestión de `LLMProvider` agnóstico.

---

## 8. Estado del proyecto al cierre de la fase

### 8.1. Qué está funcionando hoy

**TODO** breve descripción del estado real al cierre. Ejemplo:

- Repo en GitHub org `nexusai-ucc` con CI configurado.
- Moodle 4.4 corriendo en Docker local.
- API RAG con primera prueba funcional (vista docente + vista alumno).
- 4 ADRs aceptados y publicados en el repo.
- 39 docs de investigación validados por el equipo.

### 8.2. Qué arranca en Sprint 1

- Plugin Moodle base (Marcos).
- Backend FastAPI estructurado modularmente (Santiago).
- Bundle React mínimo embebido (Delfi).
- Smoke test E2E con HMAC + Gemini Flash funcionando.
- Cierre de items pendientes de relevamiento (encuesta + reunión UCC).

### 8.3. Camino al MVP (1 Jun 2026)

```
Sprint 1 (23 Abr - 6 May):  Plugin base + API estructurada + React mínimo
Sprint 2 (7 May - 20 May):  RAG completo + chat E2E con streaming SSE
Sprint 3 (21 May - 27 May): Integración Moodle + vista docente + indexación
Sprint 4 (28 May - 1 Jun):  MVP — pulido, fixes, demo lista
```

Estado actual: **TODO** en línea / adelantado / atrasado respecto a este camino.

---

## 9. Aprobación de cierre

> Este documento se firma en la reunión de cierre de fase, con todo el equipo presente.
> La firma confirma que cada miembro está de acuerdo con el estado documentado y los items trasladados a Sprint 1+.

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Project Manager / AI-Backend | Santiago Tricherri | _________________ | **TODO** |
| Scrum Master / AI-Frontend | Delfina Salinas | _________________ | **TODO** |
| DB / Integración | Marcos Bugliotti | _________________ | **TODO** |
| Docente PI (testigo, opcional) | Leandro Juarez | _________________ | **TODO** |

---

## 10. Anexos

### 10.1. Enlaces relevantes

- **Repo:** https://github.com/nexusai-ucc/nexusAI
- **Backlog + Gantt:** https://github.com/users/delfisalinasmich/projects/5
- **Investigación completa:** [`investigacion/`](../../investigacion/)
- **ADRs aceptados:** [`docs/adr/`](../adr/)
- **Síntesis arquitectura:** [`docs/architecture.md`](../architecture.md)
- **Diagramas:** [`docs/diagrams/`](../diagrams/)

### 10.2. Documentos generados durante la fase

- `README.md` raíz, `LICENSE` (MIT), `CONTRIBUTING.md`, `.gitignore`
- `docs/architecture.md` — síntesis de 13 secciones con diagramas
- `docs/adr/001` a `docs/adr/004` — decisiones formales
- `docs/diagrams/` — 5 diagramas Mermaid
- `docker-compose.yml` raíz + scripts de init
- `.github/workflows/` — 3 pipelines CI
- `.github/PULL_REQUEST_TEMPLATE.md` + 3 issue templates + `CODEOWNERS`
- 39 docs en `investigacion/`

### 10.3. Decisiones de arquitectura cerradas durante esta fase

| ADR | Decisión |
|---|---|
| [ADR-001](../adr/001-monolito-modular.md) | Backend Python como monolito modular (no microservicios) |
| [ADR-002](../adr/002-pgvector.md) | pgvector sobre PostgreSQL como única base de datos |
| [ADR-003](../adr/003-multi-provider-llm.md) | Arquitectura agnóstica de proveedor LLM |
| [ADR-004](../adr/004-gemini-mvp-openai-prod.md) | Gemini Flash en MVP, GPT-4o-mini en producción |

### 10.4. ADRs planificados para próximos sprints

- ADR-005: Chunking 500 tokens / 10% overlap (a formalizar Sprint 1)
- ADR-006: Comunicación PHP↔Python con HMAC + Bearer + nonce (a formalizar Sprint 1)
- ADR-007: React compilado como módulo AMD vía Webpack (a formalizar Sprint 1)
- ADR-008: Plugin tipo `local` con `before_footer()` (a formalizar Sprint 1)

---

*Última actualización: **TODO** — Equipo NexusAI*
