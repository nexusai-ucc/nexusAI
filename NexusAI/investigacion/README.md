# Investigación — NexusAI

Fase **Setup e Investigación** (9 Abr – 22 Abr 2026) del Proyecto Integrador NexusAI.
Acá vive toda la investigación técnica, de contexto y de setup que fundamenta las decisiones de arquitectura y las implementaciones del MVP.

---

## Objetivo

Dejar documentado, con criterio técnico y trazabilidad, **por qué NexusAI se construye como se construye**. Esta carpeta es el respaldo tanto para el equipo (referencia durante desarrollo) como para la defensa ante el jurado (PI + Admin de Proyectos).

---

## Estructura

| Carpeta | Qué cubre |
|---|---|
| [01-moodle/](01-moodle/) | Plugin development, hooks, seguridad, compatibilidad 4.1–4.5 |
| [02-rag/](02-rag/) | Conceptos RAG, estrategias de chunking, evaluación |
| [03-openai/](03-openai/) | GPT-4o, embeddings, costos, rate limits, prompting |
| [04-chromadb/](04-chromadb/) | Arquitectura, similitud coseno, persistencia |
| [05-backend-fastapi/](05-backend-fastapi/) | API Python, HMAC PHP↔Python, hosting |
| [06-frontend-react/](06-frontend-react/) | React + Webpack + AMD dentro de Moodle |
| [07-procesamiento-docs/](07-procesamiento-docs/) | pdfplumber, chunking, extracción |
| [08-estado-del-arte/](08-estado-del-arte/) | Competidores y plugins Moodle IA existentes |
| [09-relevamiento/](09-relevamiento/) | Encuesta docentes, reunión Leandro, requisitos UCC |
| [10-setup-entorno/](10-setup-entorno/) | Docker Moodle, Python, Node, git workflow |
| [recursos/](recursos/) | Diagramas, plantilla de documento, referencias |

---

## Cómo contribuir a esta carpeta

1. Usar la [plantilla de documento](recursos/plantilla-doc.md) como base.
2. Nombres de archivo en `kebab-case`, español.
3. Todo en Markdown. Diagramas en [Mermaid](https://mermaid.js.org/) (renderiza nativo en GitHub).
4. Cada documento cierra con **Decisiones tomadas para NexusAI** y **Referencias**.
5. Al agregar un archivo nuevo, actualizar el README de su subcarpeta **y** este índice si corresponde.

---

## Estado (actualizado 24 Abr 2026)

| Bloque | Estado | Responsable |
|---|---|---|
| 01 Moodle | En progreso | Marcos |
| 02 RAG | En progreso | Santiago |
| 03 OpenAI | En progreso | Santiago |
| 04 ChromaDB | En progreso | Marcos |
| 05 Backend FastAPI | En progreso | Santiago |
| 06 Frontend React | En progreso | Delfi |
| 07 Procesamiento docs | Pendiente | Marcos |
| 08 Estado del arte | Pendiente | Delfi |
| 09 Relevamiento | En progreso | Delfi |
| 10 Setup entorno | En progreso | Todos |

---

## Enlaces del proyecto

- Repo: https://github.com/delfisalinasmich/nexusAI
- Backlog/Roadmap: https://github.com/users/delfisalinasmich/projects/5
- Anteproyecto: `contextttt/NexusAI-Anteproyecto.docx`
- Guía técnica base: `contextttt/Moodle AI Chat Plugin_ RAG and GPT-4o Integration Technical Guide.pdf`
