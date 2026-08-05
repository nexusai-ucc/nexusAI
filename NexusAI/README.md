<div align="center">

# NexusAI

**Plugin para Moodle con asistente académico basado en inteligencia artificial.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Post-MVP en desarrollo](https://img.shields.io/badge/status-Post--MVP%20en%20desarrollo-orange)]()
[![Version: 0.10.6](https://img.shields.io/badge/version-0.10.6-blue)]()
[![Moodle: 4.1–4.5](https://img.shields.io/badge/Moodle-4.1--4.5-blue)]()
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)]()
[![React: 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)]()

</div>

---

## ¿Qué es NexusAI?

NexusAI es un plugin tipo `local` para Moodle 4.x que integra un **asistente académico inteligente** dentro del aula virtual. Permite a los alumnos consultar el contenido real de su materia en lenguaje natural, generar ejercicios de práctica, y brinda a los docentes herramientas de analytics y generación de evaluaciones.

A diferencia de otros plugins de IA para Moodle, **NexusAI implementa RAG auténtico** sobre los materiales del curso: indexa automáticamente los PDFs/DOCX/TXT que el docente sube y los responde con citas a la fuente. Si la información no está en el material, lo dice explícitamente — no inventa.

### Diferenciadores

- **RAG automático** sobre el material real del docente. Sin pegar texto a mano.
- **Integración nativa** en Moodle vía `before_footer()` — widget flotante en todas las páginas del curso.
- **API key del proveedor LLM nunca llega al navegador.** Patrón Hybrid PHP Proxy con HMAC PHP↔Python.
- **Self-hosted.** Una sola base de datos (PostgreSQL + pgvector) — los datos académicos nunca salen del servidor de la institución.
- **Agnóstico de proveedor LLM.** Gemini en MVP (gratuito), GPT-4o-mini en producción. Cambio de proveedor solo con variables de entorno.
- **Open source.** Distribuido bajo licencia MIT.
- **Fallback honesto.** Si la pregunta no se puede responder con el material, lo admite.

---

## Estado del proyecto

| | |
|---|---|
| **Fase actual** | Post-MVP Sprint D (hasta 14 Dic 2026) |
| **MVP entregado** | 1 Jun 2026 |
| **Próximo hito** | Check 2 PI — informe parcial (antes del 3 Nov 2026) |
| **Roadmap completo** | Hasta defensa final 26 Feb 2027 |

El MVP (entregado el 1° de junio) cubrió el asistente conversacional, el
buscador semántico y la generación básica de quizzes. Todo el desarrollo
post-MVP (Study Planner ampliado, Herramientas Docentes, Calendario, Foros
con IA) ya está implementado y mergeado a `main` — el foco actual son
confiabilidad, privacidad, testing automatizado y el deploy propio (ver
Sprint D en el [backlog](https://github.com/nexusai-ucc/nexusAI/issues)).

Ver [`investigacion/`](investigacion/) para el detalle técnico y de gestión, y [`docs/architecture.md`](docs/architecture.md) para la síntesis de arquitectura.

---

## Equipo

| Persona | Rol | Área técnica | GitHub |
|---|---|---|---|
| Santiago Tricherri | Project Manager + AI/Backend Developer | Backend Python, arquitectura RAG, gestión del proyecto | [@SantiagoTricherri](https://github.com/SantiagoTricherri) |
| Delfina Salinas | Scrum Master + AI/Frontend Developer | Frontend React, UX del plugin, ceremonias Scrum | [@delfisalinasmich](https://github.com/delfisalinasmich) |
| Marcos Bugliotti | Database + AI/Integration Developer | PostgreSQL/pgvector, integración Moodle, pipeline RAG | [@marcosbugliotti](https://github.com/marcosbugliotti) |

**Docentes:**

- **Proyecto Integrador (PI):** Federico Eduardo Porrini, Ignacio Luciano Carreño, Leandro Juarez
- **Administración de Proyectos de Software:** María Belén Zarazaga

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + Webpack (bundles AMD embebidos en Moodle, uno por widget) |
| **Plugin Moodle** | PHP 8.1 — plugin tipo `local`, `require_login()`, `has_capability()`, proxy HMAC vía cURL |
| **Backend IA** | Python 3.11 + FastAPI (async), SQLAlchemy 2.0 + Alembic |
| **IA generativa** | Multi-provider (SDK de OpenAI usado genéricamente) — Gemini 2.5 Flash (MVP, gratuito) / GPT-4o-mini (producción) |
| **Embeddings** | Mismo abstracto multi-provider — Gemini Embedding 768d (MVP) / text-embedding-3-small 1536d (producción) |
| **Base vectorial** | **PostgreSQL + pgvector**, sin base vectorial separada (ver ADR-002) — índice HNSW, distancia coseno |
| **Cache / seguridad** | Redis — nonce anti-repetición del HMAC y rate limiting |
| **Base de datos** | PostgreSQL 16 (única DB del backend; Moodle usa su propia base separada) |
| **Compatibilidad Moodle** | 4.1 LTS – 4.5 LTS |

### Flujo de una consulta

```
Alumno → React (AMD)
       → Moodle PHP (External Function + cURL)
       → FastAPI (HMAC verify + RAG)
       → PostgreSQL/pgvector (top-5 chunks por similitud coseno, SQL+vector)
       → LLM activo (Gemini Flash en MVP / GPT-4o-mini en prod, streaming SSE)
       → respuesta contextualizada al alumno
```

Más detalle en [`docs/architecture.md`](docs/architecture.md).

---

## Estructura del repo

```
nexusAI/
├── plugin/                      # Plugin Moodle (PHP) + bundle React compilado
│   └── local/nexusai/
│       ├── version.php
│       ├── lib.php
│       ├── settings.php
│       ├── db/
│       ├── classes/
│       ├── lang/
│       ├── react/               # Source de React (compilado por Webpack)
│       └── amd/build/           # Bundle AMD (commiteado)
├── services/
│   └── api/                     # Backend FastAPI (Python), un router por dominio
│       ├── app/
│       │   ├── chat/            # Asistente RAG (mensajes, streaming)
│       │   ├── documents/       # Upload, extracción, chunking, pipeline de indexado
│       │   ├── search/          # Buscador semántico + híbrido (sin LLM)
│       │   ├── quiz/            # Generador de quiz, exámenes docente, plan de estudio
│       │   ├── forums/          # Duplicados, resumen de hilo, sugerencia de respuesta
│       │   ├── gaps/            # Vacíos de contenido detectados
│       │   ├── analytics/       # FAQ agrupadas, métricas de curso
│       │   ├── admin/           # Dashboard docente agregado
│       │   ├── calendar/        # Alertas configurables
│       │   ├── courses/, auth/, providers/, prompts/, db/, shared/
│       ├── migrations/          # Alembic
│       ├── tests/
│       └── Dockerfile
├── docs/                        # Documentación técnica
│   ├── architecture.md          # Síntesis de arquitectura
│   ├── adr/                     # Architecture Decision Records
│   ├── diagrams/                # Diagramas Mermaid
│   └── fases/                   # Actas de cierre por fase
├── investigacion/               # Investigación técnica + de contexto + de setup
├── scripts/                     # Helpers de desarrollo
├── .github/                     # Templates de PR/issue + workflows CI
├── docker-compose.yml           # Levanta todo en local
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

---

## Instalar el plugin en un Moodle existente

¿Ya tenés un Moodle 4.1–4.5 corriendo y querés conectarlo al backend NexusAI hosteado? Es un solo ZIP:

1. Generá el ZIP del plugin con `scripts/package-plugin.sh` (o bajalo de un release si el equipo publicó uno más reciente que v0.8.0-mvp — ese release quedó desactualizado, hoy la versión real del plugin es **0.10.6**).
2. En Moodle: **Site administration → Plugins → Install plugins**, subir el ZIP y seguir el wizard.
3. Al terminar, **Site administration → Plugins → Local plugins → NexusAI** y completar:
   - **Backend API URL** del entorno que uses.
   - **API key + Shared secret:** pedirlas al equipo NexusAI (Delfina, Santiago, Marcos).
4. Crear un curso, subir material como docente desde el menú **NexusAI · Materials** del curso, y probar el chat como alumno.

> **Deploy en transición:** el backend de producción se está migrando a un hosting propio en Oracle Cloud (self-hosted, ver issue `DEPLOY-02`) — pedile al equipo la URL vigente en vez de asumir un endpoint fijo acá. No hace falta instalar nada del lado servidor por tu cuenta — solo el plugin en tu Moodle.

Si querés correr **toda la pila local** (backend + Moodle + DB) en lugar de usar el deploy, ver la sección siguiente.

---

## Cómo correrlo en local

### Prerrequisitos

- Docker + Docker Compose
- Node.js 20 LTS
- Python 3.11+
- API key de un proveedor LLM compatible con el SDK de OpenAI (Gemini o OpenAI)
- Git

### Setup rápido

```bash
# 1. Clonar el repo
git clone git@github.com:nexusai-ucc/nexusAI.git
cd nexusAI

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env: LLM_API_KEY / EMBEDDING_API_KEY + secretos HMAC (NEXUSAI_API_KEY, NEXUSAI_SHARED_SECRET)

# 3. Levantar servicios (Postgres+pgvector, Redis, API — Moodle es un profile opcional)
docker compose up -d
# Con Moodle incluido: docker compose --profile full up -d

# 4. Correr las migraciones
docker compose exec api alembic upgrade head

# 5. Instalar el plugin en Moodle y completar Backend API URL + API key + Shared secret
#    en Site administration → Plugins → Local plugins → NexusAI

# 6. (Opcional) Build del bundle React en watch
cd plugin/local/nexusai/react && npm install && npm run dev
```

Guía completa (con troubleshooting) en [`docs/CORRER_PROYECTO.md`](docs/CORRER_PROYECTO.md).

Más detalle por componente:

- **Moodle local con Docker:** [`investigacion/10-setup-entorno/docker-moodle.md`](investigacion/10-setup-entorno/docker-moodle.md)
- **Backend FastAPI:** [`investigacion/10-setup-entorno/python-fastapi.md`](investigacion/10-setup-entorno/python-fastapi.md)
- **Frontend React:** [`investigacion/10-setup-entorno/node-react.md`](investigacion/10-setup-entorno/node-react.md)

---

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Síntesis de arquitectura — empieza por acá si sos nuevo |
| [`docs/adr/`](docs/adr/) | Decisiones de arquitectura formalizadas (ADRs) |
| [`docs/diagrams/`](docs/diagrams/) | Diagramas (arquitectura, flujo RAG, secuencia, ER) |
| [`investigacion/`](investigacion/) | 39 docs con todo el research técnico, de contexto y de setup |
| [`docs/fases/`](docs/fases/) | Actas de cierre de cada fase del proyecto |

---

## Cronograma

| Fase | Fechas | Estado |
|---|---|---|
| Setup e Investigación | hasta 21 Abr 2026 | ✅ Completo |
| Sprint 1 | hasta 5 May 2026 | ✅ Completo |
| Sprint 2 | hasta 19 May 2026 | ✅ Completo |
| Sprint 3 | hasta 26 May 2026 | ✅ Completo |
| **Sprint 4 — MVP** | **hasta 31 May 2026** | **✅ MVP entregado** |
| Documentación MVP | hasta 14 Jun 2026 | ✅ Completo |
| Post-MVP Sprint A | hasta 29 Jun 2026 | ✅ Completo |
| Post-MVP Sprint B | hasta 30 Jul 2026 | 🚧 En cierre (informe/PI) |
| Post-MVP Sprint C | hasta 30 Ago 2026 | ✅ Completo (9/9) |
| Post-MVP Sprint D | hasta 14 Dic 2026 | 🚧 En curso — confiabilidad, privacidad, testing, deploy propio |
| Entrega Final | hasta 29 Nov 2026 | Check 2 PI antes del 3 Nov 2026 |
| Defensa Final | hasta 26 Feb 2027 | Ajustes + PPT + defensa |

**Metodología:** Scrum con sprints de 2 semanas. Planning, daily asíncrono, review y retrospectiva al cierre de cada sprint.

---

## Las 7 épicas

| N° | Épica | Alcance | Estado |
|---|---|---|---|
| 01 | Asistente Académico Inteligente | Chat RAG sobre contenido real de la materia — **núcleo del MVP** | ✅ |
| 02 | Buscador y Resumen Inteligente | Búsqueda semántica, resúmenes por documento y resumen pre-parcial multi-documento | ✅ |
| 03 | Study Planner | Quizzes (opción múltiple, V/F, completar, abiertas, flashcards), historial, plan de estudio personalizado | ✅ |
| 04 | Herramientas para Docentes | Dashboard analytics, FAQ agrupadas, generador de exámenes + export GIFT, detección de lagunas | ✅ |
| 05 | Calendario, Alertas y Notificaciones | Vista de calendario, alertas configurables, notificación de material nuevo | ✅ |
| 06 | Foros Mejorados con IA | Detección de duplicados, sugerencia de respuesta, resumen de hilos | ✅ |
| 07 | Integración con Moodle y Gestión de Contenido | Plugin local instalable, indexación multi-formato (PDF/DOCX/PPTX/XLSX/CSV/MD/HTML) | ✅ código \| 🚧 deploy propio |

Las 7 épicas del MVP+post-MVP están implementadas y mergeadas a `main`. El
trabajo actual (Sprint D) es sobre confiabilidad, privacidad, testing
automatizado, publicación oficial del plugin y deploy propio — no
funcionalidades nuevas del core.

---

## Contribuir

Por ahora el desarrollo está restringido al equipo del proyecto. Convenciones de código, branches, commits y PRs en [`CONTRIBUTING.md`](CONTRIBUTING.md).

**Resumen rápido:**

- Branches: `feature/<id>-<descripcion>`, `fix/<id>-<descripcion>`, `docs/<descripcion>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/).
- PRs: 1 review obligatorio + CI verde, squash merge a `main`.

---

## Enlaces del proyecto

- **Backlog + Gantt:** https://github.com/users/delfisalinasmich/projects/5
- **Repo:** https://github.com/nexusai-ucc/nexusAI

---

## Licencia

[MIT](LICENSE) © 2026 — Equipo NexusAI.

---

## Contexto académico

Este proyecto se desarrolla en el marco de:

- **Proyecto Integrador de Ingeniería en Sistemas** — Universidad Católica de Córdoba (UCC), 2026.
- **Administración de Proyectos de Software** — UCC, 2026.

NexusAI no es un producto comercial sino un trabajo académico, distribuido como software libre bajo licencia MIT para que pueda ser estudiado, adaptado y extendido por otros equipos universitarios.
