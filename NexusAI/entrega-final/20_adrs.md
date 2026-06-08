# Architectural Decision Records (ADRs)

## ¿Qué es un ADR?

Un Architectural Decision Record es un documento corto y trazable que registra
una decisión arquitectónica importante: el contexto en el que se tomó, las
alternativas evaluadas, la decisión final y sus consecuencias. Mantener ADRs
permite que cualquier integrante futuro del equipo entienda *por qué* el
sistema es como es, no solo *cómo* es.

NexusAI mantiene seis ADRs aceptadas, todas accesibles en `docs/adr/` del
repositorio. A continuación se sintetiza el contexto y la decisión de cada
una.

## ADR-001 — Backend Python como monolito modular

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

El backend Python orquesta el pipeline RAG + LLM + indexación + chat. Surge la
pregunta clásica: ¿monolito o microservicios? El equipo es de 2 personas con
un plazo corto para el MVP y una audiencia académica que prioriza
defendibilidad sobre escala teórica.

### Decisión

Se construye un **monolito modular**: una sola aplicación FastAPI con cada
dominio en su propio paquete y comunicación interna por interfaces explícitas
(no por importar funciones internas):

```
services/api/app/
├── chat/                # chat + RAG + LLM
├── documents/           # indexación
├── search/              # buscador semántico
├── quiz/                # quiz generator
├── gaps/                # detección de gaps del docente
├── providers/           # LLMProvider, EmbeddingProvider
├── infrastructure/      # clientes externos (Redis, DB)
└── shared/              # auth HMAC, observability, helpers
```

### Consecuencias

- ✅ Un único deploy, una única base de datos, una única configuración.
- ✅ Refactorizable a microservicios cuando aparezca el dolor real (worker de
  indexación async cuando los uploads bloqueen el API).
- ⚠️ Bajo escenarios de carga alta, todo el proceso comparte memoria — un bug
  en un dominio puede afectar a los demás.

## ADR-002 — pgvector sobre PostgreSQL como única base

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

El sistema necesita guardar datos relacionales (mensajes, documentos,
sesiones) **y** embeddings (vectores de 768 o 1.536 dimensiones para búsqueda
por similitud coseno). Las queries típicas combinan ambos mundos: *"dame los
5 chunks más similares a esta pregunta, del curso 42, que no estén marcados
como eliminados"*.

### Decisión

Usar **PostgreSQL con la extensión pgvector como única base** del sistema.
Tabla `chunks` con columna `embedding vector(N)`, índice HNSW con distancia
coseno (`vector_cosine_ops`, `m=16`, `ef_construction=200`). Las queries
combinan filtros relacionales y búsqueda vectorial en una sola sentencia SQL.

### Alternativas descartadas

- **ChromaDB** — sistema separado de PostgreSQL, doble operación, sin SQL+vector unificado.
- **Pinecone** — $70+/mes mínimo, vendor lock-in.
- **Qdrant / Weaviate** — justificados a partir de 10-50M vectores, fuera del rango de NexusAI single-institution.

### Consecuencias

- ✅ Una sola DB, un solo backup, un solo punto de truth.
- ✅ Queries SQL+vector en una transacción.
- ⚠️ Si pgvector deja de escalar (>10M vectores con concurrencia alta), habrá que evaluar Qdrant o Weaviate. Migración planificada pero diferida.

## ADR-003 — Arquitectura agnóstica de proveedor LLM

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

NexusAI genera respuestas con un LLM y vectoriza texto con un modelo de
embeddings. El MVP necesita costo cero (Gemini tier gratuito) y producción
necesita SLA + calidad (OpenAI GPT-4o-mini). Casi todos los proveedores
relevantes (OpenAI, Gemini, Anthropic, Groq, Together, Ollama) son
**compatibles con el SDK de OpenAI** cambiando solo `base_url` y modelo.

### Decisión

Encapsular el acceso a LLM y embeddings detrás de dos clases de abstracción:

- `LLMProvider` — para chat completions (sync y streaming).
- `EmbeddingProvider` — para vectorización.

Ambas leen su configuración (proveedor, modelo, dimensiones, base URL, API
key) **exclusivamente de variables de entorno**. El código nunca hardcodea
ningún proveedor.

### Consecuencias

- ✅ Cambio de proveedor = editar `.env` + reiniciar Uvicorn.
- ✅ Permite testing con Ollama local sin tocar código.
- ⚠️ Si las dimensiones del embedding cambian (Gemini 768 → OpenAI 1.536), se
  necesita migración de schema + re-indexación completa.

