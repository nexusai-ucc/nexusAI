# Secuencia — alumno hace una pregunta

Diagrama de secuencia detallado del happy path: alumno escribe, recibe respuesta con streaming.

```mermaid
sequenceDiagram
    autonumber
    actor A as Alumno
    participant R as React (browser)
    participant P as Plugin PHP (Moodle)
    participant F as FastAPI (backend)
    participant PG as PostgreSQL/pgvector
    participant Re as Redis
    participant E as EmbeddingProvider
    participant L as LLMProvider

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

        P->>F: POST /api/chat<br/>headers: HMAC + Bearer + timestamp + nonce<br/>body: {question, course_id, user_id}

        F->>F: HMACSecurityMiddleware<br/>verify HMAC + timestamp window + nonce
        F->>F: verify Bearer

        F->>E: embed(question)
        E-->>F: vector (768 o 1536 dim)

        F->>PG: SELECT ... ORDER BY embedding ⟨=⟩ $1<br/>WHERE course_id = $2 AND status = 'indexed'<br/>LIMIT 5
        PG-->>F: chunks + metadata + distances

        alt min distance > 0.7
            F-->>P: respuesta fallback honesto
            P-->>R: respuesta
            R-->>A: muestra mensaje
        else min distance <= 0.7
            F->>F: build prompt<br/>(system + historial + contexto + pregunta)
            F->>L: chat.completions.create<br/>(stream=True)
            loop por cada token
                L-->>F: token chunk
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
- **HMAC + nonce** se valida con ventana de timestamp de 5 min (anti-replay) + nonce tracking en Redis (anti-reuse).
- **Si el rate limit se excede**, el plugin no llama al backend — corta antes.
- **Una sola query a la DB** para retrieval: filtros SQL + búsqueda vectorial en la misma operación gracias a pgvector.
- **EmbeddingProvider y LLMProvider** son intercambiables vía variables de entorno. En MVP son Gemini, en producción OpenAI.
- **Streaming SSE** se proxea de FastAPI a través de PHP a React. PHP necesita `flush()` después de cada chunk.
- **Persistencia** ocurre al final, tras stream completo. Si hay un error mid-stream, se logea pero no se guarda.

## Errores comunes y manejo

| Punto | Error | Comportamiento |
|---|---|---|
| 3 | sesskey inválido | Moodle rechaza con 403 |
| 6-7 | sin permiso | PHP responde "no autorizado" |
| 13 | HMAC inválido o vencido | FastAPI responde 401, PHP loguea y muestra error genérico |
| 14 | nonce ya usado (replay) | FastAPI responde 401, PHP loguea como sospechoso |
| 16-17 | LLM rate limit | Reintento con backoff exponencial (max 3) |
| 19 | pgvector error | Fallback degradado: respuesta sin contexto + warning |
| 30 | Stream interrumpido | Cliente reintenta o muestra "respuesta incompleta" |
