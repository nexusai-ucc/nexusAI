# Acta de cierre — Fase 1: Setup e Investigación

> **Estado:** ✅ COMPLETADA — pendiente firma formal en Sprint Review del 6/May/2026.
>
> Este documento se firma en la reunión de cierre con todo el equipo presente y se
> presenta a Belén Zarazaga (Cátedra de Administración de Proyectos de Software)
> como entregable formal de la fase.

---

## 1. Datos de la fase

| Campo | Valor |
|---|---|
| **Fase** | 1 — Setup e Investigación |
| **Fecha de inicio planificada** | 9 Abr 2026 |
| **Fecha de fin planificada** | 22 Abr 2026 |
| **Fecha de fin real** | 22 Abr 2026 (entregables principales cumplidos en plazo) |
| **Duración planificada** | 14 días corridos |
| **Duración real** | 14 días corridos para los entregables; cierre formal con firmas el 6 May 2026 en Sprint Review (decisión consciente para incluir métricas EVM finales con datos del Sprint 1) |
| **Entregable formal del cronograma** | Entorno + arquitectura |
| **Responsable de la fase** | Equipo NexusAI (PM: Santiago Tricherri) |
| **Acta firmada por** | Santiago Tricherri, Delfina Salinas, Marcos Bugliotti |
| **Fecha de firma** | 6 May 2026 (en Sprint 1 Review) |

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
| **Investigación técnica** | 47 docs en `investigacion/` cubriendo Moodle, RAG, LLMs, pgvector, FastAPI, React, procesamiento docs, estado del arte, relevamiento, setup entorno | ✅ COMPLETADO (sobre-cumplido vs ~20 docs esperados) | [`investigacion/`](../../investigacion/) |
| **Investigación contexto** | Estado del arte (4 plugins Moodle IA + 5 competidores externos), encuesta a docentes diseñada y enviada, reunión con Leandro Juarez realizada | ✅ COMPLETADO (excepto consolidación final de encuesta — Sprint 1) | [`investigacion/08-estado-del-arte/`](../../investigacion/08-estado-del-arte/), [`investigacion/09-relevamiento/`](../../investigacion/09-relevamiento/) |
| **Setup técnico** | Repo en org GitHub `nexusai-ucc`, estructura de carpetas, 3 CI workflows, Docker Compose + scripts dev, 1 Dockerfile multi-stage para backend, Alembic configurado | ✅ COMPLETADO | https://github.com/nexusai-ucc/nexusAI |
| **Documentación arquitectura** | `docs/architecture.md` (377 líneas) + 6 ADRs aceptados + 5 diagramas Mermaid | ✅ COMPLETADO | [`docs/`](../) |
| **Decisiones arquitectónicas formales** | ADR-001 monolito modular · ADR-002 pgvector · ADR-003 multi-provider LLM · ADR-004 Gemini MVP/OpenAI prod · ADR-005 HMAC PHP↔Python · ADR-006 Privacy strategy | ✅ COMPLETADO (6 ADRs vs 4 planificados) | [`docs/adr/`](../adr/) |
| **Primera prueba funcional** | API RAG operativa con vista docente (carga + estado de indexación) y vista alumno (chat) | ✅ COMPLETADO en cierre fase + verificación end-to-end formal en Moodle 4.5 el 4 May 2026 | Verificación documentada en commits `0.1.0-skeleton` → `0.2.1` |
| **Reunión técnico Moodle UCC** | Reunión con Leandro Juarez (docente PI) ✅. Reunión con técnico de Moodle de la facultad ❌ | ⚠️ PARCIAL — la reunión con el técnico de Moodle se traslada a Sprint 2 | a coordinar vía Leandro |
| **Encuesta docentes — resultados** | Encuesta diseñada, corregida con Leandro y enviada para difusión | 🟨 EN CURSO — esperando consolidación de respuestas | a cerrar en Sprint 1 |

### 2.3. Resumen ejecutivo

