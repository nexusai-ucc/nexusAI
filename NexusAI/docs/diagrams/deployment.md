# Diagrama de despliegue — MVP

Cómo y dónde corre cada componente en producción durante el MVP.

```mermaid
flowchart TB
    subgraph UCC["UCC — Infraestructura universidad"]
        MOODLE["Moodle 4.x<br/>(servidor existente UCC)<br/>+ plugin local_nexusai instalado"]
        POSTGRES_UCC[("PostgreSQL<br/>(de Moodle UCC)<br/>+ tablas local_nexusai_*")]
    end

    subgraph CLOUD["Railway Hobby (~$5/mes)"]
        DOCKER["Docker container<br/>FastAPI + Uvicorn<br/>+ ChromaDB embedded<br/>(volumen persistente)"]
        REDIS_C[("Redis container<br/>cache + rate limit")]
    end

    subgraph OPENAI["OpenAI"]
        API_O["API GPT-4o-mini<br/>+ text-embedding-3-small"]
    end

    subgraph BROWSER["Alumnos / docentes"]
        NAV["Navegador<br/>https://moodle.ucc.edu.ar"]
    end

    NAV -->|HTTPS| MOODLE
    MOODLE -->|HTTPS + HMAC<br/>puerto 443| DOCKER
    MOODLE <--> POSTGRES_UCC
    DOCKER <--> REDIS_C
    DOCKER -->|HTTPS<br/>Bearer key| API_O

    style MOODLE fill:#fff3e0,color:#000,stroke:#f57c00
    style DOCKER fill:#e8f5e9,color:#000,stroke:#388e3c
    style API_O fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style POSTGRES_UCC fill:#e1f5fe,color:#000,stroke:#0277bd
```

## Costos mensuales (proyección 500 alumnos)

| Componente | Hosting | Costo mensual |
|---|---|---|
| Moodle + PostgreSQL | UCC (existente) | $0 (infra de la facu) |
| FastAPI + ChromaDB | Railway Hobby | $5 |
| Redis | Railway add-on | incluido |
| OpenAI tokens | Pay-as-you-go (GPT-4o-mini) | ~$100 |
| Dominio + SSL | Cloudflare/Let's Encrypt | $1 |
| **Total** | | **~$106/mes** |

Equivalente a ~**$0.21/alumno/mes**. Detalle en [`investigacion/03-openai/costos-rate-limits.md`](../../investigacion/03-openai/costos-rate-limits.md).

## Restricciones de UCC a tener en cuenta

- Salida HTTPS por puerto **443** únicamente (firewall universitario).
- Posible proxy saliente — la `class curl` de Moodle lo respeta vía `$CFG->proxyhost`.
- Whitelist de dominios externos: el dominio del backend NexusAI debe ser aprobado por IT UCC.

## Plan de despliegue gradual

```mermaid
flowchart LR
    A[Demo Docker local<br/>(defensa MVP)] --> B[Staging UCC<br/>(post-MVP)]
    B --> C[Piloto 1 curso<br/>(con Leandro)]
    C --> D[Producción multi-curso<br/>(post-PI)]
```

Más detalle en [`investigacion/09-relevamiento/requisitos-ucc.md`](../../investigacion/09-relevamiento/requisitos-ucc.md).
