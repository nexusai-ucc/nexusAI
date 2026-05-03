# Secuencia — alumno hace una pregunta

Diagrama de secuencia detallado del happy path: alumno escribe, recibe respuesta con streaming.

```mermaid
sequenceDiagram
    autonumber
    actor A as Alumno
    participant R as React (browser)
    participant P as Plugin PHP (Moodle)
    participant F as FastAPI (backend)
    participant C as ChromaDB
    participant Re as Redis
    participant O as OpenAI

    A->>R: Escribe pregunta y envía
    R->>R: validate input
    R->>P: core/ajax → local_nexusai_send_message<br/>{courseid, message, sesskey}

    P->>P: require_login()
    P->>P: has_capability('local/nexusai:use')
    P->>Re: GET rate_limit:user:date
    Re-->>P: count actual
    alt count > 50
        P-->>R: error "rate limit"
        R-->>A: muestra mensaje
    else count <= 50
        P->>P: increment usage in mdl
        P->>P: build payload + HMAC SHA-256

        P->>F: POST /api/chat<br/>headers: HMAC + Bearer + timestamp<br/>body: {question, course_id, user_id}

        F->>F: verify HMAC + timestamp window
        F->>F: verify Bearer

        F->>O: embed(question)<br/>text-embedding-3-small
        O-->>F: vector 1536d

        F->>C: query top-5 chunks<br/>where course_id
        C-->>F: chunks + metadata + distances

        alt min distance > 0.7
            F-->>P: respuesta fallback honesto
            P-->>R: respuesta
            R-->>A: muestra mensaje
        else min distance <= 0.7
            F->>F: build prompt<br/>(system + historial + contexto + pregunta)
            F->>O: chat.completions.create<br/>gpt-4o-mini, stream=True
            loop por cada token
                O-->>F: token chunk
                F-->>P: SSE data: {token}
                P-->>R: SSE proxy
                R-->>A: token aparece en UI
            end
            F->>F: persistir mensaje + tokens en mdl
        end
    end
```

## Notas técnicas

- **Sesskey de Moodle** valida CSRF + sesión activa del usuario.
- **HMAC** se valida con ventana de timestamp de 5 min (anti-replay).
- **Si el rate limit se excede**, el plugin no llama al backend — corta antes.
- **Streaming SSE** se proxea de FastAPI a través de PHP a React. PHP necesita `flush()` después de cada chunk.
- **Persistencia** ocurre al final, tras stream completo. Si hay un error mid-stream, se logea pero no se guarda.

## Errores comunes y manejo

| Punto | Error | Comportamiento |
|---|---|---|
| 3 | sesskey inválido | Moodle rechaza con 403 |
| 6-7 | sin permiso | PHP responde "no autorizado" |
| 13 | HMAC inválido o vencido | FastAPI responde 401, PHP loguea y muestra error genérico |
| 15-17 | OpenAI rate limit | Reintento con backoff exponencial (max 3) |
| 18 | ChromaDB error | Fallback degradado: respuesta sin contexto + warning |
| 27 | Stream interrumpido | Cliente reintenta o muestra "respuesta incompleta" |
