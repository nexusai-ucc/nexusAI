# 03 — Modelos de Lenguaje y Embeddings

Uso de LLMs y modelos de embeddings en NexusAI. Arquitectura agnóstica de proveedor: **Gemini 2.5 Flash** en el MVP (gratuito) y **GPT-4o-mini + text-embedding-3-small** en producción.

## Archivos

- [gpt-4o.md](gpt-4o.md) — Decisión de proveedor de LLM, comparativa, arquitectura `LLMProvider`, prompt engineering, streaming y prompt injection.
- [embeddings.md](embeddings.md) — Decisión de modelo de embeddings, comparativa, arquitectura `EmbeddingProvider`, integración con pgvector.
- [costos-rate-limits.md](costos-rate-limits.md) — Proyección de costos por escenario (MVP $0, producción ~$108/mes para 500 alumnos), rate limits, palancas de optimización.

## Objetivo

Justificar la elección del modelo de LLM y embeddings, proyectar costos realistas para la defensa ante el jurado, y documentar la arquitectura que permite cambiar de proveedor sin tocar código.

## Decisiones clave

| Decisión | MVP | Producción |
|---|---|---|
| LLM de chat | Gemini 2.5 Flash (gratuito) | GPT-4o-mini ($0.15/M input) |
| Modelo de embeddings | Gemini Embedding o nomic-embed-text (gratuito) | text-embedding-3-small ($0.02/M) |
| Costo LLM total | $0 | ~$101/mes (500 alumnos) |
| Cambio de proveedor | Solo variables de entorno — sin cambios de código |

## Principio arquitectónico

Todos los proveedores relevantes son compatibles con el SDK de OpenAI cambiando únicamente la `base_url`. El código de NexusAI abstrae el proveedor detrás de las clases `LLMProvider` y `EmbeddingProvider`. Ver `gpt-4o.md` y `embeddings.md` para el detalle de implementación.