> La Fase 1 cerró con todos los entregables técnicos completados y un avance
> significativo respecto del plan original. Se sobre-cumplió en investigación
> (47 docs vs. ~20 esperables) y en formalización de decisiones (6 ADRs vs.
> 4 planificados), lo cual generó un leve sobrecosto en horas pero amortizó
> notablemente la velocidad del desarrollo posterior. Los entregables de
> relevamiento de stakeholders quedaron parcialmente abiertos (encuesta sin
> consolidar, reunión con técnico Moodle UCC pendiente) y se trasladan a
> Sprint 1-2 sin impactar el camino crítico al MVP.

---

## 3. Desviaciones respecto al plan

### 3.1. En alcance

| Item | Planificado | Real | Justificación |
|---|---|---|---|
| Investigación técnica | Cobertura básica de stack (~20 docs) | **Sobre-cumplida** — 47 docs detallados | Marcos profundizó en arquitectura del plugin (XMLDB, capabilities, web services), Privacy API, hooks 4.4+; Delfi documentó 3 troubleshootings críticos (Hook API migration, chunks lazy de Webpack, symlinks en Docker) descubiertos al implementar. La inversión en docs amortizó tiempo en Sprint 1 |
| Decisión de base vectorial | ChromaDB (asumida en anteproyecto) | Cambiada a **pgvector sobre PostgreSQL** | Marcos identificó que pgvector permite queries SQL+vector unificadas, una sola DB que operar. Documentado en ADR-002 |
| Modelo LLM | OpenAI GPT-4o-mini fija | **Multi-provider agnóstico** (Gemini Flash MVP gratis, OpenAI prod) | Necesidad de validar con usuarios reales sin gasto en MVP. Documentado en ADR-003 y ADR-004 |
| ADRs adicionales | 4 ADRs | 6 ADRs (+ HMAC PHP↔Python, + Privacy strategy) | La implementación temprana del HMAC requirió formalizar la decisión retroactivamente; la Privacy API exigió decisión formal para el plugin checker de Moodle |
| Reunión técnico Moodle UCC | Cerrada en la fase | **Trasladada a Sprint 2** | No se logró coordinar agenda con el técnico vía Leandro. No bloquea desarrollo MVP |

### 3.2. En tiempo

| Hito | Planificado | Real | Variación |
|---|---|---|---|
| Inicio fase | 9 Abr 2026 | 9 Abr 2026 | 0 días |
| Fin fase (entregables) | 22 Abr 2026 | 22 Abr 2026 | 0 días — en plazo |
| Firma formal del acta | 22 Abr 2026 | 6 May 2026 (Sprint 1 Review) | +14 días — decisión consciente para incluir métricas finales con confianza |

### 3.3. En equipo / capacidad

Sin desviaciones de capacidad. El equipo trabajó full-time durante la fase.
Marcos tuvo carga académica externa concentrada al inicio del Sprint 1
(no de Fase 1), lo cual se gestionó con redistribución de tareas.

---

## 4. Métricas EVM finales

### 4.1. Resumen — Fase 1 (al cierre 22 Abr 2026)

| Métrica | Valor | Detalle |
|---|---|---|
| **PV** (Valor Planificado a la fecha de cierre) | 40 SP | Setup e Investigación según backlog v5 |
| **EV** (Valor Ganado a la fecha de cierre) | 40 SP | 100% de entregables técnicos completados |
| **AC** (Costo Real a la fecha de cierre) | ~52 SP equiv. | Sobre-cumplimiento de docs (47 vs 20 esperables) generó +30% horas |
| **SV** = EV − PV | 0 SP | Cumplió en plazo |
| **CV** = EV − AC | −12 SP | Sobrecosto controlado por inversión consciente en docs |
| **SPI** = EV / PV | **1.00** | En línea con cronograma |
| **CPI** = EV / AC | **0.77** | Sobrecosto del 23% (decisión consciente, ver lecciones aprendidas) |

### 4.2. Resumen — Proyecto acumulado (al 4 May 2026, día 11/14 del Sprint 1)

