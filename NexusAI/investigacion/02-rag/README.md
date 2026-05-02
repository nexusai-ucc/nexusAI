# 02 — RAG (Retrieval Augmented Generation)

Base conceptual y decisiones de diseño del pipeline RAG de NexusAI.

## Archivos

- [conceptos.md](conceptos.md) — Qué es RAG, por qué no solo prompting, flujo indexación + retrieval + generation.
- [chunking-strategies.md](chunking-strategies.md) — Tamaño de chunk, overlap, decisión de 500 tokens / 10%.
- [evaluacion-rag.md](evaluacion-rag.md) — Métricas (recall, precision, faithfulness), cómo evaluar fallback honesto.
- [optimizacion-avanzada.md](optimizacion-avanzada.md) — Chunking adaptativo, embeddings ajustados, hybrid search BM25+dense, query expansion con contexto de usuario.

## Objetivo

Dejar explícito por qué NexusAI usa RAG (y no fine-tuning ni solo prompting), y qué decisiones tomamos en cada paso del pipeline.

---

*Última actualización: 2026-05-02 — Marcos Bugliotti*