## ADR-004 — Gemini 2.5 Flash en MVP, GPT-4o-mini en producción

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

Hay dos restricciones contradictorias: el MVP necesita costo cero para
iterar libremente, pero producción necesita calidad consistente para 500+
alumnos. La abstracción multi-provider (ADR-003) permite cambiar sin tocar
código.

### Decisión

- **MVP:** `gemini-2.5-flash` vía SDK OpenAI-compatible. Tier gratuito de
  Google AI Studio cubre el desarrollo completo sin costo.
- **Embeddings MVP:** `gemini-embedding-001` (Matryoshka, 768 dim).
- **Producción:** `gpt-4o-mini` de OpenAI ($0.15/M tokens input, $0.60/M
  output). Aproximadamente $100/mes para 500 alumnos activos.
- **Embeddings producción:** `text-embedding-3-small` (1.536 dim) — requiere
  migración de schema y re-indexación, planificada para el switch.

### Consecuencias

- ✅ Desarrollo del MVP sin tarjeta de crédito ni quotas.
- ✅ Switch a OpenAI documentado y testeado.
- ⚠️ Las dimensiones diferentes obligan a re-indexar todo el material al
  migrar. Script automatizado planificado.

## ADR-005 — HMAC SHA-256 en 3 capas entre PHP y Python

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

El plugin Moodle (PHP) llama al backend (Python) server-to-server con cURL.
La autenticación debe ser fuerte y resistir tampering, replay y filtrado de
secretos al cliente. OAuth introduce complejidad (flows, refresh tokens) sin
beneficio claro para una integración entre dos servicios de la misma
institución.

### Decisión

**HMAC SHA-256 en tres capas:**

1. **Bearer API key** identifica la instancia de Moodle (poco entropía, alta
   rotación, fácil revocar).
2. **Firma HMAC** sobre `timestamp || nonce || body` con un shared secret de
   32 bytes que solo conocen el plugin y el backend.
3. **Nonce store en Redis** con TTL de 5 minutos — evita que un atacante
   capture un request firmado y lo replay-ee.

Headers enviados en cada request:

```
Authorization: Bearer <NEXUSAI_API_KEY>
X-Timestamp:   <unix epoch>
X-Nonce:       <16 bytes hex>
X-Signature:   <hex_hmac_sha256(secret, timestamp || nonce || body)>
```

### Consecuencias

- ✅ Los secretos solo viven en config del plugin (Moodle admin) y en variables
  de entorno del backend. El navegador nunca los ve.
- ✅ Replay attacks bloqueados por nonce TTL.
- ⚠️ Requiere que el plugin y el backend tengan reloj sincronizado (drift
  máximo configurable, default 5 min).
- ⚠️ Rotar el shared secret implica downtime breve mientras se actualizan
  ambos extremos.

## ADR-006 — Privacy API con `null_provider` en MVP

**Estado:** Aceptada · **Fecha:** 2026-05-02

### Contexto

Moodle define una **Privacy API** que obliga a cada plugin a declarar qué
datos personales almacena y dónde. El MVP de NexusAI **no persiste datos
personales en el lado Moodle** — todo (historial de chat, sesiones,
documentos indexados) vive en el backend Python externo.

### Decisión

- En el MVP, el plugin Moodle declara un `null_provider` en su Privacy API:
  el plugin no almacena información personal por su cuenta.
- Cuando se agreguen tablas locales en Moodle (audit log de uso, cache de
  respuestas LLM, settings por curso — todo planificado para post-MVP), se
  migra a `metadata\provider`.
- La ubicación externa del backend Python se declara con
  `add_external_location_link()` de forma genérica (`llm_provider`), no atada
  a un proveedor específico, para que sea compatible con ADR-003.

### Consecuencias

- ✅ El plugin pasa los checks de Privacy API sin esfuerzo extra hoy.
- ⚠️ Cuando se persistan tablas locales, hay que actualizar la implementación
  de la Privacy API en el plugin.
- ⚠️ La existencia del backend externo se documenta como dependencia para
  el administrador de Moodle.

## Resumen

| ADR | Decisión | Estado |
|---|---|---|
| 001 | Monolito modular sobre microservicios | ✅ Aceptada |
| 002 | pgvector como única base | ✅ Aceptada |
| 003 | Multi-provider LLM con abstracción | ✅ Aceptada |
| 004 | Gemini en MVP, OpenAI en producción | ✅ Aceptada |
| 005 | HMAC SHA-256 en 3 capas | ✅ Aceptada |
| 006 | Privacy API `null_provider` en MVP | ✅ Aceptada |