| Métrica | 13 Abr (mediciones intermedias) | 4 May (cierre Sprint 1 + Fase 1 firmada) |
|---|---|---|
| **PV** (% del BAC = 334 SP MVP) | 8.5% | 26.5% |
| **EV** (% del BAC) | 20.7% | 29.2% |
| **AC** (% del BAC) | 21.8% | 34.4% |
| **SPI** = EV / PV | 2.44 | **1.10** |
| **CPI** = EV / AC | 0.95 | **0.85** |
| Fecha proyectada MVP | 3 May 2026 (irreal) | 28 May 2026 |

### 4.3. Interpretación

> **Cumplimos la Fase 1 en plazo (SPI = 1.00) con sobrecosto del 23% (CPI = 0.77),
> producto de una decisión consciente del equipo de invertir más horas en
> formalización de docs y ADRs.** Este sobrecosto amortizó significativamente
> en el Sprint 1, donde el desarrollo de componentes con investigación profunda
> previa (HMAC, multi-provider LLM, integración React-AMD) se completó más
> rápido de lo estimado.
>
> **Al 4 de mayo, el proyecto acumulado está adelantado** (SPI = 1.10) y con
> sobrecosto leve y controlado (CPI = 0.85). La normalización del SPI inicial
> (2.44) a 1.10 es esperable y deseable: indica que las primeras estimaciones
> eran optimistas, no que el equipo haya bajado el ritmo. Proyectamos llegar
> al MVP el 28 de mayo, 4 días antes de la fecha planificada (1 Jun 2026).

### 4.4. Proyección al MVP

| Métrica | Valor |
|---|---|
| Fecha planificada MVP | 1 Jun 2026 |
| Fecha proyectada MVP (basada en SPI 1.10 al 4 May) | 28 May 2026 |
| Días de adelanto proyectado | 4 días |

---

## 5. Lecciones aprendidas

### 5.1. Qué funcionó bien

- **La documentación técnica externa** (guía PDF de Moodle + investigación previa de RAG) ahorró ~1 semana de investigación desde cero.
- **Decidir tempranamente migrar a pgvector** evitó complejidad de operar 2 DBs en paralelo y permitió queries SQL+vector unificadas.
- **Diseñar arquitectura agnóstica de LLM desde el día 1** desbloqueó MVP gratuito con Gemini y permitió cambiar de modelo (`gemini-2.0-flash` → `gemini-2.5-flash`) sin tocar código durante el debugging del 4 May.
- **Sincronización asincrónica del equipo** (sin daily sync presencial) permitió avance en paralelo sin reuniones excesivas.
- **Repo organizado con `investigacion/` + ADRs** facilita onboarding y defensa al jurado. Cada decisión técnica importante quedó trazada con contexto, alternativas evaluadas y triggers de revisión.
- **Inversión deliberada en formalizar 6 ADRs** (vs 4 planificados) evitó debates repetidos en sprints siguientes y permitió justificar decisiones técnicas no triviales (HMAC 3 capas, Privacy null_provider).

### 5.2. Qué no funcionó / qué cambiaríamos

- **Subestimamos el tiempo de coordinación con stakeholders externos**. La reunión con el técnico de Moodle UCC sigue pendiente al cierre de fase, y la consolidación de la encuesta a docentes se trasladó a Sprint 1.
- **Hubiera sido útil empezar la primera prueba funcional antes** de cerrar toda la documentación. Los problemas de integración descubiertos al implementar (Hook API migration en Moodle 4.4+, chunks lazy de Webpack rotos en Moodle, symlinks no funcionando en Docker, `curlsecurityblockedhosts`) hubieran tenido menos impacto si los hubiéramos detectado durante Fase 1.
- **La encuesta docente debería haber salido la primera semana**, no la segunda — perdimos tiempo de respuesta efectivo.
- **El plan original asumió free tier estable de Gemini 2.0 Flash** sin verificar que la cuenta de prueba tuviera cuota asignada. Resultó que las cuentas nuevas tienen `limit: 0` para 2.0 Flash y solo 2.5 Flash funciona consistente — descubierto el 4 May durante el end-to-end test, costó ~1 hora resolver.
- **Subestimamos los detalles de Docker**: `restart` no relee `.env` (hay que `up -d --force-recreate`), `localhost` desde un container es el container mismo (hay que usar `host.docker.internal`), y el `Dockerfile` debe copiar explícitamente `alembic.ini`. Cada uno fue un tropezón breve pero acumulativo.

