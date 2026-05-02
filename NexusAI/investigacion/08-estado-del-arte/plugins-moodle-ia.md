# Plugins Moodle con IA — análisis comparativo

Resumen: El ecosistema de plugins IA en Moodle está fragmentado. Casi ninguno implementa RAG auténtico sobre el material del curso. Esto es el vacío que NexusAI llena y es el diferenciador principal para la defensa ante el jurado.

## Contexto

Antes de decir "NexusAI es novedoso" tenemos que demostrar qué existe y qué le falta. Esta comparativa es la base de la slide de diferenciación.

## Plugins evaluados

### 1. block_openai_chat (Bryce Yoder)

- **Tipo:** block
- **Popularidad:** el más descargado del directorio de Moodle.
- **Cómo funciona:** chat con OpenAI en el sidebar. Permite un campo "Source of Truth" donde el docente pega texto manualmente como contexto.
- Integrado con el subsistema IA nativo de Moodle 4.5+.
- **Limitación clave:** no hay RAG real. Si el docente quiere que el bot sepa de 200 páginas de apuntes, tiene que pegar las 200 páginas como texto manualmente.
- **Diferencia con NexusAI:** NexusAI indexa automáticamente todos los PDFs del curso y hace retrieval semántico. Sin trabajo manual del docente.

### 2. block_ai_chat + local_ai_manager (BYCS)

- **Tipo:** block + local manager
- **Arquitectura:** modular, con subplugins para diferentes proveedores (OpenAI, Azure, Anthropic).
- Multi-tenant: soporta múltiples instituciones con configuración por tenant.
- No compatible con el subsistema IA nativo de Moodle 4.5.
- **Limitación:** igual que block_openai_chat, sin RAG sobre material del curso. Es un chatbot genérico conectado a un LLM.
- **Diferencia con NexusAI:** la arquitectura modular es inspiradora, pero NexusAI apuesta a RAG profundo sobre los materiales reales en lugar de multi-proveedor como diferencial.

### 3. block_terusrag

- **Tipo:** block
- **Único:** de los pocos plugins Moodle que implementa RAG real para contenido de cursos.
- **Limitación:** tiene problemas reportados con la calidad de las respuestas (issues abiertos en GitHub). La implementación del pipeline RAG tiene deficiencias en chunking y retrieval.
- **Diferencia con NexusAI:** mismo approach conceptual. Diferencial: NexusAI cuida más el chunking, usa pgvector sobre PostgreSQL con índice HNSW, modelos de embeddings actuales, y tiene fallback honesto explícito cuando no hay información en el material.

### 4. local_ai_course_assistant (Saylor/SOLA)

- **Tipo:** local
- **El más completo:** widget flotante con streaming SSE, multi-proveedor, modo socrático, cumplimiento GDPR/SOC2.
- Excelente referencia arquitectónica — es el plugin más parecido a NexusAI en concepción.
- **Diferencia con NexusAI:** público objetivo distinto (instituciones globales vs. contexto universitario argentino). NexusAI va más profundo en RAG específico por materia y tiene Study Planner, analytics docente, y generación de evaluaciones como roadmap post-MVP — funcionalidades que local_ai_course_assistant no contempla.

## Subsistema IA nativo de Moodle 4.5+ — ¿lo usamos?

Moodle 4.5 introdujo un subsistema IA con arquitectura Placement → Manager → Provider:

- **Placements** definen la UI donde aparece la IA.
- **Providers** conectan con APIs externas.
- **Manager** media entre ambos, gestionando rate limiting, logging y aceptación de políticas.

**Limitación clave:** solo soporta tres acciones — `generate_text`, `generate_image`, `summarise_text`. No hay una acción nativa de "chat" o "conversación con historial".

**Decisión NexusAI:** construir plugin standalone (no depender del subsistema IA) porque:

- Necesitamos chat con historial — no hay acción nativa para eso.
- RAG custom con pgvector — el subsistema no lo soporta.
- Compatibilidad Moodle 4.1–4.5 — el subsistema IA no existe pre-4.5.

Post-MVP, evaluamos exponer un Provider custom que encapsule nuestro backend, para que otras partes de Moodle (ej. summarise de actividades) puedan usarlo.

## Tabla comparativa

