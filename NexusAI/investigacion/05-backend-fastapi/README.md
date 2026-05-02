# 05 — Backend FastAPI

API Python que orquesta el pipeline RAG + OpenAI. Es el intermediario entre el plugin Moodle y los servicios de IA.

## Archivos

- [estructura-api.md](estructura-api.md) — Endpoints, estructura del proyecto, hosting, CORS.
- [autenticacion-hmac.md](autenticacion-hmac.md) — Patrón Hybrid PHP Proxy, HMAC SHA-256 PHP↔Python, seguridad.
- [lifespan-y-estado.md](lifespan-y-estado.md) — Lifespan context manager, ChromaDB PersistentClient, HMACSecurityMiddleware como middleware clase, ensamblaje de main.py.
- [pydantic-schemas.md](pydantic-schemas.md) — Pydantic V2, `ConfigDict(extra='forbid')`, `ChatRequestSchema`, `NexusAIResponseSchema`, Structured Outputs de OpenAI.
- [sse-streaming.md](sse-streaming.md) — SSE con `EventSourceResponse`, generador asíncrono, streaming de tokens LLM, detección de desconexión.

## Objetivo

Documentar el contrato entre el plugin Moodle (PHP) y el backend Python, y cómo se protege el flujo sin exponer la API key de OpenAI al navegador.

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