### 5.3. Qué cambiamos para los próximos sprints

- **Incluir un smoke test E2E en cada sprint**, no solo al cierre. El end-to-end del 4 May reveló 5+ problemas de integración que valieron la pena descubrir antes del MVP.
- **Coordinar reuniones con stakeholders externos al inicio del sprint**, no al final.
- **Mantener la encuesta docente abierta + difundir activamente cada semana**.
- **Documentar troubleshootings en `investigacion/` apenas se descubren**, no al final del sprint. Ya implementado: los 5 problemas descubiertos hoy quedaron documentados en `investigacion/01-moodle/`, `investigacion/06-frontend-react/`, `investigacion/10-setup-entorno/`.
- **Incorporar práctica cross-functional**: el 4 May Delfi avanzó en backend de Santiago (HMAC, providers LLM/Embeddings, tests pytest) cuando el camino crítico se desbloqueaba con eso. Esto se mantiene como práctica explícita para Sprint 2+.

---

## 6. Riesgos identificados para Sprint 2+

Riesgos que se trasladan a sprints siguientes (priorizados por impacto × probabilidad):

| ID | Riesgo | Probabilidad | Impacto | Mitigación planeada | Dueño |
|---|---|---|---|---|---|
| R1 | Aprobación institucional UCC demora más de 4-6 semanas | Alta | Alto | Plan B = demo Docker local para defensa MVP. Iniciar trámite ya | Marcos / Leandro |
| R2 | Tier gratuito de Gemini insuficiente al escalar piloto | Media | Medio | ADR-004 documenta switch a OpenAI con solo cambio de env vars. Verificado con cambio de modelo el 4 May (5 minutos) | Santiago |
| R3 | Calidad RAG con material real menor a benchmarks estimados | Media | Alto | Dataset de evaluación con 30-50 preguntas reales del PI + dataset propio en Sprint 2 | Santiago |
| R4 | Restricciones de privacidad de Gemini sobre datos de alumnos | Media | Alto | Confirmar términos antes del piloto. Plan B: nomic-embed-text local. ADR-006 documenta estrategia de Privacy API | Marcos |
| R5 | Bundle React + CSP de Moodle: colisiones en producción | Baja | Medio | ✅ Mitigado: smoke test E2E completado en Moodle 4.5 el 4 May. Sin colisiones detectadas | Delfi |
| R6 | Reunión técnico Moodle UCC no se concreta | Media | Medio | Si no avanza en Sprint 2, escalar al PI o usar Plan B (demo Docker) | Marcos / Leandro |
| R7 | Rate limits de Gemini (1.500 req/día) saturan piloto | Baja-Media | Bajo | Queue de requests en FastAPI + monitoring de cuota. Redis ya está en stack para esto | Santiago |
| R8 | Cuentas Google Workspace Education sin acceso a free tier | Baja | Bajo | Documentado el 4 May: usar Gmail personal en MVP. En producción se contrata billing | Santiago / Delfi |

---

## 7. Backlog ajustado

### 7.1. Items que se descubrieron durante la fase y se agregan al backlog

- **Migración de schema 768 → 1536 dim** cuando se pase a producción con OpenAI embeddings (script automatizado) — `chore`, post-MVP, 3 SP, Marcos.
- **Dataset de evaluación RAG** con ground truth generado con Leandro — `task`, Sprint 2, 5 SP, Santiago + Leandro.
- **Investigación de retrieval híbrido** (BM25 + dense) — `feat` post-MVP, 8 SP, Santiago.
- **Acuerdo con UCC IT sobre whitelist de dominio externo** del backend — `task`, Sprint 3, 2 SP, Marcos.
- **ADR-007: Estrategia de chunking** (formalizar 512 tokens / 64 overlap implementado por Marcos) — `task`, Sprint 2, 1 SP, Santiago.
- **Documentación de troubleshooting Gemini free tier** — `chore`, Sprint 2, 1 SP, Delfi.
- **Tests pytest para chunker, extractor, pipeline RAG y modelos ORM** — `task`, Sprint 2, 5 SP, Santiago.

