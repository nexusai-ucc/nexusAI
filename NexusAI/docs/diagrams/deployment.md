# Diagrama de despliegue

Cómo y dónde corre cada componente. Hay dos escenarios: **MVP** (con Gemini gratuito) y **producción** (con OpenAI).

## MVP (demo al jurado, piloto con docentes)

```mermaid
flowchart TB
    subgraph UCC["UCC — Infraestructura universidad"]
        MOODLE["Moodle 4.x<br/>(servidor existente UCC)<br/>+ plugin local_nexusai instalado"]
        POSTGRES_UCC[("PostgreSQL UCC<br/>+ extensión pgvector<br/>tablas Moodle + nexusai_*")]
        MOODLE <--> POSTGRES_UCC
    end

    subgraph CLOUD["Railway Hobby (~$5/mes)"]
        DOCKER["Docker container<br/>FastAPI + Uvicorn"]
        REDIS_C[("Redis container<br/>cache + rate limit + nonce")]
    end

    subgraph LLMSVC["Externo (configurable)"]
        GEMINI["Gemini 2.5 Flash<br/>tier gratuito ($0)"]
    end

    subgraph BROWSER["Alumnos / docentes"]
        NAV["Navegador<br/>https://moodle.ucc.edu.ar"]
    end

    NAV -->|HTTPS| MOODLE
    MOODLE -->|HTTPS + HMAC<br/>puerto 443| DOCKER
    DOCKER -->|"SQL + vector<br/>(misma DB que Moodle)"| POSTGRES_UCC
    DOCKER <--> REDIS_C
    DOCKER -->|HTTPS<br/>Bearer key| GEMINI

    style MOODLE fill:#fff3e0,color:#000,stroke:#f57c00
    style DOCKER fill:#e8f5e9,color:#000,stroke:#388e3c
    style GEMINI fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style POSTGRES_UCC fill:#e1f5fe,color:#000,stroke:#0277bd
```

## Producción (UCC completa, 500 alumnos)

```mermaid
flowchart TB
    subgraph UCC2["UCC — Infraestructura universidad"]
        MOODLE2["Moodle 4.x<br/>(servidor existente UCC)<br/>+ plugin local_nexusai instalado"]
        POSTGRES_UCC2[("PostgreSQL UCC<br/>+ extensión pgvector<br/>tablas Moodle + nexusai_*")]
        MOODLE2 <--> POSTGRES_UCC2
    end

    subgraph CLOUD2["Hetzner CX23 / DigitalOcean (~$6/mes)"]
        DOCKER2["Docker container<br/>FastAPI + Uvicorn"]
        REDIS_C2[("Redis container")]
    end

    subgraph OAI["OpenAI"]
        OAIAPI["GPT-4o-mini (~$100/mes)<br/>+ text-embedding-3-small (~$1/mes)"]
    end

    subgraph BROWSER2["Alumnos / docentes (500)"]
        NAV2["Navegador<br/>https://moodle.ucc.edu.ar"]
    end

    NAV2 -->|HTTPS| MOODLE2
    MOODLE2 -->|HTTPS + HMAC| DOCKER2
    DOCKER2 -->|SQL + vector| POSTGRES_UCC2
    DOCKER2 <--> REDIS_C2
    DOCKER2 -->|HTTPS + Bearer| OAIAPI

    style MOODLE2 fill:#fff3e0,color:#000,stroke:#f57c00
    style DOCKER2 fill:#e8f5e9,color:#000,stroke:#388e3c
    style OAIAPI fill:#f3e5f5,color:#000,stroke:#7b1fa2
    style POSTGRES_UCC2 fill:#e1f5fe,color:#000,stroke:#0277bd
```

## Costos comparados

### MVP (con Gemini gratuito)

| Componente | Hosting | Costo mensual |
|---|---|---|
| Moodle + PostgreSQL/pgvector | UCC (existente) | $0 |
| FastAPI | Railway Hobby | $5 |
| Redis | Railway add-on | incluido |
| Gemini 2.5 Flash | Tier gratuito | **$0** |
| Dominio + SSL | Cloudflare/Let's Encrypt | $1 |
| **Total MVP** | | **~$6/mes** |

### Producción (500 alumnos UCC con GPT-4o-mini)

| Componente | Hosting | Costo mensual |
|---|---|---|
| Moodle + PostgreSQL/pgvector | UCC (existente) | $0 |
| FastAPI | Hetzner CX23 / DigitalOcean | ~$6 |
| Redis | Self-host en mismo VPS | incluido |
| GPT-4o-mini (chat) | Pay-as-you-go | ~$100 |
| text-embedding-3-small | Pay-as-you-go | ~$1 |
| Dominio + SSL | — | $1 |
| **Total producción** | | **~$108/mes** |

Equivalente a ~**$0.22/alumno/mes**. Detalle en [`investigacion/03-openai/costos-rate-limits.md`](../../investigacion/03-openai/costos-rate-limits.md).

## Restricciones de UCC a tener en cuenta

- Salida HTTPS por puerto **443** únicamente (firewall universitario).
- Posible proxy saliente — la `class curl` de Moodle lo respeta vía `$CFG->proxyhost`.
- Whitelist de dominios externos: el dominio del backend NexusAI debe ser aprobado por IT UCC. Mismo trámite para `generativelanguage.googleapis.com` (Gemini) o `api.openai.com` (producción).
- **pgvector debe instalarse en el PostgreSQL de UCC** — `CREATE EXTENSION vector;`. Es una operación trivial pero requiere permisos de superusuario.

## Plan de despliegue gradual

```mermaid
flowchart LR
    A[Demo Docker local<br/>(defensa MVP - jurado)] --> B[Staging UCC<br/>(post-MVP)]
    B --> C[Piloto 1 curso con Leandro<br/>(Gemini gratuito)]
    C --> D[Piloto multi-curso<br/>(Gemini gratuito mientras alcance)]
    D --> E[Producción UCC completa<br/>(switch a OpenAI cuando se rompa cuota Gemini)]
```

Más detalle en [`investigacion/09-relevamiento/requisitos-ucc.md`](../../investigacion/09-relevamiento/requisitos-ucc.md).

Decisiones formalizadas: [ADR-002](../adr/002-pgvector.md), [ADR-004](../adr/004-gemini-mvp-openai-prod.md).
