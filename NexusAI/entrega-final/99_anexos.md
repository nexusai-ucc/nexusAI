# Anexos

## A. Glosario técnico

| Término | Definición |
|---|---|
| **ADR** | Architectural Decision Record. Documento corto que registra una decisión arquitectónica con su contexto, alternativas y consecuencias. |
| **AMD** | Asynchronous Module Definition. Sistema de módulos JavaScript que usa Moodle vía RequireJS. |
| **API key** | Cadena secreta que identifica a un cliente ante un servicio. En NexusAI se usa como primera capa de auth (Bearer). |
| **Backoff exponencial** | Estrategia de retry donde cada intento espera más que el anterior (1s, 2s, 4s, …). Usada para absorber errores transitorios del LLM. |
| **BackgroundTask** | Mecanismo de FastAPI para correr lógica async después de responder al cliente. Usado en NexusAI para indexar PDFs sin bloquear el upload. |
| **Chunk** | Fragmento de un documento procesado para embedding. Tamaño típico en NexusAI: 512 tokens con 64 de solapamiento. |
| **CORS** | Cross-Origin Resource Sharing. Política del navegador sobre llamadas cross-domain. Evitado en NexusAI por el patrón Hybrid PHP Proxy. |
| **CSRF** | Cross-Site Request Forgery. Ataque donde un sitio malicioso ejecuta acciones en nombre del usuario. Mitigado en Moodle con `sesskey`. |
| **Embedding** | Vector denso (768 o 1.536 dim en NexusAI) que representa un texto. Textos semánticamente similares tienen vectores cercanos. |
| **External Function** | Convención de Moodle para exponer endpoints PHP a JavaScript vía `core/ajax`. NexusAI tiene 10 (chat, documentos, search, quiz, gaps, sessions). |
| **FAB** | Floating Action Button. El botón violeta de NexusAI que abre el chat. |
| **HMAC** | Hash-based Message Authentication Code. Firma criptográfica con secreto compartido. NexusAI usa HMAC SHA-256. |
| **HNSW** | Hierarchical Navigable Small World. Índice aproximado de pgvector para búsqueda de nearest neighbors en alta dimensión. |
| **Hook API** | Mecanismo de Moodle 4.4+ para inyectar comportamiento en eventos del core (ej: antes del footer). |
| **Matryoshka** | Tipo de embedding (como `gemini-embedding-001`) que permite truncar dimensiones sin perder calidad lineal. NexusAI usa 768 de 3.072 dim disponibles. |
| **Nonce** | Número usado una sola vez. NexusAI lo guarda en Redis con TTL para bloquear replay attacks. |
| **pgvector** | Extensión de PostgreSQL para columnas tipo `vector` con operadores de distancia. |
| **Privacy API** | Interfaz de Moodle que cada plugin debe implementar para declarar qué datos personales almacena. NexusAI usa `null_provider` en MVP. |
| **RAG** | Retrieval-Augmented Generation. LLM que toma contexto recuperado de una base vectorial antes de generar respuesta. |
| **Retrieval** | El primer paso de RAG: recuperar los chunks más relevantes para una pregunta. |
| **sesskey** | Token CSRF nativo de Moodle, presente en todas las requests AJAX vía `core/ajax`. |
| **Similaridad coseno** | Métrica de distancia entre vectores normalizada al rango [-1, 1]. NexusAI la usa como score [0, 1] = `1 - distance/2`. |
| **Sprint** | Iteración de desarrollo de duración fija (4-8 semanas en NexusAI). |
| **SSE** | Server-Sent Events. Protocolo HTTP de streaming unidireccional server → client. Usado para el modo streaming del chat. |
| **Token (en LLM)** | Unidad de texto procesada por el modelo (~4 caracteres en español). El costo de la API se mide en tokens. |
| **WBS** | Work Breakdown Structure. Descomposición jerárquica de las tareas del proyecto. |

## B. Bibliografía y recursos consultados

### Sobre RAG y LLMs

- Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. arXiv:2005.11401.
- Karpukhin, V. et al. (2020). *Dense Passage Retrieval for Open-Domain Question Answering*.
- OpenAI Cookbook — `https://cookbook.openai.com/`
- Google AI Studio — `https://ai.google.dev/`
- Anthropic — *Building Effective Agents*, 2024.

### Sobre Moodle

- Moodle Developer Docs — `https://moodledev.io/`
- Moodle Plugin Development — `https://moodledev.io/docs/4.5/devupdate`
- Plugin Review Criteria — `https://moodledev.io/general/community/plugincontribution`
- Hook API — `https://moodledev.io/docs/4.4/apis/core/hooks`

### Sobre pgvector y bases vectoriales

- pgvector — `https://github.com/pgvector/pgvector`
- Pinecone — *Learning Center*, `https://www.pinecone.io/learn/`
- ANN benchmarks — `http://ann-benchmarks.com/`

### Sobre administración de proyectos

- PMBOK Guide, 7th Edition (PMI, 2021).
- Beck, K. *Test-Driven Development by Example* (2002).
- Newman, S. *Building Microservices*, 2nd ed. (2021) — usado como referencia para decidir el monolito modular.

