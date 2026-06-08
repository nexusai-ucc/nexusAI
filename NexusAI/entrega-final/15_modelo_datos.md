# Modelo de datos

## Visión general

NexusAI usa **una sola base de datos PostgreSQL** con la extensión pgvector activada. Todos los datos del proyecto — incluyendo embeddings vectoriales — viven en la misma instancia, lo que permite hacer joins SQL entre tablas relacionales y la columna vectorial dentro de una transacción.

Las tablas se dividen en dos grupos según quién las gestiona:

- **Tablas del backend Python** (`documents`, `chunks`, `chat_sessions`, `messages`, `unanswered_questions`) — gestionadas por Alembic, incluyen el tipo `vector(N)` de pgvector.
- **Tablas del plugin Moodle** (`local_nexusai_*`) — gestionadas por XMLDB de Moodle (`plugin/local/nexusai/db/install.xml`). Hoy el MVP usa `null_provider` de la Privacy API y no persiste datos personales en estas tablas (ADR-006).

## Diagrama entidad-relación

```mermaid
erDiagram
    DOCUMENTS ||--o{ CHUNKS : "compone"
    CHAT_SESSIONS ||--o{ MESSAGES : "contiene"

    DOCUMENTS {
        uuid id PK
        int course_id "ID del curso Moodle"
        int uploader_id "ID del docente Moodle"
        string(255) filename
        string(100) mime_type
        string(20) status "pending | indexing | indexed | error"
        text error_message NULL
        string(64) file_hash "SHA-256 para dedup"
        timestamptz created_at
        timestamptz updated_at
    }

    CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        int chunk_index
        int token_count NULL
        vector embedding "Vector(768) MVP / Vector(1536) prod"
        timestamptz created_at
    }

    CHAT_SESSIONS {
        uuid id PK
        int user_id "ID del alumno Moodle"
        int course_id "ID del curso Moodle (0 = multi-curso)"
        timestamptz created_at
        timestamptz updated_at
    }

    MESSAGES {
        uuid id PK
        uuid session_id FK
        string(20) role "user | assistant | system"
        text content
        int token_count_prompt NULL
        int token_count_completion NULL
        timestamptz created_at
    }

    UNANSWERED_QUESTIONS {
        uuid id PK
        int course_id
        int user_id
        text question
        float max_similarity NULL
        int chunks_retrieved
        timestamptz created_at
    }
```

## Tablas

### `documents`

Material que el docente sube al curso para ser indexado.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | generado en el servidor con `uuid4()` |
| `course_id` | `INT NOT NULL` | ID del curso Moodle |
| `uploader_id` | `INT NOT NULL` | `$USER->id` del docente que subió el archivo |
| `filename` | `VARCHAR(255)` | nombre del archivo original |
| `mime_type` | `VARCHAR(100)` | MVP solo acepta `application/pdf` |
| `status` | `VARCHAR(20)` | `pending` → `indexing` → `indexed` (o `error`) |
| `error_message` | `TEXT NULL` | poblado solo si `status='error'` |
| `file_hash` | `VARCHAR(64) NULL` | SHA-256 del contenido para detectar uploads duplicados (migración 004) |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | server defaults |

**Índice único parcial**: `(course_id, filename, file_hash) WHERE file_hash IS NOT NULL`. Garantiza que no se indexe dos veces el mismo archivo en el mismo curso, pero deja pasar documentos antiguos sin hash (compat con datos pre-migración 004).

### `chunks`

Fragmentos de cada documento, ya vectorizados.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | |
| `document_id` | `UUID NOT NULL` FK | `ON DELETE CASCADE` |
| `content` | `TEXT NOT NULL` | texto del fragmento (~512 tokens) |
| `chunk_index` | `INT NOT NULL` | orden dentro del documento |
| `token_count` | `INT NULL` | conteo `cl100k_base` |
| `embedding` | `vector(768)` | dimensión Matryoshka del modelo Gemini |
| `created_at` | `TIMESTAMPTZ` | |

**Índice HNSW** sobre `embedding` con distancia coseno, parámetros `m=16` y `ef_construction=200`. Permite búsqueda aproximada de vecinos más cercanos en tiempo casi constante. La migración 002 lo crea explícitamente.

