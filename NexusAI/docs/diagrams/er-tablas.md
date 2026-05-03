# Modelo entidad-relación — tablas propias

Tablas que crea o usa NexusAI en la base de datos PostgreSQL (la **misma** que usa Moodle, gracias a pgvector). Algunas son del plugin Moodle (prefijo `local_nexusai_`), otras son del backend Python (sin prefijo Moodle, gestionadas por el script de migración Python).

```mermaid
erDiagram
    MDL_USER ||--o{ LOCAL_NEXUSAI_MESSAGES : "envía"
    MDL_USER ||--o{ LOCAL_NEXUSAI_USAGE : "consume"
    MDL_COURSE ||--o{ LOCAL_NEXUSAI_MESSAGES : "contexto"
    MDL_COURSE ||--o{ NEXUSAI_DOCUMENTS : "tiene"
    MDL_FILES ||--o| NEXUSAI_DOCUMENTS : "referencia"
    NEXUSAI_DOCUMENTS ||--o{ NEXUSAI_CHUNKS : "compone"
    LOCAL_NEXUSAI_MESSAGES ||--o| LOCAL_NEXUSAI_FEEDBACK : "califica"

    LOCAL_NEXUSAI_MESSAGES {
        bigint id PK
        bigint userid FK "→ mdl_user.id"
        bigint courseid FK "→ mdl_course.id"
        text message "Pregunta del alumno"
        text response "Respuesta de la IA"
        text model_used "modelo activo: gemini-2.0-flash, gpt-4o-mini, etc."
        int tokens_input
        int tokens_output
        int chunks_retrieved "Cuántos chunks usó el RAG"
        bigint timecreated
    }

    LOCAL_NEXUSAI_USAGE {
        bigint id PK
        bigint userid FK "→ mdl_user.id"
        bigint courseid FK "→ mdl_course.id"
        date date
        int count "Consultas del día"
    }

    NEXUSAI_DOCUMENTS {
        bigint id PK
        bigint courseid FK "→ mdl_course.id"
        text contenthash FK "→ mdl_files.contenthash"
        text filename
        text status "pending, indexing, indexed, error"
        text embedding_model "modelo usado al indexar"
        bigint timeindexed
        text error_message "Si status=error"
    }

    NEXUSAI_CHUNKS {
        bigint id PK
        bigint document_id FK "→ nexusai_documents.id ON DELETE CASCADE"
        int chunk_index
        text chunk_text
        int token_count
        vector embedding "vector(768) MVP / vector(1536) prod"
        timestamptz created_at
    }

    LOCAL_NEXUSAI_FEEDBACK {
        bigint id PK
        bigint messageid FK "→ local_nexusai_messages.id"
        int rating "1=thumbs up, -1=thumbs down"
        text comment "Comentario opcional"
        bigint timecreated
    }

    MDL_USER {
        bigint id PK
        text firstname
        text lastname
        text email
    }

    MDL_COURSE {
        bigint id PK
        text fullname
        text shortname
    }

    MDL_FILES {
        bigint id PK
        text contenthash
        text filename
        text mimetype
    }
```

## Notas

- **`mdl_user`, `mdl_course`, `mdl_files`** son tablas existentes de Moodle (no las crea NexusAI, solo se referencian).
- **`local_nexusai_*`** son tablas del plugin Moodle, definidas en `plugin/local/nexusai/db/install.xml` (esquema XMLDB).
- **`nexusai_documents` y `nexusai_chunks`** las gestiona el backend Python (script de migración) porque incluyen el tipo `vector(N)` que XMLDB de Moodle no soporta.
- **`nexusai_chunks`** tiene un **índice HNSW de pgvector** sobre `embedding` con distancia coseno (`vector_cosine_ops`, `m=16`, `ef_construction=200`).
- **`ON DELETE CASCADE`** en `nexusai_chunks(document_id)` simplifica re-indexación: borrar el documento limpia automáticamente sus chunks.
- **`local_nexusai_messages`** guarda el historial completo de conversación. El alumno ve solo sus propios mensajes; el docente ve los de todos los alumnos del curso (con capability `manage`).
- **`local_nexusai_usage`** se usa para rate limiting. Una fila por (usuario, curso, día).
- **`local_nexusai_feedback`** captura thumbs up/down por respuesta. Crítico para evaluación de calidad post-MVP.

## Migración entre dimensiones

El campo `nexusai_chunks.embedding` cambia de `vector(768)` (MVP con Gemini) a `vector(1536)` (producción con OpenAI). Esto implica:

```sql
-- Migración 768 → 1536:
ALTER TABLE nexusai_chunks ALTER COLUMN embedding TYPE vector(1536);
-- + DROP + CREATE INDEX (HNSW no soporta cambio de dimensión in-place)
DROP INDEX nexusai_chunks_embedding_idx;
CREATE INDEX nexusai_chunks_embedding_idx ON nexusai_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);
-- + re-indexar todos los chunks con el nuevo modelo de embeddings
```

Ver [`investigacion/03-openai/embeddings.md`](../../investigacion/03-openai/embeddings.md) y [ADR-002](../adr/002-pgvector.md).

## Privacy API

Todas las tablas `local_nexusai_*` **deben declararse en** `plugin/local/nexusai/classes/privacy/provider.php` con `add_database_table()`. Además, hay que declarar la **ubicación externa** del proveedor LLM con `add_external_location_link()` de forma genérica (`llm_provider`), no atada a un proveedor específico.

Ver [`investigacion/01-moodle/seguridad-capabilities.md`](../../investigacion/01-moodle/seguridad-capabilities.md).