## C. Listado completo de historias de usuario

Se incluyen en el pendrive de entrega como `NexusAI_Backlog_Completo.xlsx`.
Las historias están agrupadas por épica y sprint, con criterios de
aceptación y story points por cada una.

Resumen agregado:

- Total de historias: **70+**
- Cerradas al final del MVP: **70**
- Pendientes (post-MVP): **explícitamente descartadas del alcance**

## D. Listado de commits relevantes

Los commits clave que implementan cada feature del Sprint 4 (con sus SHAs
completos accesibles en GitHub):

| Feature | SHA | Commit message |
|---|---|---|
| A — Buscador semántico | `ef44ad6` | feat: Implement multi-course messaging and semantic search features |
| B — Chat multi-curso | `ef44ad6` | (mismo commit que A) |
| C — Streaming SSE | `6a15cd7` | feat: Implement streaming chat feature with Server-Sent Events |
| D — Citas clickeables | `27ef377` | feat: Enhance message sources handling with clickable citations and previews |
| Fix prompt | `b3d7dc6` | feat: Improve system prompt instructions for citing course materials |
| E — Historial | `9b426b9` | feat: Implement chat session history features |
| F — Quiz generator | `5f9f6c5` | feat: Implement multiple-choice quiz generator |
| G — Detección de gaps | (incluye varios commits) | feat: teacher gap detection |

## E. Issues cerradas (GitHub)

Las 6 issues principales del MVP se encuentran en
`https://github.com/nexusai-ucc/nexusAI/issues` con el label `mvp`. Todas
están cerradas con razón "completed" y comentario que linkea al commit que
las implementa:

| # | Título | Estado |
|---|---|---|
| #253 | [MVP-A] Buscador semántico | ✅ closed |
| #254 | [MVP-B] Chat multi-curso | ✅ closed |
| #255 | [MVP-C] Chat con streaming SSE | ✅ closed |
| #256 | [MVP-D] Citas clickeables con preview | ✅ closed |
| #257 | [MVP-E] Historial de conversaciones | ✅ closed |
| #258 | [MVP-F] Quiz generator | ✅ closed |

Además, hay 60+ issues adicionales en el repositorio que cubren backend,
frontend, infraestructura y bug fixes — todas trazables vía labels
`sprint:N`, `epica:*`, `prio:*`.

## F. Acceso al sistema demo

### Backend en producción (Railway)

| | |
|---|---|
| **URL del backend** | `https://nexusai-production-e414.up.railway.app` |
| **Swagger interactivo** | `https://nexusai-production-e414.up.railway.app/docs` |
| **Health check** | `https://nexusai-production-e414.up.railway.app/health` |
| **Estado** | ✅ Online 24/7 |
| **Mantenimiento** | El equipo se compromete a mantenerlo accesible hasta la defensa final (Feb 2027) |

### Credenciales para conectar un Moodle al backend

Para que el tribunal pueda reproducir el sistema en su propio Moodle (o
verificar cómo se configura), las credenciales del backend en producción
son:

| Campo | Valor |
|---|---|
| **Backend API URL** | `https://nexusai-production-e414.up.railway.app` |
| **API key** | `3f6db387999e0bc2b6f7ea155a983f6540a51ceea5e8a3b19d3033150df5689b` |
| **Shared secret** | `06ba2057056dcdc0c42814bc47b887cf2c4945156a8b9790031015a855c55759` |

Estos valores se pegan en **Site administration → Plugins → Local plugins
→ NexusAI** del Moodle de destino tras instalar el ZIP del plugin.

### Demo presencial (laptop del equipo)

Durante la defensa, el equipo levanta Moodle local en su laptop conectado
al backend de Railway. Los pasos:

```bash
# 1. Levantar Moodle local + DB
cd ~/Documents/NexusAI/moodle-docker
./bin/moodle-docker-compose start

# 2. Verificar que el backend en Railway responde
curl https://nexusai-production-e414.up.railway.app/health
```

Una vez listo:

| | |
|---|---|
| **URL Moodle demo** | `http://localhost:8082` |
| **Usuario admin Moodle** | proporcionado por el equipo durante la defensa |
| **Usuario alumno demo** | proporcionado por el equipo durante la defensa |
| **Usuario docente demo** | proporcionado por el equipo durante la defensa |

> El tribunal puede verificar simultáneamente desde su propio dispositivo
> que el backend de Railway está respondiendo: abrir
> `https://nexusai-production-e414.up.railway.app/health` en cualquier
> navegador devuelve un JSON con `status: ok`.

### Repositorios públicos

| | |
|---|---|
| **GitHub del proyecto** | `https://github.com/nexusai-ucc/nexusAI` |
| **Release del plugin (v0.9.4)** | `https://github.com/nexusai-ucc/nexusAI/releases/latest` |
| **Issues del MVP** | `https://github.com/nexusai-ucc/nexusAI/issues?q=label:mvp` |
| **GitHub Actions (CI/CD)** | `https://github.com/nexusai-ucc/nexusAI/actions` |

## G. Contacto del equipo

- **Santiago Tricherri** — [email institucional]
- **Delfina Salinas** — [email institucional]


