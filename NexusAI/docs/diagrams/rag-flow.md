# Flujo RAG — indexación y retrieval

## Indexación (offline)

Ocurre cuando el docente sube material nuevo o pide reindexar.

```mermaid
flowchart LR
    A[PDFs/DOCX/TXT<br/>en mdl_files] -->|cron o trigger docente| B[Plugin PHP<br/>extrae binario]
    B -->|HMAC + multipart| C[FastAPI<br/>POST /api/documents/index]
    C --> D[pdfplumber<br/>extract_text por página]
    D --> E[Limpieza<br/>headers, footers, wraps,<br/>espacios múltiples]
    E --> F[Chunking<br/>500 tokens / 10% overlap<br/>respetando párrafos]
    F --> G[+ metadata:<br/>file_id, file_name,<br/>page, chunk_idx]
    G --> H[Embedding batch<br/>text-embedding-3-small<br/>1536 dim]
    H --> I[(ChromaDB<br/>collection course_X<br/>HNSW + cosine)]
    I --> J[Update tabla<br/>local_nexusai_indexed_files<br/>status=indexed]

    style C fill:#e8f5e9,color:#000
    style I fill:#fce4ec,color:#000
    style J fill:#fff3e0,color:#000
```

**Costo:** ~$0.10 por 10.000 chunks (≈ una materia completa).
**Tiempo:** ~5-15 min para una materia de 10 PDFs.

## Retrieval + generación (online, por consulta)

```mermaid
flowchart LR
    Q[Pregunta del alumno] --> EM[Embedding<br/>text-embedding-3-small<br/>~100 ms]
    EM --> SEARCH[ChromaDB.query<br/>top-5 chunks<br/>where course_id<br/>~30 ms]
    SEARCH --> FILTER{¿Distancia<br/>< 0.7?}
    FILTER -->|sí| BUILD[Build prompt<br/>system + historial + contexto + pregunta<br/>~3.200 tokens input]
    FILTER -->|no| FALLBACK["Fallback honesto:<br/>'No encuentro esta información<br/>en el material de la materia'"]
    BUILD --> GPT[GPT-4o-mini<br/>chat completion stream<br/>~1-2 s]
    GPT --> STREAM[Streaming SSE al alumno]
    STREAM --> SAVE[Persistir en<br/>local_nexusai_messages<br/>+ contador usage]

    style EM fill:#f3e5f5,color:#000
    style SEARCH fill:#fce4ec,color:#000
    style GPT fill:#f3e5f5,color:#000
    style FALLBACK fill:#ffebee,color:#000
```

**Latencia objetivo:** 1.5 - 5 s end-to-end.
**Streaming SSE:** primer token visible en ~700 ms.

## Notas

- **Una colección ChromaDB por curso** — aislamiento total entre materias.
- **Fallback honesto** disparado cuando la mejor distancia coseno > 0.7 (umbral calibrable).
- **Streaming SSE** crítico para UX — sin streaming, el alumno espera 5 s en blanco.
- **Persistencia post-respuesta** para historial y analytics.
