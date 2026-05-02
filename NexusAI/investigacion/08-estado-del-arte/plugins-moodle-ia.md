# Plugins Moodle con IA — análisis comparativo

> **Resumen:** El ecosistema de plugins IA en Moodle está fragmentado. Casi ninguno implementa RAG auténtico sobre el material del curso. Esto es el vacío que NexusAI llena y es el diferenciador principal para la defensa ante el jurado.

---

## Contexto

Antes de decir "NexusAI es novedoso" tenemos que demostrar **qué existe y qué le falta**. Esta comparativa es la base de la slide de diferenciación.

## Plugins evaluados

### 1. `block_openai_chat` (Bryce Yoder)

- **Tipo:** block
- **Popularidad:** el más descargado.
- **Cómo funciona:** chat con OpenAI en el sidebar. Permite un campo **"Source of Truth"** donde el docente pega texto manualmente como contexto.
- **Integrado con subsistema IA nativo** de Moodle 4.5+.
- **Limitación clave:** **no hay RAG real**. Si el docente quiere que el bot sepa de 200 páginas de apuntes, tiene que pegar las 200 páginas como texto.
- **Diferencia con NexusAI:** NexusAI indexa automáticamente todos los PDFs del curso y hace retrieval semántico. Sin trabajo manual del docente.

### 2. `block_ai_chat` + `local_ai_manager` (BYCS)

- **Tipo:** block + local manager
- **Arquitectura:** modular, con subplugins para diferentes proveedores (OpenAI, Azure, Anthropic).
- **Multi-tenant:** soporta múltiples instituciones con configuración por tenant.
- **No compatible con el subsistema IA nativo** de Moodle 4.5.
- **Limitación:** igual que block_openai_chat, **sin RAG sobre material del curso**.
- **Diferencia con NexusAI:** la arquitectura modular es inspiradora, pero nosotros apostamos a RAG profundo en lugar de multi-proveedor.

### 3. `block_terusrag`

- **Tipo:** block
- **Único:** de los pocos plugins Moodle que **implementa RAG real** para contenido de cursos.
- **Limitación:** tiene problemas reportados con la calidad de las respuestas (issues abiertos en GitHub).
- **Diferencia con NexusAI:** mismo approach conceptual. Diferencial: nosotros cuidamos más el chunking, usamos ChromaDB + text-embedding-3-small (modelos actuales) y tenemos fallback honesto explícito.

### 4. `local_ai_course_assistant` (Saylor/SOLA)

- **Tipo:** local
- **El más completo:** widget flotante con **streaming SSE**, multi-proveedor, modo socrático, cumplimiento **GDPR/SOC2**.
- **Excelente referencia arquitectónica** — es el plugin más parecido a NexusAI en concepción.
- **Diferencia con NexusAI:** público objetivo distinto (instituciones globales vs. UCC). NexusAI va más profundo en RAG específico por materia y tiene **Study Planner, analytics docente, generación de evaluaciones** como roadmap post-MVP — eso no lo tiene `local_ai_course_assistant`.

## Subsistema IA nativo de Moodle 4.5+ — ¿lo usamos?

Moodle 4.5 introdujo un subsistema IA con arquitectura **Placement → Manager → Provider**:

- **Placements** definen la UI.
- **Providers** conectan con APIs externas.
- **Manager** media entre ambos.
- Incluye rate limiting, logging, y aceptación de políticas de IA automáticos.

**Limitación clave:** solo soporta tres acciones — `generate_text`, `generate_image`, `summarise_text`. **No hay una acción nativa de "chat" o "conversación"**.

**Decisión NexusAI:** construir plugin **standalone** (no depender del subsistema IA) porque:

1. Necesitamos chat con historial — no hay acción nativa para eso.
2. RAG custom con ChromaDB — el subsistema no lo soporta.
3. Compatibilidad Moodle 4.1 — el subsistema IA no existe pre-4.5.

