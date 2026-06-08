# Work Breakdown Structure (WBS)

## Descomposición jerárquica del proyecto

El proyecto NexusAI se descompone en cinco entregables principales,
desglosados a tres niveles de detalle:

```
1. NexusAI — Asistente académico con IA integrado en Moodle
│
├── 1.1 Setup e Investigación
│   ├── 1.1.1 Relevamiento a estudiantes y docentes UCC
│   ├── 1.1.2 Investigación técnica
│   │   ├── 1.1.2.1 Arquitectura de plugins Moodle
│   │   ├── 1.1.2.2 Moodle Web Services y autenticación
│   │   ├── 1.1.2.3 OpenAI / Gemini APIs y modelos
│   │   ├── 1.1.2.4 Técnica RAG y librerías
│   │   ├── 1.1.2.5 Procesamiento de PDFs (pdfplumber, PyPDF2)
│   │   ├── 1.1.2.6 Bases de datos vectoriales (Chroma, pgvector, etc.)
│   │   ├── 1.1.2.7 FastAPI para el backend
│   │   └── 1.1.2.8 React + Webpack en Moodle (bundle AMD)
│   ├── 1.1.3 Setup del entorno de desarrollo
│   │   ├── 1.1.3.1 Moodle local con PostgreSQL
│   │   ├── 1.1.3.2 Repositorio GitHub + estructura
│   │   ├── 1.1.3.3 Backend FastAPI + virtualenv
│   │   ├── 1.1.3.4 Frontend React + Webpack
│   │   └── 1.1.3.5 Estructura base del plugin Moodle
│   └── 1.1.4 Decisiones arquitectónicas (ADRs)
│
├── 1.2 Desarrollo del MVP
│   ├── 1.2.1 Backend FastAPI
│   │   ├── 1.2.1.1 Servidor base + healthcheck
│   │   ├── 1.2.1.2 Auth HMAC en 3 capas
│   │   ├── 1.2.1.3 Pipeline RAG
│   │   │   ├── Extractor de PDFs (pdfplumber)
│   │   │   ├── Chunker (512 tokens, 64 overlap)
│   │   │   ├── EmbeddingProvider (Gemini Matryoshka)
│   │   │   └── Retriever con pgvector + HNSW
│   │   ├── 1.2.1.4 Endpoints de documents (upload, list, delete)
│   │   ├── 1.2.1.5 Endpoint de chat (sync + streaming SSE)
│   │   ├── 1.2.1.6 LLMProvider con multi-provider
│   │   ├── 1.2.1.7 Rate limiting + logging estructurado
│   │   └── 1.2.1.8 Migraciones Alembic
│   ├── 1.2.2 Plugin Moodle
│   │   ├── 1.2.2.1 Estructura base (version.php, install.xml, lang/)
│   │   ├── 1.2.2.2 Capabilities (use, manage, viewanalytics)
│   │   ├── 1.2.2.3 External Functions (chat_send, document_upload, etc.)
│   │   ├── 1.2.2.4 backend_client.php (cURL + HMAC)
│   │   ├── 1.2.2.5 Hooks Moodle 4.4+ y callback legacy 4.1-4.3
│   │   ├── 1.2.2.6 Página documents.php para docente
│   │   ├── 1.2.2.7 Endpoint chat_stream.php (SSE proxy)
│   │   └── 1.2.2.8 Privacy API (null_provider)
│   ├── 1.2.3 Bundle React
│   │   ├── 1.2.3.1 Webpack config con output AMD
│   │   ├── 1.2.3.2 Componentes del chat (App, MessageBubble, Input)
│   │   ├── 1.2.3.3 Componentes del docente (DocumentsManager, GapsPanel)
│   │   ├── 1.2.3.4 Componentes Sprint 4 (SearchPanel, QuizPanel, HistoryDropdown)
│   │   └── 1.2.3.5 Sistema de iconos lucide-style
│   └── 1.2.4 Features Sprint 4
│       ├── 1.2.4.1 Feature A — Buscador semántico
│       ├── 1.2.4.2 Feature B — Chat multi-curso
│       ├── 1.2.4.3 Feature C — Streaming SSE
│       ├── 1.2.4.4 Feature D — Citas clickeables con preview
│       ├── 1.2.4.5 Feature E — Historial de conversaciones
│       ├── 1.2.4.6 Feature F — Quiz generator
│       └── 1.2.4.7 Feature G — Detección de gaps del docente
│
├── 1.3 Testing y QA
│   ├── 1.3.1 Tests unitarios backend (pytest)
│   │   ├── test_hmac.py (10 tests)
│   │   ├── test_chunker.py (13 tests)
│   │   ├── test_retriever.py (8 tests)
│   │   └── test_extractor.py (6 tests)
│   ├── 1.3.2 Tests de integración
│   │   ├── test_documents_router.py
│   │   ├── test_pipeline.py
│   │   └── test_providers.py
│   ├── 1.3.3 CI/CD en GitHub Actions
│   │   ├── backend-ci.yml (lint + tests)
│   │   ├── frontend-ci.yml (build React)
│   │   ├── moodle-ci.yml (PHP lint + Moodle checker)
│   │   └── deploy.yml (autodeploy a Railway)
│   └── 1.3.4 Testing manual E2E
│       ├── Smoke tests por feature
│       └── Validación en Moodle real
│
├── 1.4 Deploy y distribución
│   ├── 1.4.1 Backend en Railway con autodeploy desde main
│   ├── 1.4.2 Plugin como GitHub Release (ZIP descargable)
│   ├── 1.4.3 Moodle público para defensa (DigitalOcean o Oracle Cloud)
│   ├── 1.4.4 Submission al Moodle Plugin Directory (post-MVP)
│   └── 1.4.5 Documentación de instalación y troubleshooting
│
└── 1.5 Documentación y entrega final
    ├── 1.5.1 Documentación técnica
    │   ├── README.md
    │   ├── 6 ADRs (decisiones arquitectónicas)
    │   ├── 5 diagramas Mermaid (architecture, deployment, ER, RAG flow, sequence)
    │   ├── 47 documentos de investigación
    │   └── CORRER_PROYECTO.md
    ├── 1.5.2 Documentación académica (este documento)
    │   ├── Resumen ejecutivo, introducción, alcance
    │   ├── Análisis de requerimientos
    │   ├── Historias de usuario
    │   ├── WBS, cronograma, estimaciones, costos, riesgos, métricas
    │   ├── Documentación por sprint
    │   ├── Documentación del producto (arquitectura, stack, modelo de datos, API)
    │   ├── Manuales (instalación, usuario)
    │   ├── ADRs sintetizados, testing, deploy
    │   └── Retrospectivas, conclusiones, anexos
    └── 1.5.3 Presentación de defensa (15 minutos)
```

## Cargas de trabajo por entregable

| Nivel 1 — Entregable | Story Points totales | % del total |
|---|---|---|
| 1.1 Setup e Investigación | ~60 | 21% |
| 1.2 Desarrollo del MVP | ~180 | 62% |
| 1.3 Testing y QA | ~20 | 7% |
| 1.4 Deploy y distribución | ~10 | 3% |
| 1.5 Documentación y entrega | ~20 | 7% |
| **Total** | **~290 SP** | **100%** |

Los story points se asignaron usando escala Fibonacci (1, 2, 3, 5, 8) en
planning poker con el equipo. El detalle por historia se encuentra en
`NexusAI - Backlog Completo.xlsx`.


