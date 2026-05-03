# Modelo entidad-relación — tablas propias del plugin

Tablas que crea el plugin `local_nexusai` en la base de datos PostgreSQL compartida con Moodle. Definidas en `plugin/local/nexusai/db/install.xml` (esquema XMLDB de Moodle).

```mermaid
erDiagram
    MDL_USER ||--o{ LOCAL_NEXUSAI_MESSAGES : "envía"
    MDL_USER ||--o{ LOCAL_NEXUSAI_USAGE : "consume"
    MDL_COURSE ||--o{ LOCAL_NEXUSAI_MESSAGES : "contexto"
    MDL_COURSE ||--o{ LOCAL_NEXUSAI_INDEXED_FILES : "tiene"
    MDL_FILES ||--o| LOCAL_NEXUSAI_INDEXED_FILES : "indexado"
    LOCAL_NEXUSAI_MESSAGES ||--o| LOCAL_NEXUSAI_FEEDBACK : "califica"

    LOCAL_NEXUSAI_MESSAGES {
        bigint id PK
        bigint userid FK "→ mdl_user.id"
        bigint courseid FK "→ mdl_course.id"
        text message "Pregunta del alumno"
        text response "Respuesta de la IA"
        text model_used "gpt-4o-mini, gpt-4o"
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

    LOCAL_NEXUSAI_INDEXED_FILES {
        bigint id PK
        bigint courseid FK "→ mdl_course.id"
        bigint contenthash FK "→ mdl_files.contenthash"
        text filename
        bigint timeindexed
        int chunks_count "Chunks generados"
        text status "pending, indexing, indexed, error"
        text error_message "Si status=error"
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

- **`mdl_user`, `mdl_course`, `mdl_files`** son tablas existentes de Moodle (no las crea el plugin, solo se referencian).
- **`{local_nexusai_messages}`** guarda **el historial completo de conversación**. El alumno ve solo sus propios mensajes; el docente ve los de todos los alumnos del curso (con capability `manage`).
- **`{local_nexusai_usage}`** se usa para rate limiting. Una fila por (usuario, curso, día).
- **`{local_nexusai_indexed_files}`** registra el estado de indexación. Permite mostrar al docente "estado: indexado / pendiente / error" sin tener que consultar ChromaDB.
- **`{local_nexusai_feedback}`** captura thumbs up/down por respuesta. Crítico para evaluación de calidad post-MVP.

## Privacy API

Todas estas tablas **deben declararse en** `classes/privacy/provider.php` con `add_database_table()`. Además, hay que declarar la **ubicación externa** OpenAI con `add_external_location_link()` para los datos que viajan al LLM.

Ver [`investigacion/01-moodle/seguridad-capabilities.md`](../../investigacion/01-moodle/seguridad-capabilities.md).
