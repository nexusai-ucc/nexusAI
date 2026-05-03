# `services/` — Servicios backend

Cada subcarpeta es un servicio Python independiente. Pensado como **modular monolith** para el MVP: en la práctica solo `api/` está activo, pero la estructura de carpetas permite extraer servicios sin reorganizar el repo (ver [`docs/adr/001-monolito-modular.md`](../docs/adr/001-monolito-modular.md)).

## Estructura

```
services/
└── api/                          # Backend principal — FastAPI
    ├── app/
    │   ├── main.py               # Entry point + mount de routers
    │   ├── config.py             # Settings (Pydantic)
    │   ├── chat/                 # Dominio "chat" (RAG + LLM)
    │   ├── documents/            # Dominio "indexación de documentos"
    │   ├── analytics/            # Dominio "analytics" (post-MVP)
    │   ├── infrastructure/       # Clientes externos (OpenAI, ChromaDB, Redis)
    │   ├── shared/               # Auth HMAC, observability, helpers
    │   └── prompts/              # System prompts versionados
    ├── tests/
    ├── data/                     # ChromaDB persistente (gitignored)
    ├── Dockerfile
    ├── pyproject.toml
    └── requirements.txt
```

## Servicios futuros (post-MVP)

Si en el futuro necesitamos extraer servicios:

```
services/
├── api/                          # API principal (chat, documents)
├── indexer/                      # Worker async para indexación pesada (Celery/RQ)
└── analytics/                    # Servicio de analytics agregadas
```

Ver el ADR-001 para el criterio de cuándo splitear.

## Cómo desarrollar acá

Ver [`investigacion/10-setup-entorno/python-fastapi.md`](../investigacion/10-setup-entorno/python-fastapi.md).

## Convenciones

- Python 3.11+.
- Ruff (linter + formatter).
- mypy (type checking).
- PyTest (tests).
- Pydantic v2 para schemas.
