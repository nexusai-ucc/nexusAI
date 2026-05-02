# Estructura del backend FastAPI

> **Resumen:** Layout del proyecto Python, endpoints del MVP, hosting recomendado (Render free en dev, Railway Hobby para la demo ante jurado). CORS solo si lo precisamos — con el patrón PHP proxy, no hace falta.

---

## Contexto

FastAPI es el backend de IA. Orquesta el pipeline RAG: recibe la pregunta desde el plugin Moodle (vía HMAC), busca en ChromaDB, llama a OpenAI, devuelve la respuesta.

## Layout del proyecto

```
backend/
├── app/
│   ├── main.py                      # FastAPI app + mount de routers
│   ├── config.py                    # Settings (Pydantic Settings + env vars)
│   ├── auth/
│   │   └── hmac.py                  # verify_request dependency
│   ├── routers/
│   │   ├── chat.py                  # POST /api/chat, POST /api/chat/stream
│   │   ├── documents.py             # POST /api/documents/index, DELETE /api/documents/{id}
│   │   └── health.py                # GET /health, GET /ready
│   ├── services/
│   │   ├── llm_provider.py
│   │   ├── embedding_provider.py
│   │   ├── rag.py                   # Pipeline: retrieve + build prompt + generate
│   │   └── documents.py             # pdfplumber + chunking + indexación
│   ├── models/
│   │   └── schemas.py               # Pydantic models (ChatRequest, ChatResponse, etc.)
│   └── prompts/
│       └── academic_system.txt      # System prompt versionado
├── tests/
│   ├── test_chat.py
│   ├── test_rag.py
│   └── test_hmac.py
├── data/                            # Volumen persistente (ChromaDB)
├── Dockerfile
├── docker-compose.yml               # Dev: FastAPI + ChromaDB + Redis
├── requirements.txt
├── pyproject.toml                   # Ruff + pytest config
└── .env.example
```

## Endpoints del MVP

| Método | Path | Uso | Auth |
|---|---|---|---|
| `POST` | `/api/chat` | Pregunta → respuesta completa. | HMAC |
| `POST` | `/api/chat/stream` | Pregunta → respuesta streaming (SSE). | HMAC |
| `POST` | `/api/documents/index` | Indexar PDF enviado desde PHP. | HMAC |
| `DELETE` | `/api/documents/{file_id}` | Borrar chunks de un archivo. | HMAC |
| `GET` | `/api/documents/status?course_id=X` | Estado de indexación del curso. | HMAC |
| `GET` | `/health` | Liveness probe. | — |
| `GET` | `/ready` | Readiness (ChromaDB + OpenAI OK). | — |

## `main.py` base

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import chromadb

from app.routers import chat, documents, health
from app.config import settings
from app.core.middleware import HMACSecurityMiddleware

ml_components: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    ml_components["chroma_client"] = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    yield
    ml_components.clear()

app = FastAPI(
    title="NexusAI Backend",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,
)

app.add_middleware(HMACSecurityMiddleware)
app.include_router(health.router)
app.include_router(chat.router,      prefix="/api")
app.include_router(documents.router, prefix="/api/documents")
```

> Patrón Lifespan completo, `HMACSecurityMiddleware` con nonce tracking y dependency injection del cliente ChromaDB en [`lifespan-y-estado.md`](lifespan-y-estado.md).

## Config con Pydantic Settings

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "development"
    APP_VERSION: str = "0.1.0"

    OPENAI_API_KEY: str
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    CHROMA_PATH: str = "/data/chromadb"

    NEXUSAI_SHARED_SECRET: str
    NEXUSAI_API_KEY: str
    HMAC_REPLAY_WINDOW_SEC: int = 300

    RATE_LIMIT_PER_USER_DAILY: int = 50

    class Config:
        env_file = ".env"

settings = Settings()
```

## Hosting — comparativa para proyecto académico

| Plataforma | Costo/mes | HTTPS auto | Persistencia | Ideal para |
|---|---|---|---|---|
| **Render Free** | $0 | ✅ | ❌ (efímero) | **Dev / pruebas** |
| **Railway Hobby** | $5 | ✅ | ✅ volúmenes | **Demo MVP ante jurado** |
| Hetzner CX23 | €3.49 | Manual (Let's Encrypt) | ✅ 40 GB SSD | Mejor precio/performance |
| DigitalOcean | $6 | Manual | ✅ | Docs excelentes |
| Google Cloud Run | $5-20 | ✅ | Afuera (stateless) | Auto-escalado |

**Plan oficial NexusAI:**

- Dev local: Docker Compose (`fastapi` + `chromadb` + `redis`).
- Staging: Render Free.
- Defensa MVP: Railway Hobby ($5).
- Producción piloto (post-MVP): Hetzner + Docker si necesitamos ChromaDB persistente grande.

## Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY app/prompts/ ./app/prompts/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## docker-compose.yml (dev)

```yaml
services:
  fastapi:
    build: .
    volumes:
      - ./data:/data
      - ./app:/app/app  # Hot-reload en dev
    ports:
      - "8000:8000"
    env_file: .env
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## CORS — solo si hace falta

Con el patrón Hybrid PHP Proxy, **no necesitamos CORS** (las requests vienen del server Moodle, no del navegador). Solo activar si en algún momento hacemos llamadas directas desde el navegador:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("MOODLE_URL", "https://moodle.universidad.edu")],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Signature", "X-Timestamp"],
)
```

## Requerimientos de recursos

| Componente | RAM | CPU |
|---|---|---|
| FastAPI + Uvicorn | ~80 MB | 0.1-0.3 vCPU idle, picos 0.5 vCPU |
| ChromaDB (10K vectores) | ~90 MB | Picos 0.2 vCPU en search |
| Redis (cache) | ~20 MB | Despreciable |
| **Total en reposo** | **~200 MB** | — |

Un VPS de **2 GB RAM, 1 vCPU compartido** cubre cómodamente el MVP.

## Decisiones tomadas para NexusAI

- **Python 3.11**, FastAPI + Uvicorn.
- **Pydantic Settings** para config, **Pydantic v2** para schemas.
- **Docker Compose** en dev, imágenes Docker para staging/prod.
- **Railway Hobby** para la defensa.
- **Sin CORS en MVP** (patrón PHP proxy).
- **Ruff + PyTest** como linter y test runner.
- **LLMProvider y EmbeddingProvider** como capas de abstracción. Gemini 2.5 Flash en MVP, GPT-4o-mini en producción. Cambio solo de variables de entorno.

## Abierto / pendiente

- [ ] Decidir si usamos `uv` o `pip` para manejar deps.
- [ ] Setear pipeline CI (lint + test + build) en GitHub Actions antes del Sprint 3.
- [ ] Observabilidad: ¿logs estructurados a stdout + plataforma de logs, o directamente Sentry?
- [ ] Endpoint `/metrics` Prometheus-compatible en post-MVP.

## Referencias

- [FastAPI docs](https://fastapi.tiangolo.com/)
- [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Railway docs](https://docs.railway.app/)
- [Docker — best practices Python](https://docs.docker.com/language/python/)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
