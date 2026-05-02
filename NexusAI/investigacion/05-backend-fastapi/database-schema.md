# Estructura de base de datos — PostgreSQL + pgvector

> **Resumen:** Schema completo de PostgreSQL para NexusAI. Una única base de datos con pgvector habilitado cubre tanto los datos relacionales (usuarios, cursos, conversaciones) como los vectores de embeddings para el RAG. No hay base de datos secundaria.

## Contexto

La decisión de usar pgvector sobre PostgreSQL (ver `../04-chromadb/decision-pgvector.md`) implica que toda la persistencia del sistema vive en un único motor. Este documento consolida el schema completo con todas las tablas, índices y relaciones.

## Habilitación de pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Se ejecuta una única vez al instalar el sistema o en el script de setup del servidor.

---

## Grupo 1 — Materiales y RAG

### `nexusai_documents`

Representa cada archivo subido por un docente a un curso. Es la fuente de verdad sobre qué material existe en el sistema.

```sql
CREATE TABLE nexusai_documents (
    id           BIGSERIAL PRIMARY KEY,
    course_id    BIGINT NOT NULL,
    section_id   BIGINT,
    filename     TEXT NOT NULL,
    file_type    VARCHAR(20) NOT NULL,      -- pdf, docx, txt
    uploaded_by  BIGINT NOT NULL,           -- user_id de Moodle
    uploaded_at  TIMESTAMPTZ DEFAULT now(),
    indexed_at   TIMESTAMPTZ,              -- NULL si todavía no fue indexado
    status       VARCHAR(20) DEFAULT 'pending',  -- pending / indexing / indexed / error
    error_message TEXT,
    embedding_model VARCHAR(100)           -- modelo usado al indexar (para migraciones)
);

CREATE INDEX ON nexusai_documents (course_id, status);
```

### `nexusai_chunks`

Cada fragmento de texto generado al procesar un documento. Contiene el embedding como columna vectorial.

```sql
CREATE TABLE nexusai_chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_id  BIGINT NOT NULL REFERENCES nexusai_documents(id) ON DELETE CASCADE,
    chunk_index  INT NOT NULL,             -- posición dentro del documento
    chunk_text   TEXT NOT NULL,
    token_count  INT NOT NULL,
    embedding    vector(768),              -- MVP: 768 dims / Producción: vector(1536)
    created_at   TIMESTAMPTZ DEFAULT now()
);

-- Índice HNSW con distancia coseno
CREATE INDEX ON nexusai_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

CREATE INDEX ON nexusai_chunks (document_id);
```

> **Nota sobre dimensiones:** la columna `embedding` se define con las dimensiones del modelo activo. En el MVP con Gemini Embedding o nomic-embed-text se usa `vector(768)`. En producción con text-embedding-3-small se usa `vector(1536)`. El campo `embedding_model` en `nexusai_documents` permite identificar qué documentos necesitan re-indexación al migrar de modelo.

> **ON DELETE CASCADE:** cuando se elimina un documento, sus chunks se borran automáticamente. Simplifica la re-indexación.

---

## Grupo 2 — Conversaciones

### `nexusai_conversations`

Agrupa los mensajes de una sesión de chat de un usuario en un curso.

```sql
CREATE TABLE nexusai_conversations (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    course_id  BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON nexusai_conversations (user_id, course_id);
```

### `nexusai_messages`

Cada mensaje individual dentro de una conversación.

```sql
CREATE TABLE nexusai_messages (
    id               BIGSERIAL PRIMARY KEY,
    conversation_id  BIGINT NOT NULL REFERENCES nexusai_conversations(id) ON DELETE CASCADE,
    role             VARCHAR(10) NOT NULL,   -- user / assistant
    content          TEXT NOT NULL,
    tokens_used      INT,
    context_chunks   JSONB,                 -- IDs de chunks usados como contexto RAG
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON nexusai_messages (conversation_id, created_at);
```

> **`context_chunks` JSONB:** registra qué chunks del RAG se usaron para generar cada respuesta del asistente. Es la base para el dashboard de analytics del docente — permite saber qué temas consultan más los alumnos y qué partes del material se usan más.

---

## Grupo 3 — Configuración

### `nexusai_course_config`