### `chat_sessions`

Una sesión de conversación por usuario por curso (o `course_id=0` para sesión multi-curso de Feature B).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | |
| `user_id` | `INT NOT NULL` | ID del alumno |
| `course_id` | `INT NOT NULL` | ID del curso, o 0 si es multi-curso |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

### `messages`

Mensajes individuales dentro de una sesión.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | |
| `session_id` | `UUID NOT NULL` FK | `ON DELETE CASCADE` |
| `role` | `VARCHAR(20)` | `user` / `assistant` / `system` |
| `content` | `TEXT NOT NULL` | mensaje completo |
| `token_count_prompt` | `INT NULL` | tokens del prompt (solo en `role='assistant'`) |
| `token_count_completion` | `INT NULL` | tokens de la respuesta (solo en `role='assistant'`) |
| `created_at` | `TIMESTAMPTZ` | |

Los token counts se agregaron en la migración 003 para habilitar monitoreo de costos en tiempo real.

### `unanswered_questions`

Tabla del feedback loop pedagógico (Feature G). Cada vez que el sistema detecta que el material indexado no pudo responder bien a una pregunta del alumno, registra el evento.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `UUID` PK | |
| `course_id` | `INT NOT NULL` | |
| `user_id` | `INT NOT NULL` | |
| `question` | `TEXT NOT NULL` | pregunta original, truncada a 2000 chars |
| `max_similarity` | `FLOAT NULL` | máxima similaridad encontrada (NULL si chunks=0) |
| `chunks_retrieved` | `INT NOT NULL` | cantidad de chunks que pasaron el threshold |
| `created_at` | `TIMESTAMPTZ` | |

**Criterio de registro**: si `chunks_retrieved=0` O `max_similarity<0.4` O la respuesta del LLM matchea patrones tipo *"no se encuentra en el material"*. Detalle en el capítulo 21 (Testing) y en la implementación de `app/gaps/recorder.py`.

## Evolución del schema (migraciones Alembic)

| Migración | Cambio | Sprint |
|---|---|---|
| `001_initial_schema` | Tablas base: `documents`, `chunks`, `chat_sessions`, `messages` | Sprint 1 |
| `002_hnsw_index` | Índice HNSW en `chunks.embedding` con distancia coseno | Sprint 2 |
| `003_message_token_counts` | Columnas `token_count_prompt` y `token_count_completion` en `messages` | Sprint 3 |
| `004_document_hash` | Columna `file_hash` en `documents` + índice único parcial para detectar duplicados | Sprint 4 |
| `004_unanswered_questions` | Tabla `unanswered_questions` para Feature G | Sprint 4 |

> **Nota técnica**: las dos migraciones del Sprint 4 fueron desarrolladas en paralelo por integrantes distintos del equipo y quedaron numeradas igual (`004_*`). Al integrarse, se encadenaron explícitamente — `004_document_hash` depende de `004_unanswered_questions` — para linealizar el árbol de Alembic. Es un patrón conocido cuando dos personas crean migraciones desde el mismo padre.

## Migración entre dimensiones de embeddings (post-MVP)

El campo `chunks.embedding` está hoy en `vector(768)` (Gemini, modelo Matryoshka). Para producción con OpenAI `text-embedding-3-small` (1.536 dim), la migración es:

```sql
ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1536);
DROP INDEX chunks_embedding_idx;
CREATE INDEX chunks_embedding_idx ON chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);
-- + re-indexar todos los chunks (re-procesar PDFs con el nuevo modelo)
```

HNSW no soporta cambio de dimensión in-place, por eso hay que destruir y recrear el índice.

## Tablas del plugin Moodle (`local_nexusai_*`)

Hoy el MVP usa solo `local_nexusai_placeholder` (vacía, evita warnings del plugin checker de Moodle). Las siguientes tablas están planificadas para post-MVP:

- `local_nexusai_usage` — rate limiting por (usuario, curso, día)
- `local_nexusai_cache` — cache de respuestas LLM por hash de pregunta
- `local_nexusai_course_settings` — settings configurables por curso

Cuando se implementen, se actualiza la Privacy API del plugin migrando de `null_provider` a `metadata\provider` (ADR-006).