### 7.2. Items que cambian de estimación

| Item | SP original | SP nuevo | Justificación |
|---|---|---|---|
| Bundle React + integración AMD Moodle | 3 SP | 8 SP | Moodle 4.4+ deprecó hooks viejos; chunks lazy de Webpack rotos por `publicPath` no configurado; symlinks no funcionan en Docker |
| Setup entorno desarrollo | 5 SP | 8 SP | Configuración Alembic + alembic.ini en Dockerfile + docker compose recreate sutilezas no anticipadas |

### 7.3. Items que se eliminan del backlog

- **Tareas relacionadas con instalación/operación de ChromaDB** → eliminadas (decisión pgvector documentada en ADR-002).
- **Tareas de configuración CORS** entre browser y FastAPI → eliminadas (patrón Hybrid PHP Proxy elimina la necesidad).
- **Tareas de rotación de modelo OpenAI fijo** → reemplazadas por gestión de `LLMProvider` agnóstico (ADR-003).
- **Issues #148, #149, #251 del Project** → cerradas como obsoletas el 4 May.

---

## 8. Estado del proyecto al cierre de la fase

### 8.1. Qué está funcionando hoy (al 5 Mayo 2026)

- ✅ Repo en GitHub org `nexusai-ucc` con CI configurado (3 workflows defensivos).
- ✅ Moodle 4.5 corriendo en `moodle-docker` con plugin `local_nexusai` v0.2.1 instalado y verificado.
- ✅ Backend FastAPI con autenticación HMAC SHA-256 (3 capas: Bearer + firma + nonce Redis).
- ✅ Base de datos PostgreSQL + pgvector con 4 tablas migradas vía Alembic (`documents`, `chunks`, `chat_sessions`, `messages`).
- ✅ Pipeline RAG implementado: pdfplumber → chunker (512 tokens / 64 overlap) → embeddings → pgvector.
- ✅ Chat end-to-end funcionando: React → Moodle PHP → FastAPI → Gemini 2.5 Flash → respuesta contextualizada con historial.
- ✅ 6 ADRs aceptados y publicados en el repo.
- ✅ 47 docs de investigación validados por el equipo, incluyendo 4 troubleshootings descubiertos durante el smoke test E2E.
- ✅ 18 tests pytest pasando (HMAC verification + LLM/Embedding providers).

### 8.2. Qué arranca en Sprint 1 (cierre 6 May 2026)

- ✅ Plugin Moodle base completo (Marcos + Delfi).
- ✅ Backend FastAPI estructurado modularmente con 22 archivos Python (Santiago + Delfi).
- ✅ Bundle React mínimo embebido con UI completa de chat (Delfi).
- ✅ Smoke test E2E con HMAC + Gemini 2.5 Flash funcionando (verificado 4 May).
- 🟨 Cierre de items pendientes de relevamiento (encuesta consolidada — esta semana).
- ❌ Wireframes de vista alumno + docente (única tarea técnica pendiente del Sprint 1).

### 8.3. Camino al MVP (1 Jun 2026)

```
Sprint 1 (23 Abr - 6 May):  Plugin base + API estructurada + React mínimo
                            ✅ 95% completado (falta solo wireframes)
Sprint 2 (7 May - 20 May):  RAG completo + chat E2E con streaming SSE
                            🟨 70% adelantado (falta retrieval semántico + endpoint upload PDF + vista docente)
Sprint 3 (21 May - 27 May): Integración Moodle + vista docente + indexación
                            🟨 30% adelantado (sandbox + responsive + manejo errores ya hechos)
Sprint 4 (28 May - 1 Jun):  MVP — pulido, fixes, demo lista
```

