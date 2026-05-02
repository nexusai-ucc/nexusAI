# 05 — Backend FastAPI

API Python que orquesta el pipeline RAG + OpenAI. Es el intermediario entre el plugin Moodle y los servicios de IA.

## Archivos

- [estructura-api.md](estructura-api.md) — Endpoints, estructura del proyecto, hosting, CORS.
- [autenticacion-hmac.md](autenticacion-hmac.md) — Patrón Hybrid PHP Proxy, HMAC SHA-256 PHP↔Python, seguridad.

## Objetivo

Documentar el contrato entre el plugin Moodle (PHP) y el backend Python, y cómo se protege el flujo sin exponer la API key de OpenAI al navegador.
