# 02 — RAG (Retrieval Augmented Generation)

Base conceptual y decisiones de diseño del pipeline RAG de NexusAI.

## Archivos

- [conceptos.md](conceptos.md) — Qué es RAG, por qué no solo prompting, flujo indexación + retrieval + generation.
- [chunking-strategies.md](chunking-strategies.md) — Tamaño de chunk, overlap, decisión de 500 tokens / 10%.
- [evaluacion-rag.md](evaluacion-rag.md) — Métricas (recall, precision, faithfulness), cómo evaluar fallback honesto.

## Objetivo

Dejar explícito por qué NexusAI usa RAG (y no fine-tuning ni solo prompting), y qué decisiones tomamos en cada paso del pipeline.
