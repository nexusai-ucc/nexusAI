# NexusAI — Contexto técnico por funcionalidad (para preguntas del tribunal)

Guía rápida de cómo está hecha cada pieza, para responder con confianza si
preguntan "¿y esto cómo lo resolvieron?" durante la demo. No es documentación
completa — el detalle técnico está en `informe-ipi/informe-ipi.md`.

## Cómo funciona el sistema en general

Arquitectura de 3 capas, cliente-servidor: **navegador (React) → plugin de
Moodle (PHP, tipo `local`) → backend (FastAPI/Python)**. El navegador nunca
habla directo con el backend — todo pasa por el plugin de Moodle, que actúa
de proxy autenticado. Esto resuelve tres cosas de una: la API key del LLM
nunca llega al navegador, CSRF queda cubierto por el mecanismo nativo de
Moodle, y no hay problemas de CORS. Toda comunicación plugin↔backend se
firma con HMAC SHA-256 (Bearer + firma + nonce anti-replay).

Base de datos: **una sola instancia PostgreSQL con pgvector** — datos
relacionales y vectores en el mismo lugar, sin sistema separado.

Proveedor de IA: **intercambiable por variable de entorno**, no hay lock-in.
Gemini Flash en el MVP (capa gratuita), GPT-4o-mini pensado para producción.

## Chat con IA sobre el contenido real

**Cómo se hizo:** pipeline RAG (Retrieval-Augmented Generation) real, no
prompting genérico. La pregunta del alumno se convierte en un vector
(embedding), se buscan los fragmentos más parecidos del material indexado
en pgvector (búsqueda por similitud coseno, índice HNSW), y esos fragmentos
se le pasan al LLM como contexto para que responda citando la fuente.

**Si preguntan por qué no fine-tuning:** habría que reentrenar el modelo por
cada materia — carísimo e inviable para escalar a toda la universidad. RAG
permite sumar material nuevo sin tocar el modelo.

**Si preguntan por alucinaciones:** si la distancia mínima entre la
pregunta y los fragmentos recuperados supera un umbral, el sistema responde
"no tengo información suficiente" en vez de inventar.

## Carga e indexación de material (docente)

**Cómo se hizo:** el docente sube un PDF, el plugin lo manda al backend
firmado con HMAC. El backend extrae el texto (pdfplumber — se probó primero
con PyPDF2 y pdfminer pero manejaban peor las tablas), lo divide en
fragmentos de ~500 tokens con 10% de solapamiento (para no cortar ideas a
la mitad), genera los embeddings y los guarda en pgvector. Todo el proceso
es asíncrono — el docente ve el estado cambiar de `pending` → `indexing` →
`indexed` sin bloquear la pantalla.

## Buscador semántico y resúmenes

**Cómo se hizo:** mismo mecanismo de embeddings que el chat, pero sin pasar
por el LLM — es recuperación pura por similitud. Por eso responde mucho más
rápido que el chat. El resumen sí usa el LLM, pero solo sobre el documento
puntual que el alumno elige resumir, no sobre todo el curso.

## Generador de quizzes y flashcards / Modo estudio

**Cómo se hizo:** el LLM genera las preguntas a partir del material
indexado del tema elegido (si el tema no está en el material, el sistema lo
avisa en vez de inventar un quiz). Cada pregunta de opción múltiple tiene un
distractor generado también por el LLM, no son opciones fijas. El historial
de errores queda persistido, y ese historial es lo que alimenta después el
plan de estudio personalizado.

## Corrección automática con feedback

**Cómo se hizo:** cada respuesta del alumno se compara contra la respuesta
esperada y el LLM genera una explicación puntual (no solo "bien/mal"),
citando de nuevo el fragmento de origen cuando aplica.

## Calendario y plan de estudio

**Cómo se hizo:** el plan combina tres señales: los errores del historial de
quizzes, los "gaps" de contenido detectados en el chat (preguntas que el
material no pudo responder bien), y las fechas de examen del calendario del
curso. No es un calendario estático — se recalcula según cómo le va al
alumno.

## Analytics para el docente / Gaps detectados

**Cómo se hizo:** cada vez que el chat no puede responder bien una pregunta
(distancia de similitud alta), queda registrada como "unanswered question".
El panel del docente agrupa esas preguntas por curso y las ordena por
frecuencia — así ve qué falta reforzar en el material, sin tener que leer
cada conversación individual.

## Generador de exámenes

**Cómo se hizo:** toma como input los temas donde más alumnos tuvieron
errores (mismo dato que alimenta el plan de estudio) y genera un banco de
preguntas a partir del material real. Exporta directo al formato **GIFT**,
que es el formato nativo que Moodle usa para importar cuestionarios — el
docente no tiene que transcribir nada a mano.

## Foros (post-MVP)

**Cómo se hizo:** detecta posts similares o duplicados mientras el alumno
escribe (antes de publicar, no después), resume hilos largos, y sugiere una
respuesta al docente usando el mismo mecanismo RAG que el chat.

## Decisiones técnicas que suelen preguntar

- **¿Por qué plugin `local` y no `block`?** Con el tema Boost de Moodle 4.x
  los bloques quedan ocultos en un panel lateral y cada docente tendría que
  agregarlo curso por curso a mano. El tipo `local` no depende de eso.
- **¿Por qué no usaron el asistente de IA nativo de Moodle 4.5+?** No tiene
  memoria conversacional persistente durante el cuatrimestre — limitación
  del core que fue justamente el motivo para hacer un plugin propio.
- **¿Los datos salen de la universidad?** No — todo el pipeline es
  self-hosted, la única llamada externa es al proveedor del LLM (y esa
  llamada nunca incluye la identidad del alumno, solo la pregunta y el
  contexto recuperado).
- **¿Por qué no LangChain u otro framework de orquestación?** Se armó una
  abstracción propia (`LLMProvider`/`EmbeddingProvider`) más liviana,
  evitando el peso y la inestabilidad de la API de LangChain entre
  versiones.
