# NexusAI — Avances (check-in 06/08/2026)

## Resumen ejecutivo

Terminamos el roadmap post-MVP completo que teníamos planeado — las 7 épicas
originales (asistente, buscador, study planner, herramientas docentes,
calendario, foros con IA, integración Moodle) están implementadas y
mergeadas a `main`, y **Post-MVP Sprint C quedó 100% cerrado (9/9)** tras
resolver dos bugs de mobile encontrados en una auditoría de código. Con el
roadmap cerrado, nos pusimos a pensar qué sigue: armamos 17 issues nuevas
(Sprint D) con foco en confiabilidad, privacidad, calidad y publicación
oficial del plugin. También poblamos un curso de demo completo, actualizamos
el informe IPI y el README (que tenía dos copias desactualizadas de forma
independiente), y la cuenta de Oracle Cloud para el deploy propio ya está
creada — con un plan técnico en revisión que encontró dos correcciones
necesarias antes de crear la VM.

## 1. Las 7 épicas del roadmap original — completas

| Épica | Alcance | Estado |
|---|---|---|
| Asistente Académico | Chat RAG con citas, streaming, multi-curso | ✅ |
| Buscador y Resumen | Búsqueda semántica, resumen por documento, resumen pre-parcial | ✅ |
| Study Planner | Quiz (5 tipos de pregunta), historial, plan de estudio personalizado | ✅ |
| Herramientas Docentes | Analytics, FAQ agrupadas, generador de exámenes + export GIFT, gaps | ✅ |
| Calendario y Notificaciones | Vista de calendario, alertas configurables, aviso de material nuevo | ✅ |
| Foros con IA | Detección de duplicados, resumen de hilo, sugerencia de respuesta | ✅ |
| Integración Moodle | Plugin instalable, indexación multi-formato | ✅ código / 🚧 deploy propio |

## 2. Post-MVP Sprint C: cerrado 100% (9/9)

Además de bookkeeping atrasado (ver punto 3), esta semana se resolvieron las
últimas 2 issues del sprint, encontradas por Santiago en una auditoría de
código mobile:

- **UX-03** — la tabla de documentos del panel docente no scrolleaba en
  viewports angostos (`overflow: hidden` en vez de `overflow-x: auto`).
- **UX-04** — los botones del header del chat tenían un área táctil de
  ~27px, por debajo del mínimo recomendado (44px, Apple HIG / Material
  Design).

Ambos fixes verificados con pruebas automatizadas en 320/375/414px sobre el
curso de demo real, no solo revisados a ojo.

## 3. Bookkeeping: issues que ya estaban listas y no se habían cerrado

Al revisar el tracker encontramos 3 issues marcadas como abiertas pero cuyo
código ya estaba mergeado hace más de una semana:

- **BUS-03** (resumen automático de PDF) — PR #279, mergeado 30/07.
- **CAL-02** (alertas configurables) — PR #299, mergeado 30/07.
- **ANALYTICS-01** (dashboard backend de métricas) — PR #302, mergeado 30/07.

## 4. Con el roadmap cerrado, pensamos qué sigue: Sprint D (17 issues nuevas)

| Frente | Issues |
|---|---|
| Confiabilidad de IA | Fallback automático Gemini↔OpenAI, cache de respuestas repetidas |
| Privacidad real | Exportar/eliminar datos personales del backend (más allá de lo que exige Moodle) |
| Calidad/testing | Tests de frontend (Vitest, hoy en cero), ampliar PHPUnit del plugin |
| Publicación oficial | Enviar el plugin al directorio de Moodle.org (el CI ya cumple los checks) |
| Seguridad | Auditoría OWASP + dependency scanning en CI |
| Mejoras a lo existente | Calendario (eventos genéricos), subida multi-archivo, feedback 👍/👎 en el chat, dificultad adaptativa de quiz, descartar un tema puntual del plan de estudio |
| Features nuevas | Voz en el chat, repetición espaciada para flashcards, export de Analytics a PDF |
| Deploy | Self-hosted en Oracle Cloud (reemplaza el plan de servidor UCC, descartado) |

