# Architecture Decision Records (ADRs)

Cada decisión de arquitectura significativa de NexusAI se registra acá como un ADR — un documento corto, fechado e inmutable que explica el contexto, la decisión, las alternativas evaluadas y las consecuencias.

## ¿Por qué ADRs?

Para que dentro de 6 meses (o ante el jurado) podamos responder "¿por qué hicimos X así?" sin tener que reconstruir el razonamiento. Los ADRs son **memoria del equipo**.

## Formato

Usar [`000-template.md`](000-template.md) como base. Estructura:

1. **Contexto** — qué situación motiva la decisión.
2. **Decisión** — qué se hace.
3. **Alternativas evaluadas** — qué se consideró y por qué no.
4. **Consecuencias** — qué ganamos, qué perdemos, cómo lo mitigamos.
5. **Cuándo revisar** — triggers que disparan reabrir el debate.

## ADRs vigentes

| ADR | Título | Estado | Fecha |
|---|---|---|---|
| [001](001-monolito-modular.md) | Backend Python como monolito modular | ✅ Aceptada | 2026-05-02 |

## ADRs planificados (Sprint 1-2)

- ADR-002: ChromaDB in-process como base vectorial.
- ADR-003: GPT-4o-mini como modelo default.
- ADR-004: Chunking 500 tokens / 10% overlap.
- ADR-005: Comunicación PHP↔Python con HMAC + Bearer.
- ADR-006: React compilado como módulo AMD vía Webpack.
- ADR-007: Plugin tipo `local` con `before_footer()`.

## Reglas

- **Un ADR es inmutable** una vez aceptado. Si la decisión cambia, se crea un ADR nuevo que reemplaza al anterior (estado: "Reemplazada por ADR-XXX").
- **Numerar secuencialmente** (`001`, `002`, ...) sin reciclar números.
- **Nombre del archivo:** `XXX-titulo-corto-en-kebab-case.md`.
- **Linkear desde [`docs/architecture.md`](../architecture.md)** los ADRs vigentes.
