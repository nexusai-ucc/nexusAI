# Conclusiones

## Logros vs objetivos

| Objetivo planteado al inicio | Resultado al cierre del MVP | Estado |
|---|---|---|
| Plugin Moodle funcional con asistente IA | Plugin v0.9.x con 7 features deployables | ✅ Cumplido |
| RAG auténtico sobre el material del curso | pgvector + HNSW + chunking de 512 tokens + citas trazables | ✅ Cumplido |
| Multi-provider LLM configurable | Abstracción `LLMProvider` / `EmbeddingProvider` con switch por `.env` | ✅ Cumplido |
| Self-hosted con datos en infra de la institución | Patrón Hybrid PHP Proxy, HMAC server-to-server, sin SaaS obligatorios | ✅ Cumplido |
| Deployable en cualquier Moodle 4.x | ZIP en GitHub Release público + instrucciones documentadas | ✅ Cumplido |
| Streaming token-por-token | Server-Sent Events end-to-end con primer token en ~1s | ✅ Cumplido |
| Quiz generator a partir del material | Feature F con shuffle de opciones y graceful degradation | ✅ Cumplido |
| Detección de gaps del docente | Feature G con señal combinada (retrieval + respuesta del LLM) | ✅ Cumplido |
| Backend deployado en producción | Railway con autodeploy desde `main` via GitHub Actions | ✅ Cumplido |
| Cobertura de tests ≥ 70% | ~80% en backend Python (37 tests automatizados) | ✅ Superado |

Los 10 objetivos del MVP se cumplieron. El producto entregable está en
producción accesible públicamente y el plugin se puede instalar en cualquier
Moodle 4.1-4.5.

## Contribución académica

NexusAI plantea una respuesta técnica concreta a tres preguntas vigentes en
la IA aplicada a educación:

### 1. ¿Cómo se evita la alucinación del LLM en contextos académicos?

Con **RAG auténtico** + **citas trazables**. La pregunta del alumno se
vectoriza, se recuperan los chunks más similares del material indexado del
curso, y se inyectan al system prompt como contexto. El LLM cita el archivo
fuente; el frontend muestra **pills clickeables** que expanden el fragmento
exacto. Si el material no cubre la pregunta, el sistema lo admite
explícitamente y registra el gap para el docente — no inventa.

### 2. ¿Cómo se cierra el feedback loop alumno → docente?

Con **detección automática de gaps** (Feature G). Cada vez que el sistema no
puede responder bien (chunks vacíos, similaridad baja, o el LLM declara que
no encontró información), persiste la pregunta en una tabla específica. El
docente accede a un reporte agregado de qué temas pregunta el alumnado y que
el material no cubre. Es **el sistema midiendo su propia ceguera** —
contribución defendible más allá del aporte de ingeniería.

### 3. ¿Cómo se preservan la privacidad y soberanía de datos académicos?

Con el patrón **Hybrid PHP Proxy** (ADR-001) + HMAC server-to-server +
backend self-hosted. La API key del LLM nunca llega al navegador. Los datos
académicos viven en infraestructura controlada por la institución. La
arquitectura multi-provider permite incluso usar un LLM completamente local
(Ollama) si la institución tiene esa restricción.

## Limitaciones del MVP

Honestidad académica sobre lo que el MVP **no** hace todavía:

- **Solo PDFs** — la pipeline soporta extracción de DOCX y TXT, pero el
  validador del endpoint de upload solo acepta `application/pdf` para
  simplificar el contrato.
- **No es multi-tenant nativo** — cada institución debe hostear su propio
  backend. Soportar multi-tenant con aislamiento estricto requeriría
  particionado por `tenant_id` en cada tabla y autenticación más sofisticada.
- **Quiz generator depende fuertemente de la calidad del LLM** — Gemini 2.5
  Flash a veces genera distractores demasiado parecidos entre sí. Mejorar
  esto requiere prompt engineering iterativo con tribunal humano.
- **Cobertura de tests del frontend y plugin PHP es manual** — solo el
  backend Python tiene tests automatizados. Para producción comercial, se
  necesita Vitest + Behat.
- **Sin analytics agregadas para alumnos** — el docente ve gaps; el alumno
  no tiene dashboard de su propio uso (tokens, sesiones, temas más
  consultados). Planificado para post-MVP.

## Trabajo futuro

### Mejoras inmediatas (próximas 2-4 semanas post-defensa)

- Submission del plugin al **Moodle Plugin Directory oficial**
  (`moodle.org/plugins`). Aumenta la defendibilidad académica y permite que
  cualquier admin de Moodle del mundo instale el plugin con un click.
- Tests automatizados de frontend con Vitest + React Testing Library.
- Implementación del Privacy API completo con `metadata\provider` para
  cuando se agreguen tablas locales en el plugin Moodle.

### Líneas de investigación post-tesis

- **Clustering semántico de gaps** — actualmente la Feature G agrupa
  preguntas por string normalizado. Con embeddings podríamos detectar que
  "¿qué es una matriz inversa?" y "explicame la inversa de una matriz" son
  la misma pregunta, y agrupar gaps a nivel temático en vez de literal.
- **Sugerencias proactivas al alumno** — basado en su historial, sugerir
  "te conviene repasar X antes del parcial". Requiere modelar el progreso
  del alumno, no solo responder consultas.
- **Generador de planes de estudio adaptativos** — combinar gaps, quiz
  scores y temas no consultados para armar un plan personalizado.
- **Fine-tuning del LLM con material del curso** — alternativa a RAG cuando
  el material es estable y voluminoso. Permitiría respuestas más naturales
  sin necesidad de retrieval, pero requiere infraestructura significativa.
- **Análisis de sesgo en el material** — detectar si el material indexado
  cubre adecuadamente cuestiones de género, accesibilidad, perspectivas
  culturales diversas. Tema sensible pero relevante para tesis.

## Reflexión final

NexusAI nace de una observación simple: los alumnos preguntan más a ChatGPT
que al docente, y los docentes pierden visibilidad sobre qué consulta el
alumnado. El sistema no compite con el docente — lo amplifica. La IA
responde 24/7 con el material que el docente seleccionó, y el docente recibe
un reporte agregado de qué temas no quedaron cubiertos.

Para el equipo, el proyecto fue una oportunidad de combinar varias
disciplinas en un sistema real: arquitectura de software (monolito modular,
patrones de auth), IA aplicada (RAG, embeddings, prompt engineering),
desarrollo full-stack (PHP, Python, React, SQL+vector), y gestión de
proyectos (5 sprints, 70+ issues, CI/CD, documentación de 80+ páginas).

El MVP está en producción y es entregable. El plugin se puede instalar en
cualquier Moodle 4.x del mundo apuntando al backend que mantenemos en
Railway. La trazabilidad del código — desde el commit que implementa cada
feature hasta el ADR que justifica la decisión arquitectónica — está
disponible en el repositorio público.

Queda lo difícil: que algún docente, algún curso, alguna institución, lo
use. Para eso fue construido.