## 5. Evidencia tangible: curso de demo completo

Se pobló un curso "Sistemas Inteligentes" con 6 unidades de material real,
6 alumnos, ~55 mensajes de chat variados (respondibles, de síntesis, y
deliberadamente fuera de tema para generar gaps reales), 21 intentos de
quiz, un foro con 3 discusiones reales. **Todas** las funcionalidades de
IA se probaron en vivo sobre esos datos: chat, buscador, foro (los 3
features de IA), generador de exámenes con export a GIFT, y los 4 paneles
del docente (Analytics, Gaps, FAQ, Generador de exámenes).

## 6. Estado del informe (IPI) y del README

- Resumen, Alcance funcional y Conclusión actualizados para reflejar el
  alcance post-MVP real (ya no describen el sistema como si fuera solo el
  MVP de junio).
- Marco Teórico: nueva sección "Tecnologías investigadas" (comparativa de
  bases vectoriales, proveedores de LLM, arquitecturas de plugin Moodle,
  extracción de documentos).
- **PI-04** (propuesta de solución formal) está redactada casi al 100% —
  el único bloque pendiente real depende de `TEST-01`/`TEST-02` (pruebas
  con usuarios reales, todavía no arrancaron).
- **PI-05** (Check 2, informe parcial) vence el 3/11 — todavía en tiempo.
- Se encontraron y corrigieron **dos copias independientes y desactualizadas
  del README** (una en la raíz del repo, otra dentro de `NexusAI/`) — ambas
  describían el proyecto como si siguiera en Sprint 1, con stack
  desactualizado (ChromaDB en vez de pgvector) y datos de equipo
  incompletos. Las dos quedaron corregidas y consistentes entre sí.

## 7. Deploy: cuenta creada, plan técnico en revisión

Se descartó definitivamente la opción de un servidor de UCC. La cuenta de
Oracle Cloud (tier "Always Free") **ya está creada** — tras un error
genérico del propio signup de Oracle (bug ampliamente reportado por otros
usuarios, no algo nuestro) que se resolvió sin necesidad de soporte.

Un compañero del equipo armó un plan técnico detallado de la arquitectura
de deploy (una VM Ampere A1 con Postgres+pgvector, Redis, API y Moodle,
reverse proxy con Caddy para TLS automático). Al revisarlo contra el
código real del repo, se confirmó que la mayor parte es sólida — pero
aparecieron dos correcciones necesarias antes de crear la VM:

1. **Región**: el plan asume "Chile Central", pero la cuenta ya creada
   tiene fijada como región de origen **Frankfurt** (elegida a propósito
   por mejor disponibilidad real de Ampere A1) — la región de origen es
   permanente en Oracle, así que hay que confirmar cuál quedó realmente
   antes de aprovisionar nada.
2. **Tamaño de VM**: el plan asume 4 OCPU/24GB de cupo gratuito, pero
   Oracle lo redujo a la mitad (2 OCPU/12GB) el 15/06/2026 sin aviso
   público — no invalida el enfoque de una sola VM, pero hay que ajustar
   la expectativa de recursos disponibles.

## 8. Lo que queda genuinamente pendiente

- **TEST-01/TEST-02** (pruebas con usuarios reales) — es el bloqueo real
  detrás de PI-04 y parte de PI-01. Vale la pena preguntarle a los tutores
  si hay margen de fecha o si conviene arrancarlo ya en paralelo. Ya
  apareció una rama (`docs/264-265-test-01-test-02-plan-pruebas`) — parece
  que el equipo ya está arrancando con esto.
- **PI-06/PI-07** — preparación de defensa, recién para febrero, no urgente.
- **Sprint D completo** — recién arrancado, 17 issues, vence 14/12.
- **Deploy en Oracle Cloud** — cuenta lista, plan técnico casi aprobado
  (2 correcciones pendientes de confirmar), falta provisionar la VM.
