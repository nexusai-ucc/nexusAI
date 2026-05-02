# Gestión del ciclo de vida y estado global en FastAPI

> **Resumen (3 líneas):** FastAPI gestiona recursos compartidos (clientes de ChromaDB, modelos de embedding) mediante `@asynccontextmanager` como Lifespan, que reemplaza los obsoletos eventos `@app.on_event`. Este documento cubre el patrón Lifespan, el `HMACSecurityMiddleware` como Starlette middleware clase (complementa `autenticacion-hmac.md`) y el ensamblaje completo de `main.py` con routers y middleware.

---

## Contexto

Para que FastAPI pueda servir consultas RAG, necesita mantener conexiones persistentes a ChromaDB y, opcionalmente, pre-cargar modelos de embedding. Instanciar estos clientes en cada request destruye la eficiencia del framework. La solución oficial es el paradigma **Lifespan Context Manager**.

---

## Por qué Lifespan (y no `@app.on_event`)

```python
# ❌ Patrón obsoleto (deprecado desde FastAPI 0.95)
@app.on_event("startup")
async def startup():
    app.state.chroma = chromadb.PersistentClient(...)

@app.on_event("shutdown")
async def shutdown():
    app.state.chroma = None
```

```python
# ✅ Patrón moderno con @asynccontextmanager
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # -- STARTUP --
    ml_components["chroma_client"] = chromadb.PersistentClient(
        path=settings.CHROMA_DATA_DIR
    )
    yield  # La aplicación sirve requests aquí
    # -- SHUTDOWN --
    ml_components.clear()
```

El patrón Lifespan agrupa startup y shutdown en un único bloque coherente. El `yield` es el punto donde la aplicación vive. Esto garantiza que los punteros a recursos se vacíen correctamente durante el apagado del servidor, previniendo memory leaks en producción.

---

## `main.py` completo — ensamblaje de la aplicación

```python
# src/app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
import chromadb

from app.api.routers import chat, ingestion
from app.core.config import settings
from app.core.middleware import HMACSecurityMiddleware

# Diccionario de estado global — accesible vía dependency injection
ml_components: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización del cliente vectorial persistente
    ml_components["chroma_client"] = chromadb.PersistentClient(
        path=settings.CHROMA_DATA_DIR
    )
    # Aquí se puede pre-calentar el modelo de embedding si fuera necesario
    yield
    # Limpieza sistemática durante el apagado
    ml_components.clear()


app = FastAPI(
    title="Nexus AI Backend Server",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENV != "production" else None,
)

# Middleware de seguridad perimetral (intercepta ANTES de los routers)
app.add_middleware(HMACSecurityMiddleware)

# Ensamblaje de routers de dominio
app.include_router(chat.router,      prefix="/api/v1/chat",  tags=["Inference"])
app.include_router(ingestion.router, prefix="/api/v1/ingest", tags=["RAG Ingestion"])
```

**Estructura de directorios equivalente (`src/app/`):**

| Ruta | Responsabilidad |
|---|---|
| `src/app/main.py` | Instanciación de FastAPI, lifespan, ensamblaje de routers |
| `src/app/api/routers/` | Controladores HTTP (`chat.py`, `ingestion.py`) — solo parsing y formato |
| `src/app/api/dependencies.py` | Inyección de dependencias (acceso al `chroma_client`, extracción de headers) |
| `src/app/core/config.py` | Settings con `pydantic-settings` + variables de entorno |
| `src/app/core/middleware.py` | `HMACSecurityMiddleware` |
| `src/app/models/schemas.py` | Schemas Pydantic V2 de entrada/salida |
| `src/app/services/` | Lógica de negocio: motor RAG, embeddings, orquestación con el LLM |

---

## `HMACSecurityMiddleware` — middleware clase para Starlette

Este middleware intercepta *todas* las requests antes de alcanzar cualquier router. Implementa la validación criptográfica asíncrona del patrón HMAC firmado por el plugin Moodle.

A diferencia de la función `verify_request` documentada en `autenticacion-hmac.md` (que funciona como dependency injection en endpoints individuales), este enfoque aplica la seguridad a nivel de aplicación completa.