Configuración del plugin para cada curso, gestionada por el docente o administrador.

```sql
CREATE TABLE nexusai_course_config (
    id            BIGSERIAL PRIMARY KEY,
    course_id     BIGINT NOT NULL UNIQUE,
    enabled       BOOLEAN DEFAULT true,
    system_prompt TEXT,                     -- prompt personalizado por el docente (opcional)
    max_tokens    INT DEFAULT 500,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### `nexusai_usage`

Control de rate limiting por alumno y por materia.

```sql
CREATE TABLE nexusai_usage (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    date      DATE NOT NULL,
    count     INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, course_id, date)
);
```

Límite del MVP: 50 consultas/alumno/día por materia, configurable desde `nexusai_course_config`.

---

## Relaciones entre tablas

```
nexusai_documents
    └── nexusai_chunks (ON DELETE CASCADE)

nexusai_conversations
    └── nexusai_messages (ON DELETE CASCADE)

nexusai_course_config  (1 registro por course_id)
nexusai_usage          (1 registro por user_id + course_id + date)
```

Las tablas no tienen foreign keys hacia las tablas de Moodle (`mdl_course`, `mdl_user`) porque el plugin local accede a esos datos a través de la API de Moodle (`$DB`, `$COURSE`, `$USER`), no con joins directos. Los IDs de Moodle se almacenan como `BIGINT` simples.

---

## Resumen de índices

| Tabla | Índice | Propósito |
|---|---|---|
| `nexusai_chunks` | HNSW sobre `embedding` (coseno) | Búsqueda semántica ANN |
| `nexusai_chunks` | `(document_id)` | Obtener chunks de un documento al re-indexar |
| `nexusai_documents` | `(course_id, status)` | Obtener documentos activos de un curso |
| `nexusai_conversations` | `(user_id, course_id)` | Cargar historial de un usuario en un curso |
| `nexusai_messages` | `(conversation_id, created_at)` | Paginar mensajes de una conversación |

---

## Migración MVP → Producción (cambio de dimensiones)

Al escalar de Gemini Embedding (768 dims) a text-embedding-3-small (1536 dims):

```sql
-- 1. Eliminar el índice HNSW viejo
DROP INDEX IF EXISTS nexusai_chunks_embedding_idx;

-- 2. Cambiar la columna de dimensiones
ALTER TABLE nexusai_documents ALTER COLUMN embedding vector(1536);

-- Nota: en PostgreSQL con pgvector, cambiar el tipo de la columna
-- requiere recrearla. En la práctica, se hace con una migración:
ALTER TABLE nexusai_chunks DROP COLUMN embedding;
ALTER TABLE nexusai_chunks ADD COLUMN embedding vector(1536);

-- 3. Recrear el índice HNSW
CREATE INDEX ON nexusai_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- 4. Marcar todos los documentos como pending para re-indexación
UPDATE nexusai_documents SET status = 'pending', indexed_at = NULL;
```

Después de la migración, el worker de indexación procesa todos los documentos en `status = 'pending'`.

---

## Decisiones tomadas para NexusAI

- **PostgreSQL único con pgvector.** Sin base de datos secundaria.
- **MVP:** columna `embedding vector(768)`. **Producción:** `embedding vector(1536)`.
- **ON DELETE CASCADE** en `nexusai_chunks` y `nexusai_messages` para simplificar borrados.
- **`context_chunks` JSONB** en `nexusai_messages` como base para analytics del docente (post-MVP).
- **`nexusai_usage`** para rate limiting desde el Sprint 1.
- No se usan foreign keys hacia tablas de Moodle — acceso vía API de Moodle.

## Abierto / pendiente

- [ ] Definir script de migración completo para el salto 768 → 1536 dims al pasar a producción.
- [ ] Evaluar si `context_chunks` JSONB es suficiente para el dashboard de analytics o si se necesita una tabla dedicada (post-MVP).
- [ ] Confirmar con técnico UCC si PostgreSQL tiene pgvector instalado o si hay que pedirlo.

## Referencias

- [pgvector — GitHub](https://github.com/pgvector/pgvector)
- [pgvector — HNSW indexing](https://github.com/pgvector/pgvector#hnsw)
- [PostgreSQL — JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
