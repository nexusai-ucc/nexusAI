# `docs/` — Documentación técnica del proyecto

Documentación **viva** que acompaña al código. A diferencia de [`investigacion/`](../investigacion/) (que es research e historial), `docs/` es lo que cualquier dev nuevo debería leer al entrar al repo.

## Estructura

```
docs/
├── architecture.md               # Síntesis de arquitectura — leer primero
├── adr/                          # Architecture Decision Records
│   ├── 000-template.md
│   ├── 001-monolito-modular.md
│   ├── 002-pgvector.md
│   ├── 003-multi-provider-llm.md
│   ├── 004-gemini-mvp-openai-prod.md
│   ├── 005-hmac-php-python.md
│   ├── 006-privacy-strategy.md
│   └── ...
├── diagrams/                     # Diagramas Mermaid del proyecto
│   ├── architecture.md
│   ├── rag-flow.md
│   ├── sequence-chat.md
│   ├── er-tablas.md
│   └── deployment.md
└── fases/                        # Actas de cierre por fase del cronograma
    ├── 01-setup-investigacion-cierre.md
    └── ...
```

## Por dónde empezar

1. [`architecture.md`](architecture.md) — entendés el sistema en 10 minutos.
2. [`adr/`](adr/) — entendés por qué cada decisión es como es.
3. [`diagrams/`](diagrams/) — referencia visual.

Para profundizar más allá de "¿qué hace el sistema?" → ir a [`investigacion/`](../investigacion/).

## Cómo agregar un ADR nuevo

Cuando se toma una decisión de arquitectura nueva:

1. Copiar `adr/000-template.md` a `adr/00X-titulo-corto.md`.
2. Completar las 5 secciones: contexto, decisión, alternativas, consecuencias, fecha.
3. Linkearlo desde `architecture.md` si es relevante.
4. Commit con `docs(adr): agregar ADR-00X sobre <tema>`.
