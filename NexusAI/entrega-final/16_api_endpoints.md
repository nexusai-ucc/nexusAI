# API endpoints

El backend FastAPI expone 16 endpoints HTTP organizados en seis grupos
funcionales: salud (sin auth), chat, documentos, búsqueda semántica, quiz,
gaps y admin. Todos los endpoints con prefijo `/api/v1/` requieren
autenticación HMAC (excepto un endpoint de smoke test).

## Autenticación HMAC

Todos los endpoints (excepto `/health` y `/`) requieren cuatro headers:

| Header | Valor |
|---|---|
| `Authorization` | `Bearer <NEXUSAI_API_KEY>` |
| `X-Timestamp` | Unix epoch en segundos, como string |
| `X-Nonce` | 16 bytes hexadecimales aleatorios |
| `X-Signature` | `hex(HMAC_SHA256(secret, timestamp || nonce || body))` |

El plugin Moodle (PHP) genera estos headers automáticamente en
`backend_client::compute_signature()`. El backend (Python) los valida en
`app/auth/hmac.py` con tres capas:

1. Comparación constant-time del Bearer API key.
2. Recálculo de la firma sobre el body raw recibido.
3. Verificación de que el nonce no está en Redis (anti-replay, TTL 5 minutos).

Si cualquiera de las tres falla, FastAPI corta la request con `401
Unauthorized` antes de llegar al handler.

## Endpoints de salud

### `GET /health`

Liveness probe. Sin autenticación. Devuelve estado del backend y modelo LLM
activo. Usado por Docker, Kubernetes y monitoreo externo.

```json
{ "status": "ok", "version": "0.9.3", "env": "production", "llm_model": "gemini-2.5-flash" }
```

### `GET /`

Endpoint raíz. Sin autenticación. Devuelve `{ "message": "NexusAI API
running" }`.

## Chat

### `POST /api/v1/chat/messages`

Endpoint sync original. Recibe una pregunta, hace retrieval, llama al LLM y
devuelve la respuesta completa cuando termina.

**Request body:**

```json
{
  "question": "string (1-2000)",
  "course_id": 42,
  "user_id": 7,
  "session_id": "uuid | null",
  "course_ids": [42, 51],
  "course_names": { "42": "Cálculo I", "51": "Programación I" }
}
```

Los campos `course_ids` y `course_names` son opcionales y habilitan el modo
multi-curso (Feature B).

**Response:**

```json
{
  "session_id": "uuid",
  "answer": "respuesta completa del LLM",
  "messages": [ /* historial actualizado */ ],
  "prompt_tokens": 1456,
  "completion_tokens": 312,
  "total_tokens": 1768
}
```

### `POST /api/v1/chat/stream`

Versión streaming del endpoint anterior. Devuelve `StreamingResponse` con
Server-Sent Events. Implementa Feature C.

**Eventos SSE emitidos** (line-delimited JSON con prefijo `data: `):

| Tipo | Contenido | Cuándo |
|---|---|---|
| `meta` | `session_id`, `chunks` (cantidad), `sources` (chunks completos con texto, similarity, course_id), `course_names` (si multi-curso) | Primero, una sola vez |
| `token` | `content` (string del chunk de texto) | N veces, una por chunk del LLM |
| `done` | `prompt_tokens`, `completion_tokens`, `total_tokens` | Al final |
| `error` | `detail` (string) | Si falla algo durante el stream |

El cliente PHP forwardea estos eventos al browser sin tocarlos vía un
endpoint dedicado `/local/nexusai/chat_stream.php` con
`CURLOPT_WRITEFUNCTION`.

### `POST /api/v1/chat/sessions/list`

Lista las sesiones previas del alumno. Implementa Feature E.

**Body:**

```json
{ "user_id": 7, "course_id": 42, "limit": 20 }
```

Si `course_id` es null, devuelve sesiones de todos los cursos del usuario.

**Response:** array de sesiones con `id`, `course_id`, `created_at`,
`updated_at`, `last_message_preview`, `message_count`.

### `POST /api/v1/chat/sessions/messages`

Devuelve los mensajes completos de una sesión específica. Valida que la
sesión pertenezca al `user_id` (ownership check a nivel app).

### `POST /api/v1/chat/echo`

