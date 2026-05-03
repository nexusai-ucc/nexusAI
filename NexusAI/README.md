<div align="center">

# NexusAI

**Plugin para Moodle con asistente académico basado en inteligencia artificial.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: MVP en desarrollo](https://img.shields.io/badge/status-MVP%20en%20desarrollo-orange)]()
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
- **API key de OpenAI nunca llega al navegador.** Patrón Hybrid PHP Proxy con HMAC PHP↔Python.
- **Open source y self-hostable.** Las universidades mantienen control sobre los datos.
- **Fallback honesto.** Si la pregunta no se puede responder con el material, lo admite.

---

## Estado del proyecto

| | |
|---|---|
| **Fase actual** | Sprint 1 (23 Abr – 6 May 2026) |
| **Próximo hito** | MVP — 1 Jun 2026 |
| **Roadmap completo** | Hasta defensa final 27 Feb 2027 |
| **Backlog** | 334 SP MVP \| 538 SP Full |

Ver [`investigacion/`](investigacion/) para el detalle técnico y de gestión, y [`docs/architecture.md`](docs/architecture.md) para la síntesis de arquitectura.

---

## Equipo

| Persona | Rol | Área técnica | GitHub |
|---|---|---|---|
| Santiago Tricherri | Project Manager + AI/Backend Developer | Backend Python, integración OpenAI, arquitectura RAG, gestión del proyecto | _por completar_ |
| Delfina Salinas | Scrum Master + AI/Frontend Developer | Frontend React, UX del plugin, ceremonias Scrum | [@delfisalinasmich](https://github.com/delfisalinasmich) |
| Marcos Bugliotti | Database + AI/Integration Developer | PostgreSQL, integración Moodle, pipeline RAG, ChromaDB | _por completar_ |

**Docentes:**

- **Proyecto Integrador (PI):** Federico Eduardo Porrini, Ignacio Luciano Carreño, Leandro Juarez
- **Administración de Proyectos de Software:** María Belén Zarazaga

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18 + Webpack (bundle AMD embebido en Moodle) |
| **Plugin Moodle** | PHP — plugin tipo `local`, `require_login()`, `has_capability()`, proxy cURL |
| **Backend IA** | Python 3.11 + FastAPI |
| **IA generativa** | OpenAI GPT-4o-mini (con GPT-4o opcional) |
| **Embeddings** | OpenAI text-embedding-3-small (1536 dim) |
| **Base vectorial** | ChromaDB (modo in-process, persistente) |
| **Cache** | Redis |
| **Base de datos** | PostgreSQL (compartida con Moodle) |
| **Compatibilidad Moodle** | 4.1 LTS – 4.5 LTS |

### Flujo de una consulta

```
Alumno → React (AMD)
       → Moodle PHP (External Function + cURL)
       → FastAPI (HMAC verify + RAG)
       → ChromaDB (top-5 chunks por similitud coseno)
       → GPT-4o-mini (generación con streaming SSE)
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
│   └── api/                     # Backend FastAPI (Python)
│       ├── app/
│       │   ├── chat/
│       │   ├── documents/
│       │   ├── infrastructure/
│       │   └── shared/
│       ├── tests/
│       ├── data/                # Persistencia ChromaDB (gitignored)
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

## Cómo correrlo en local

### Prerrequisitos

- Docker + Docker Compose
- Node.js 20 LTS
- Python 3.11+
- Cuenta OpenAI con API key
- Git

### Setup rápido

```bash
# 1. Clonar el repo
git clone git@github.com:nexusai-ucc/nexusAI.git
cd nexusAI

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y completar OPENAI_API_KEY + secretos HMAC

# 3. Levantar servicios (Moodle + FastAPI + Redis + ChromaDB)
docker compose up -d

# 4. Instalar el plugin en Moodle
# Visitar http://localhost:8000/admin → seguir wizard de instalación

# 5. (Opcional) Build del bundle React en watch
cd plugin/local/nexusai && npm install && npm run dev
```

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

| Fase | Fechas | Entregable |
|---|---|---|
| Setup e Investigación | 9 Abr – 22 Abr 2026 | Entorno + arquitectura |
| Sprint 1 | 23 Abr – 6 May 2026 | Plugin base + API Python + React |
| Sprint 2 | 7 May – 20 May 2026 | RAG completo + chat end-to-end |
| Sprint 3 | 21 May – 27 May 2026 | Integración Moodle + contenido docente |
| **Sprint 4 — MVP** | **28 May – 1 Jun 2026** | **MVP entregado el 1 de junio** |
| Documentación MVP | 2 Jun – 15 Jun 2026 | Informe + demo |
| Post-MVP | Jun – Nov 2026 | Study Planner, Analytics, Foros, Calendario |
| Check 2 PI | antes 3 Nov 2026 | Diagnóstico + MT + objetivos |
| Ajustes + PPT + Defensa | Ene – 27 Feb 2027 | Defensa final |

**Metodología:** Scrum con sprints de 2 semanas. Planning, daily asíncrono, review y retrospectiva al cierre de cada sprint.

---

## Las 7 épicas

| N° | Épica | Alcance |
|---|---|---|
| 01 | Asistente Académico Inteligente | Chat RAG sobre contenido real de la materia — **núcleo del MVP** |
| 02 | Buscador y Resumen Inteligente | Búsqueda semántica y resúmenes automáticos de PDFs |
| 03 | Study Planner | Quizzes, V/F, completar, preguntas abiertas, flashcards con corrección automática e IA |
| 04 | Herramientas para Docentes | Dashboard analytics, generador de evaluaciones, detección de lagunas |
| 05 | Calendario, Alertas y Notificaciones | Integración con calendario nativo de Moodle |
| 06 | Foros Mejorados con IA | Detección de duplicados, sugerencias automáticas, resúmenes de hilos |
| 07 | Integración con Moodle y Gestión de Contenido | Plugin local instalable, indexación automática de PDFs/DOCX/TXT |

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