| Feature | block_openai_chat | block_ai_chat | block_terusrag | local_ai_course_assistant | NexusAI |
|---|---|---|---|---|---|
| RAG auténtico sobre PDFs del curso | ❌ | ❌ | ⚠ (con bugs) | ⚠ parcial | ✅ |
| RAG self-hosted (datos en la institución) | ❌ | ❌ | ❌ | ⚠ | ✅ |
| Chat con historial | ✅ | ✅ | ✅ | ✅ | ✅ |
| Streaming SSE | ⚠ | ⚠ | ❌ | ✅ | ✅ |
| Widget flotante (todas las páginas) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Indexación automática de material | ❌ | ❌ | ✅ | ⚠ manual | ✅ |
| Study Planner / quizzes IA | ❌ | ❌ | ❌ | ❌ | ✅ post-MVP |
| Analytics docente | ❌ | ❌ | ❌ | ❌ | ✅ post-MVP |
| Fallback honesto | ❌ | ❌ | ❌ | ⚠ | ✅ |
| Open source | ✅ | ✅ | ✅ | ✅ | ✅ |
| Integración subsistema IA 4.5 | ✅ | ❌ | ❌ | ❌ | ❌ (por ahora) |
| Agnóstico de proveedor LLM | ❌ | ✅ | ❌ | ✅ | ✅ |

## Ecosistema más amplio — asistentes académicos no-Moodle

| Producto | Qué hace | Diferencia con NexusAI |
|---|---|---|
| Khanmigo (Khan Academy) | Tutor AI para alumnos de K-12. | No integra con Moodle. Responde sobre contenido de Khan, no del docente. |
| Coursera Coach | Asistente dentro de cursos Coursera. | Cerrado, solo en Coursera. |
| NotebookLM (Google) | Q&A sobre docs que vos subís. | Fuera del LMS. El alumno sube los docs manualmente — no se integra con el curso. |
| Microsoft Copilot for Education | Suite de productividad con IA. | Office-céntrico. Sin integración Moodle nativa. |
| ChatGPT Edu | ChatGPT institucional. | Sin integración Moodle nativa. Sin RAG sobre material del docente. Sin analytics. |

**Nadie combina:** integración Moodle nativa + RAG automático sobre material del curso + datos self-hosted en la institución + herramientas docente + open source.

## Riesgos competitivos

- **Moodle HQ podría madurar el subsistema IA nativo** y agregar acción "chat". Mitigación: nuestro diferencial va más allá del chat — Study Planner, analytics, foros IA.
- **block_terusrag podría resolver sus bugs.** Mitigación: NexusAI tiene roadmap más amplio y arquitectura más sólida (pgvector + pipeline RAG propio).
- **ChatGPT Edu o similar podría hacer integración Moodle.** Mitigación: el diferencial de NexusAI es el control institucional de los datos (self-hosted) — algo que un SaaS externo no puede ofrecer.

## Decisiones tomadas para NexusAI

- **Diferenciador principal para la defensa:** "RAG auténtico sobre material real del curso, self-hosted, open source, con herramientas docente integradas."
- No dependemos del subsistema IA 4.5 — compatibilidad amplia 4.1–4.5 es más importante.
- **Referencia arquitectónica:** local_ai_course_assistant. Lo estudiamos para evitar reinventar.
- El almacenamiento vectorial usa **pgvector sobre PostgreSQL** — no ChromaDB ni ninguna base vectorial externa. Los datos del RAG nunca salen del servidor de la institución.

## Abierto / pendiente

- [ ] Clonar los 4 plugins en el Moodle Docker local y probarlos (Sprint 1).
- [ ] Screenshots comparativos de cada uno para la slide del jurado.
- [ ] Monitorear releases del subsistema IA nativo — si agregan acción chat, re-evaluar estrategia.

## Referencias

- [block_openai_chat](https://moodle.org/plugins/block_openai_chat)
- [block_ai_chat + local_ai_manager (BYCS)](https://moodle.org/plugins/block_ai_chat)
- [block_terusrag](https://github.com/terus-moodle/block_terusrag)
- [local_ai_course_assistant (Saylor)](https://github.com/saylordotorg/moodle-local_ai_course_assistant)
- [Moodle 4.5 — AI Subsystem](https://moodledev.io/docs/apis/subsystems/ai)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
