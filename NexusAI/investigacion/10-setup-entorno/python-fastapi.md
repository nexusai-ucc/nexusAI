# Setup Python + FastAPI local

> **Resumen:** Cómo levantar el backend Python de NexusAI en local. Python 3.11, venv, FastAPI + Uvicorn con hot-reload, ChromaDB y Redis por Docker Compose.

---

## Contexto

El backend FastAPI es la pieza donde vive el pipeline RAG. Este doc explica cómo cualquiera del equipo lo levanta en menos de 10 minutos.

## Prerrequisitos

- Python 3.11+ (`python3 --version`).
- Docker + Docker Compose.
- Cuenta OpenAI con API key.
- Git.

## Setup paso a paso

### 1. Clonar repo

```bash
cd ~/dev
git clone git@github.com:delfisalinasmich/nexusAI.git
cd nexusAI/backend
```

### 2. Entorno virtual

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Variables de entorno

```bash
cp .env.example .env
# Editar .env y completar:
#   OPENAI_API_KEY=sk-...
#   NEXUSAI_SHARED_SECRET=<generar con: openssl rand -hex 32>
#   NEXUSAI_API_KEY=<generar con: openssl rand -hex 32>
```

`.env.example` template:

```env
ENV=development
APP_VERSION=0.1.0

# OpenAI
OPENAI_API_KEY=sk-REPLACE
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# ChromaDB
CHROMA_PATH=./data/chromadb

# HMAC
NEXUSAI_SHARED_SECRET=REPLACE_WITH_HEX_32
NEXUSAI_API_KEY=REPLACE_WITH_HEX_32
HMAC_REPLAY_WINDOW_SEC=300

# Rate limiting
RATE_LIMIT_PER_USER_DAILY=50

# Redis (cache)
REDIS_URL=redis://localhost:6379/0
```

### 4. Arrancar servicios de soporte con Docker

```bash
docker compose up -d redis
```

(ChromaDB corre in-process, no necesita servicio separado.)

### 5. Arrancar FastAPI

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Abrir http://localhost:8000/docs para ver Swagger UI.

## Alternativa: todo Docker

```bash
docker compose up --build
```

`docker-compose.yml`:

```yaml
services:
  fastapi:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    volumes:
      - ./app:/app/app
      - ./data:/data
    depends_on: [redis]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

## `requirements.txt` base

```txt
fastapi==0.110.0
uvicorn[standard]==0.27.0
pydantic==2.6.0
pydantic-settings==2.2.0
openai==1.14.0
chromadb==0.4.24
pdfplumber==0.10.0
python-docx==1.1.0
tiktoken==0.6.0
redis==5.0.0
httpx==0.27.0
python-multipart==0.0.9

# Dev
pytest==8.0.0
pytest-asyncio==0.23.0
ruff==0.3.0
mypy==1.9.0
```

## Comandos frecuentes

```bash
# Correr tests
pytest

# Lint
ruff check app/
ruff format app/

# Type check
mypy app/

# Curl rápido a /health
curl http://localhost:8000/health

# Curl firmado (ejemplo) — en dev, generar firma HMAC
python scripts/sign_request.py --endpoint /api/chat --payload '{"question":"test","course_id":1,"user_id":1}'
```

## Integración con Moodle Docker

Para que Moodle Docker (puerto 8000) y FastAPI (puerto 8000) **no choquen**:

- Moodle Docker → `http://localhost:8000`
- FastAPI → cambiar puerto a `8001`:
  ```bash
  uvicorn app.main:app --port 8001 --reload
  ```
- En Moodle, setear `backend URL` = `http://host.docker.internal:8001` (desde el container de Moodle el host es `host.docker.internal`).

## Dev loop recomendado

1. Cambio en `app/` → Uvicorn hace hot-reload automático.
2. Cambio en `requirements.txt` → `pip install -r requirements.txt`.
3. Cambio en schema de ChromaDB → borrar `./data/chromadb` y re-indexar.
4. Cambio en `.env` → **reiniciar Uvicorn** (no hay hot-reload para env vars).

## Troubleshooting

| Síntoma | Causa | Solución |
|---|---|---|
| `openai.AuthenticationError` | API key mal copiada | Verificar `.env`, regenerar si hace falta |
| `chromadb.errors.NoIndexException` | Colección no existe | Indexar al menos un archivo antes de buscar |
| `redis.exceptions.ConnectionError` | Docker no corre | `docker compose up -d redis` |
| `HTTP 401 Invalid signature` al probar | Clock skew entre PHP y Python | Verificar hora del sistema + ventana HMAC |
| `Address already in use` | Puerto 8000 ocupado | `lsof -i :8000` → kill o usar `--port 8001` |

## Decisiones tomadas para NexusAI

- **Python 3.11** (estable, buena performance, compatible con todas las libs).
- **venv + pip** (no `poetry` ni `uv` por ahora — simple).
- **FastAPI + Uvicorn --reload** en dev.
- **Redis por Docker** para cache.
- **Ruff** como linter y formatter (reemplaza Black + Flake8 + isort).
- **PyTest** como test runner.
- **`.env.example` versionado** (sin secretos reales).

## Abierto / pendiente

- [ ] Decidir si migramos a `uv` (package manager ultra rápido).
- [ ] Script `scripts/dev.sh` que haga setup inicial en un comando.
- [ ] Pre-commit hooks (ruff, mypy) antes del Sprint 2.

## Referencias

- [FastAPI — First steps](https://fastapi.tiangolo.com/tutorial/first-steps/)
- [Uvicorn docs](https://www.uvicorn.org/)
- [Ruff — Python linter](https://docs.astral.sh/ruff/)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