```python
# src/app/core/middleware.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import hmac
import hashlib
import base64
import time
from typing import Set

from app.core.config import settings


class HMACSecurityMiddleware(BaseHTTPMiddleware):

    def __init__(self, app, tolerance_seconds: int = 300):
        super().__init__(app)
        self.tolerance     = tolerance_seconds
        self.seen_nonces: Set[str] = set()  # Anti-replay en memoria

    async def dispatch(self, request: Request, call_next):
        # Las rutas de documentación quedan excluidas en dev
        if request.url.path in ["/docs", "/openapi.json", "/health"]:
            return await call_next(request)

        timestamp = request.headers.get("X-Nexus-Timestamp")
        nonce     = request.headers.get("X-Nexus-Nonce")
        signature = request.headers.get("X-Nexus-Signature")

        if not all([timestamp, nonce, signature]):
            return JSONResponse(
                status_code=401,
                content={"detail": "Ausencia de firmas de seguridad."}
            )

        # 1. Auditoría de frescura (Mitigación de Replay Attack por tiempo)
        if abs(time.time() - int(timestamp)) > self.tolerance:
            return JSONResponse(
                status_code=401,
                content={"detail": "Ventana de firma expirada."}
            )

        # 2. Auditoría de nonce (Mitigación de Replay Attack por duplicado)
        if nonce in self.seen_nonces:
            return JSONResponse(
                status_code=401,
                content={"detail": "Petición duplicada interceptada."}
            )
        self.seen_nonces.add(nonce)

        # 3. Reconstrucción y verificación de la firma canónica
        body = await request.body()
        canonical_request = (
            f"{request.method}\n"
            f"{request.url.path}\n"
            f"{timestamp}\n"
            f"{nonce}\n"
            f"{body.decode('utf-8')}"
        )

        expected_sig = base64.b64encode(
            hmac.new(
                settings.SECRET_KEY.encode('utf-8'),
                canonical_request.encode('utf-8'),
                hashlib.sha256,
            ).digest()
        ).decode('utf-8')

        # compare_digest: previene timing attacks (comparación en tiempo constante)
        if not hmac.compare_digest(expected_sig, signature):
            return JSONResponse(
                status_code=401,
                content={"detail": "Fallo de validación HMAC."}
            )

        # 4. Reconstrucción del stream para routers subsecuentes
        async def receive():
            return {"type": "http.request", "body": body}
        request._receive = receive

        return await call_next(request)
```

**Diferencias clave respecto a `autenticacion-hmac.md`:**
- Es un **middleware clase** (aplica a toda la aplicación) vs. dependency injection (aplicable por endpoint).
- Incluye **nonce tracking en memoria** para prevenir replay attacks por petición duplicada.
- La solicitud canónica incluye el **método HTTP y el path** en la firma — no solo timestamp + body.

> **Limitación conocida:** `self.seen_nonces` es un `set` en memoria que crece indefinidamente. En producción, reemplazar por Redis con TTL igual a `tolerance_seconds`.

---

## Dependency injection del cliente ChromaDB

```python
# src/app/api/dependencies.py
from fastapi import Request
import chromadb

def get_chroma_client(request: Request) -> chromadb.PersistentClient:
    return request.app.state.ml_components["chroma_client"]

# Uso en un router:
# @router.post("/infer")
# async def infer(payload: ChatRequestSchema, chroma = Depends(get_chroma_client)):
#     ...
```

---

## Arranque del servidor

```bash
# Desarrollo con hot-reload
uvicorn src.app.main:app --host 127.0.0.1 --port 8000 --reload

# Producción
uvicorn src.app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

FastAPI genera documentación interactiva autogenerada en `http://127.0.0.1:8000/docs` bajo las especificaciones OpenAPI. Desde Swagger UI o una herramienta de línea de comandos pre-firmada, los desarrolladores pueden interactuar con los endpoints para verificar el modelo Pydantic sin necesidad de desplegar Moodle.

---

## Decisiones tomadas para NexusAI

- **`@asynccontextmanager` Lifespan** — patrón oficial, sin eventos obsoletos.
- **`HMACSecurityMiddleware`** a nivel aplicación — la seguridad es transversal, no opt-in por endpoint.
- **`seen_nonces` como `set` en memoria para el MVP** — aceptamos el crecimiento ilimitado durante la demo. Redis en producción.
- **`ml_components` como dict global** — accesible vía `request.app.state` sin acoplar los routers al estado global directamente.

## Abierto / pendiente

- [ ] Reemplazar `seen_nonces: Set[str]` por Redis con TTL = 300s antes de ir a producción.
- [ ] Agregar `/health` y `/ready` endpoints que verifiquen la conexión ChromaDB y OpenAI API key.
- [ ] Evaluar `uvicorn --workers 2` vs. `gunicorn -k uvicorn.workers.UvicornWorker` para producción.

## Referencias

- [FastAPI — Lifespan Events](https://fastapi.tiangolo.com/advanced/events/)
- [FastAPI — Middleware](https://fastapi.tiangolo.com/tutorial/middleware/)
- [How to Secure APIs with HMAC Signing in Python — OneUptime](https://oneuptime.com/blog/post/2026-01-22-hmac-signing-python-api/view)
- [Designing a Production-Grade AI Chat Service with FastAPI — DEV Community](https://dev.to/masteringbackend/designing-a-production-grade-ai-chat-service-with-fastapi-8o2)
- [Chroma — PersistentClient](https://docs.trychroma.com/reference/python/client)

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