Post-MVP, evaluamos exponer un **Provider custom** que encapsule nuestro backend, para que otras partes de Moodle (ej. summarise de actividades) puedan usarlo.

## Tabla comparativa

| Feature | block_openai_chat | block_ai_chat | block_terusrag | local_ai_course_assistant | **NexusAI** |
|---|---|---|---|---|---|
| **RAG auténtico sobre PDFs del curso** | ❌ | ❌ | ⚠ (con bugs) | ⚠ parcial | ✅ |
| Chat con historial | ✅ | ✅ | ✅ | ✅ | ✅ |
| Streaming SSE | ⚠ | ⚠ | ❌ | ✅ | ✅ |
| Widget flotante (todas las páginas) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Indexación automática de material | ❌ | ❌ | ✅ | ⚠ manual | ✅ |
| **Study Planner / quizzes IA** | ❌ | ❌ | ❌ | ❌ | ✅ post-MVP |
| **Analytics docente** | ❌ | ❌ | ❌ | ❌ | ✅ post-MVP |
| Fallback honesto | ❌ | ❌ | ❌ | ⚠ | ✅ |
| Open source | ✅ | ✅ | ✅ | ✅ | ✅ |
| Integración subsistema IA 4.5 | ✅ | ❌ | ❌ | ❌ | ❌ (por ahora) |

## Ecosistema más amplio — asistentes académicos no-Moodle

| Producto | Qué hace | Diferencia con NexusAI |
|---|---|---|
| **Khanmigo** (Khan Academy) | Tutor AI para alumnos de K-12. | No integra con Moodle. No responde sobre material del docente — usa el de Khan. |
| **Coursera Coach** | Asistente dentro de cursos Coursera. | Cerrado, solo en Coursera. |
| **NotebookLM** (Google) | Q&A sobre docs que vos subís. | Fuera de LMS. El alumno tiene que subir los docs — no pasa automáticamente por el curso. |
| **Microsoft Copilot for Education** | Suite de productividad con IA. | Office-céntrico. No integración Moodle nativa. |

**Nadie combina:** `(integración Moodle nativa) + (RAG automático sobre material del curso) + (herramientas docente) + (open source)`.

## Riesgos competitivos

- **Moodle HQ podría madurar el subsistema IA nativo** y agregar acción "chat". Mitigación: nuestro diferencial va más allá del chat — Study Planner, analytics, foros IA.
- **block_terusrag podría resolver sus bugs.** Mitigación: NexusAI tiene roadmap más amplio.
- **ChatGPT Edu o similar podría hacer integración Moodle.** Mitigación: se apunta a contexto institucional cerrado y auto-hostable.

## Decisiones tomadas para NexusAI

- **Diferenciador principal para la defensa:** "RAG auténtico sobre material real del curso + herramientas docente integradas, open source".
- **No dependemos del subsistema IA 4.5** — compatibilidad amplia 4.1-4.5 es más importante.
- **Referencia arquitectónica:** `local_ai_course_assistant`. Lo estudiamos para evitar reinventar.

## Abierto / pendiente

- [ ] Clonar los 4 plugins en el Moodle Docker local y probarlos (Sprint 1).
- [ ] Screenshots comparativos de cada uno para la slide del jurado.
- [ ] Monitorear releases del subsistema IA nativo — si agregan acción chat, re-evaluar estrategia.

## Referencias

- [block_openai_chat](https://moodle.org/plugins/block_openai_chat)
- [block_ai_chat + local_ai_manager (BYCS)](https://github.com/mebis-lp/moodle-block_ai_chat)
- [block_terusrag](https://moodle.org/plugins/block_terusrag)
- [local_ai_course_assistant (Saylor)](https://github.com/Saylor-OER/moodle-local_ai_course_assistant)
- [Moodle 4.5 — AI Subsystem](https://moodledev.io/docs/5.0/apis/subsystems/ai)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
