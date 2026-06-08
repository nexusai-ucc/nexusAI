# Análisis de riesgos

## Metodología

Cada riesgo identificado se evalúa con dos dimensiones:

- **Probabilidad** — Baja (1), Media (2), Alta (3).
- **Impacto** — Bajo (1), Medio (2), Alto (3).

La **severidad** es el producto Probabilidad × Impacto, en rango 1-9. Riesgos
con severidad ≥ 6 requieren plan de mitigación activo; los de severidad 3-5
se monitorean; los de severidad < 3 se aceptan.

Los riesgos se agrupan en cuatro categorías: técnicos, de equipo, externos y
legales/éticos.

## Matriz de riesgos

| ID | Riesgo | Categoría | Prob | Imp | Sev | Mitigación |
|---|---|---|---|---|---|---|
| R-01 | Cambio en políticas o pricing de Gemini API | Externo | M | A | 6 | Multi-provider (ADR-003), switch a OpenAI con cambio de `.env` |
| R-02 | Moodle 5.x rompe compatibilidad del plugin | Técnico | M | M | 4 | Matrix CI con 4.1-4.5, monitoreo de changelog y Hooks API |
| R-03 | pgvector deja de escalar con muchos cursos | Técnico | B | A | 3 | HNSW + índice por `course_id`, particionado posterior si hace falta |
| R-04 | Rotación / baja de un integrante del equipo (50%) | Equipo | M | A | 6 | Documentación exhaustiva, ADRs, pair programming, commits atómicos |
| R-05 | Filtración de material académico privado por bug | Legal | B | A | 3 | Capabilities checks, Privacy API, HMAC server-to-server, tests de aislamiento |
| R-06 | Backend Railway free tier insuficiente para la demo | Externo | M | M | 4 | Plan B: VPS Hetzner ~€4/mes. Plan C: Oracle Always Free |
| R-07 | LLM alucina respuestas sin reconocer falta de material | Técnico | M | A | 6 | System prompt instruye decir "no encontré" + detección de gaps (Feature G) refuerza |
| R-08 | Costo de OpenAI en producción excede presupuesto | Externo | B | M | 2 | Estimación: $100/mes para 500 alumnos. Multi-provider permite retroceder a Gemini |
| R-09 | Plugin Moodle Plugin Directory rechaza la submission | Externo | M | B | 2 | CI con `moodle-plugin-ci`, revisión previa contra checklist oficial |
| R-10 | Pérdida de datos por falta de backups en backend | Técnico | B | A | 3 | Backups automáticos de Postgres en Railway, retención mínima 7 días |
| R-11 | Equipo no llega a deployar Moodle público para defensa | Cronograma | M | M | 4 | Plan A: Student Pack DO. Plan B: Oracle Always Free. Demo local backup |
| R-12 | Compatibilidad navegador (widget no renderiza en Safari/Firefox viejo) | Técnico | B | M | 2 | Build con polyfills, testing manual en navegadores principales |

## Plan detallado de los riesgos críticos (severidad ≥ 6)

### R-01 — Cambio en políticas de Gemini API

**Contexto:** Gemini es nuestro LLM en MVP y permite costo cero. Si Google
cambia el modelo gratuito, sube precios o deprecía la API OpenAI-compatible,
la viabilidad del MVP se afecta.

**Indicadores tempranos:**

- Anuncios en `https://ai.google.dev/`.
- Mensajes de `Deprecation` en respuestas de la API.
- Cambios en rate limits del tier gratuito.

**Mitigación:**

- **Arquitectura multi-provider (ADR-003)** absorbe el cambio sin tocar
  código: solo se actualiza `.env` para apuntar al backend de OpenAI / Groq
  / Ollama.
- **Embeddings con `gemini-embedding-001` (768 dim)** — la migración a
  OpenAI `text-embedding-3-small` (1.536 dim) requiere re-indexación. Tener
  el script de migración listo y testeado antes del switch.
- **Monitoreo de costos** en `app/admin/usage` para detectar uso anómalo.

**Responsable:** Santiago.

### R-04 — Rotación / baja de un integrante

**Contexto:** El equipo son 2 personas (Santiago + Delfina). Si uno se
enferma o se ausenta, se pierde el 50% del staff. En un proyecto de tesis
con plazo fijo, esto es un riesgo concreto.

**Mitigación:**

- **Documentación exhaustiva** — esta entrega de 80 páginas es la mitigación
  formal. Los ADRs, el README, los manuales y la doc de cada capa permiten
  que cualquier desarrollador retome el proyecto en ~1 semana.
- **Pair programming en componentes críticos** (HMAC, pipeline RAG, Hook API
  de Moodle) — al menos dos personas conocen cada parte.
- **Commits atómicos con mensajes descriptivos** — historia git navegable.
- **Issues con criterios de aceptación claros** — work-items son retomables
  por otro integrante sin contexto adicional.

**Responsable:** ambos integrantes, mutuamente.

### R-07 — LLM alucina respuestas

**Contexto:** Si el LLM responde con seguridad cosas que el material no
respalda, se rompe la promesa de "RAG auténtico" que vende el proyecto. Es
el riesgo más reputacional.

**Mitigación:**

- **System prompt explícito**: el LLM recibe instrucciones de citar el
  archivo fuente y decir "no encontré información en el material" cuando no
  puede responder. Refinado en Sprint 4 para evitar el bug "follow-the-example"
  (el LLM copiaba el filename del ejemplo en el prompt).
- **Citas clickeables (Feature D)** muestran al alumno qué fragmento usó el
  LLM. Trazabilidad = confianza.
- **Detección de gaps (Feature G)** registra automáticamente cuando el
  retrieval no encontró nada o cuando el LLM admite que no puede responder.
  Esto da feedback al docente y al equipo.
- **Threshold de similaridad** en el retriever (0.3 en chat, 0.25 en
  buscador, 0.4 mínimo para quiz dirigido) filtra fragmentos irrelevantes.

**Responsable:** Delfina.

## Riesgos aceptados sin plan activo

| ID | Riesgo | Por qué se acepta |
|---|---|---|
| R-08 | OpenAI excede presupuesto | El gasto se mide y se puede retroceder a Gemini si el costo supera $100/mes |
| R-12 | Compat navegadores viejos | Testing manual en Chrome/Safari/Firefox cubre 95% del uso esperado |