**Estado actual:** **adelantado** respecto a este camino. Proyectamos cierre del MVP el 28 Mayo (4 días antes de fecha planificada).

---

## 9. Aprobación de cierre

> Este documento se firma en la reunión de cierre de fase, con todo el equipo presente.
> La firma confirma que cada miembro está de acuerdo con el estado documentado y los items trasladados a Sprint 1+.

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Project Manager / AI-Backend | Santiago Tricherri | _________________ | 6 May 2026 |
| Scrum Master / AI-Frontend | Delfina Salinas | _________________ | 6 May 2026 |
| DB / Integración | Marcos Bugliotti | _________________ | 6 May 2026 |
| Docente PI (testigo, opcional) | Leandro Juarez | _________________ | 6 May 2026 |

---

## 10. Anexos

### 10.1. Enlaces relevantes

- **Repo:** https://github.com/nexusai-ucc/nexusAI
- **Backlog + Gantt:** https://github.com/users/delfisalinasmich/projects/5
- **Investigación completa:** [`investigacion/`](../../investigacion/) (47 docs)
- **ADRs aceptados:** [`docs/adr/`](../adr/) (6 ADRs)
- **Síntesis arquitectura:** [`docs/architecture.md`](../architecture.md)
- **Diagramas:** [`docs/diagrams/`](../diagrams/) (5 diagramas Mermaid)
- **Presentación de avances:** [`docs/presentaciones/avances-2026-05-04.html`](../presentaciones/avances-2026-05-04.html)

### 10.2. Documentos generados durante la fase

- `README.md` raíz, `LICENSE` (MIT), `CONTRIBUTING.md`, `.gitignore`
- `docs/architecture.md` — síntesis con diagramas
- `docs/adr/001` a `docs/adr/006` — decisiones formales (incluye HMAC y Privacy)
- `docs/diagrams/` — 5 diagramas Mermaid
- `docker-compose.yml` raíz + scripts de init Postgres + `dev.sh` helper
- `.github/workflows/` — 3 pipelines CI (backend, frontend, moodle)
- `.github/PULL_REQUEST_TEMPLATE.md` + 3 issue templates + `CODEOWNERS`
- 47 docs en `investigacion/` (incluye 4 troubleshootings descubiertos en smoke test E2E del 4 May)

### 10.3. Decisiones de arquitectura cerradas durante esta fase

| ADR | Decisión | Fecha |
|---|---|---|
| [ADR-001](../adr/001-monolito-modular.md) | Backend Python como monolito modular (no microservicios) | 2 May 2026 |
| [ADR-002](../adr/002-pgvector.md) | pgvector sobre PostgreSQL como única base de datos | 2 May 2026 |
| [ADR-003](../adr/003-multi-provider-llm.md) | Arquitectura agnóstica de proveedor LLM | 2 May 2026 |
| [ADR-004](../adr/004-gemini-mvp-openai-prod.md) | Gemini Flash en MVP, OpenAI en producción | 2 May 2026 |
| [ADR-005](../adr/005-hmac-php-python.md) | Autenticación PHP↔Python con HMAC SHA-256 en 3 capas | 4 May 2026 |
| [ADR-006](../adr/006-privacy-strategy.md) | Privacy API: null_provider en MVP, migración planificada a metadata\\provider | 4 May 2026 |

### 10.4. ADRs planificados para próximos sprints

- ADR-007: Estrategia de chunking 512 tokens / 64 overlap (a formalizar Sprint 2 — Marcos ya implementó, falta documentar la decisión).
- ADR-008: React compilado como módulo AMD vía Webpack con bundle único sin chunks lazy (a formalizar Sprint 2 — implementado, falta formalizar la decisión y los troubleshootings descubiertos).
- ADR-009: Plugin tipo `local` con Hook API nuevo de Moodle 4.4+ y callback legacy para 4.1-4.3 (a formalizar Sprint 2).

---

*Última actualización: 5 Mayo 2026 — Equipo NexusAI*
