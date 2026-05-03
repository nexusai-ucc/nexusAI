# Diagrama de arquitectura — NexusAI

Vista de componentes del sistema completo. Incluye flujo de datos entre el navegador del alumno, Moodle, el backend Python y los servicios externos.

```mermaid
flowchart TB
    subgraph BROWSER["Navegador del alumno"]
        REACT["React 18<br/>(bundle AMD<br/>chatwidget-lazy.min.js)"]
    end

    subgraph MOODLE["Moodle 4.x — servidor universidad UCC"]
        PHP["Plugin local_nexusai<br/>(PHP)"]
        MFILES[("mdl_files<br/>(material curso)")]
        MTABLES[("local_nexusai_messages<br/>local_nexusai_usage<br/>local_nexusai_indexed_files")]
        MAUTH["require_login()<br/>has_capability()<br/>sesskey"]
    end

    subgraph BACKEND["Backend NexusAI (Railway / Hetzner)"]
        FASTAPI["FastAPI — monolito modular<br/>app.chat / app.documents<br/>app.infrastructure / app.shared"]
        CHROMA[("ChromaDB<br/>(in-process,<br/>collection por curso)")]
        REDIS[(Redis<br/>cache + rate limit)]
    end

    subgraph EXTERNAL["Externo"]
        OPENAI["OpenAI API<br/>GPT-4o-mini<br/>text-embedding-3-small"]
    end

    REACT -->|"core/ajax + sesskey<br/>(mismo origen)"| PHP
    PHP <-->|HMAC SHA-256<br/>+ Bearer + timestamp| FASTAPI
    PHP <--> MFILES
    PHP <--> MTABLES
    PHP <--> MAUTH
    FASTAPI <-->|persist| CHROMA
    FASTAPI <-->|cache| REDIS
    FASTAPI -->|"Bearer key<br/>(server-side only)"| OPENAI

    style REACT fill:#e3f2fd,color:#000,stroke:#1976d2
    style PHP fill:#fff3e0,color:#000,stroke:#f57c00
    style FASTAPI fill:#e8f5e9,color:#000,stroke:#388e3c
    style OPENAI fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style CHROMA fill:#fce4ec,color:#000,stroke:#c2185b
    style REDIS fill:#ffebee,color:#000,stroke:#c62828
```

## Notas

- **El navegador nunca habla con OpenAI directo.** Toda comunicación con OpenAI pasa por el backend Python, donde vive la API key.
- **Mismo origen entre React y Moodle PHP** — sin CORS necesario.
- **HMAC entre Moodle y FastAPI** — protege integridad y previene replay.
- **ChromaDB embedded** en el mismo proceso que FastAPI (modo `PersistentClient`).
- **Redis** se usa para: cache de respuestas idénticas y rate limiting por usuario.