Endpoint mock para smoke test del HMAC desde el cliente PHP. No procesa nada;
solo valida la firma y devuelve eco del payload.

## Documentos

### `POST /api/v1/documents`

Sube un documento para indexación RAG. El archivo viaja como base64 dentro de
un JSON (no multipart) para que la firma HMAC sea predecible.

**Body:**

```json
{
  "course_id": 42,
  "uploader_id": 7,
  "filename": "apunte-derivadas.pdf",
  "mime_type": "application/pdf",
  "content_b64": "JVBERi0xLjQK..."
}
```

**Response (HTTP 202 Accepted):** el documento se persiste con `status =
indexing` y un `BackgroundTask` corre la indexación async. El frontend hace
polling de `/api/v1/documents/{id}` para ver el estado.

**Detección de duplicados:** el backend computa SHA-256 del contenido y lo
guarda en `documents.file_hash`. Si ya existe el mismo hash en el mismo curso
con `status='indexed'`, devuelve el documento existente sin re-indexar
(idempotente).

### `GET /api/v1/documents?course_id=N`

Lista todos los documentos indexados del curso `N` ordenados por
`created_at DESC`.

### `GET /api/v1/documents/{document_id}`

Devuelve el estado actual de un documento. Usado por el frontend para polling
durante la indexación.

### `DELETE /api/v1/documents/{document_id}`

Borra un documento. PostgreSQL hace `ON DELETE CASCADE` sobre `chunks`
automáticamente.

## Búsqueda semántica (Feature A)

### `POST /api/v1/search`

Retrieval puro sobre pgvector — devuelve fragmentos relevantes sin pasar por
el LLM. Más permisivo que el retrieval del chat (`min_similarity=0.25`).

**Body:**

```json
{ "query": "string", "course_id": 42, "user_id": 7, "top_k": 5 }
```

**Response:** lista de chunks con `document_filename`, `chunk_index`,
`content` (truncado a 400 chars), `similarity` (0..1).

Si el curso no tiene material indexado, devuelve lista vacía con `total: 0`
(no 404).

## Quiz generator (Feature F)

### `POST /api/v1/quiz/generate`

Genera un quiz de opción múltiple desde el material del curso.

**Body:**

```json
{
  "course_id": 42,
  "user_id": 7,
  "topic": "derivadas (opcional)",
  "num_questions": 5
}
```

**Lógica:**

- Si `topic` está poblado: hace `retrieve_context()` con esa consulta. Si los
  chunks recuperados son menos de 3 o su `max_similarity < 0.4`, devuelve
  `404` con mensaje claro al alumno (no genera quiz aleatorio engañoso).
- Si `topic` está vacío: sampling aleatorio de 12 chunks del curso para
  variedad.

**Llamada al LLM:** con `response_format={"type":"json_object"}` para forzar
salida JSON parseable. Validación con Pydantic — preguntas malformadas se
saltean (graceful degradation).

**Shuffle de opciones:** después del parse, las opciones de cada pregunta se
mezclan para evitar el sesgo conocido de los LLMs de poner la correcta
siempre en index 0.

**Response:** lista de preguntas con `question`, `options` (4 strings),
`correct_index` (0-3), `explanation`, `source_filename`.

## Gaps del docente (Feature G)

### `POST /api/v1/gaps/list`

Devuelve las preguntas que el material no pudo responder, agrupadas por
pregunta normalizada con conteo y promedio de similaridad.

**Body:**

```json
{ "course_id": 42, "days": 30, "limit": 20 }
```

**Response:**

```json
{
  "course_id": 42,
  "days": 30,
  "total": 7,
  "items": [
    {
      "question": "¿cómo calcular el determinante de una matriz 4x4?",
      "count": 5,
      "last_asked_at": "2026-06-01T12:34:56Z",
      "avg_similarity": 0.18
    }
  ]
}
```

Solo accesible para usuarios con capability `local/nexusai:manage` en el
contexto del curso (validado en la External Function PHP).

## Admin

### `GET /api/v1/admin/usage`

Métricas agregadas de uso del backend para el admin de Moodle. Devuelve
totales de mensajes, sesiones, documentos indexados, tokens consumidos.

### `GET /api/v1/courses/{course_id}/stats`

Estadísticas por curso: cantidad de documentos, chunks, sesiones, mensajes.


