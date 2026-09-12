# NexusAI

**Asistente académico con inteligencia artificial para Moodle.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Moodle: 4.1–4.5](https://img.shields.io/badge/Moodle-4.1--4.5-orange)]()

NexusAI integra un asistente conversacional con RAG (Retrieval-Augmented
Generation) directamente en el aula virtual de Moodle. A diferencia de un
chatbot genérico, responde **basándose en el material real que subió el
docente** (PDFs, DOCX, TXT) — cita la fuente, y si la respuesta no está en el
material, lo dice explícitamente en vez de inventar.

Repositorio: <https://github.com/nexusai-ucc/nexusAI>

## Funcionalidades

**Para alumnos**

- Chat con el asistente sobre el contenido real de la materia, con streaming
  de la respuesta y fuentes citadas.
- Buscador semántico sobre todo el material del curso, con historial de
  búsquedas recientes.
- Generación de quizzes de práctica (opción múltiple y desarrollo), con
  dificultad adaptativa según el historial de aciertos, exportables a PDF.
- Plan de estudio con repetición espaciada (spaced repetition) para
  flashcards, y racha de estudio.
- Calendario del curso (lista y vista de mes en grilla), con alertas
  configurables y exportación a `.ics` para importar en cualquier app de
  calendario.
- Panel de foros con IA: detección de posts duplicados antes de publicar,
  resumen de un hilo, y sugerencia de respuesta con contexto del material.
- Feedback 👍/👎 sobre las respuestas del chat.

**Para docentes**

- Gestión de material: subida en lote, reemplazo, reindexación y borrado de
  documentos, con vista previa y resumen automático.
- Dashboard de Analytics: preguntas más frecuentes, uso diario, distribución
  de puntajes de quiz, ratio de vacíos de contenido detectados, y exportación
  del reporte a PDF.
- Detección de vacíos de contenido: preguntas que el material no pudo
  responder bien, para saber qué reforzar en la próxima clase.
- Generador de exámenes a partir del material del curso.
- Resumen semanal de actividad del foro (digest), con detección de posts que
  parecen urgentes/frustrados, y notificación opcional a un webhook externo
  (Slack, Discord, Teams).

**Transversal**

- Modo oscuro y panel de accesibilidad (tamaño de fuente, alto contraste,
  reducir animaciones).
- Exportación/eliminación de datos personales (privacidad, GDPR-friendly).

## Instalación

1. Descargá el `.zip` del plugin desde el [directorio oficial de
   Moodle.org](https://moodle.org/plugins/) (o desde una release de este
   repositorio).
2. **Site administration → Plugins → Install plugins** → subí el `.zip` →
   **Install**.
3. Moodle detecta el tipo `local` automáticamente y corre el instalador.

## Configuración

NexusAI necesita un backend propio corriendo (FastAPI + PostgreSQL/pgvector —
ver [`services/api`](../../../services/api) en el repositorio para levantarlo).
Una vez que el backend está corriendo:

**Site administration → Plugins → Local plugins → NexusAI:**

| Campo | Descripción |
|---|---|
| **Backend API URL** | URL donde corre el backend FastAPI (ej. `https://api.tu-institucion.edu`) |
| **API key** | Valor de `NEXUSAI_API_KEY` configurado en el backend |
| **Shared secret (HMAC)** | Valor de `NEXUSAI_SHARED_SECRET` configurado en el backend |

Después de guardar: **Site administration → Development → Purge all caches**.

## Capabilities

| Capability | Rol por defecto | Para qué |
|---|---|---|
| `local/nexusai:use` | student, teacher, manager | Usar el chat, buscador, quizzes, plan de estudio, calendario y foros con IA |
| `local/nexusai:manage` | editingteacher, manager | Gestionar material, ver Analytics, generar exámenes, configurar el digest de foros |
| `local/nexusai:viewanalytics` | editingteacher, manager | Ver el dashboard de Analytics del curso |

## Compatibilidad

- **Moodle:** 4.1 LTS (build 2022112800) hasta 4.5.
- **PHP:** 8.0+.
- **Base de datos del backend:** PostgreSQL con la extensión `pgvector`.

## Desarrollo y contribución

Para levantar el proyecto completo en local (Docker, backend, build del
widget React) y contribuir, ver el [`README.md` en la raíz del
repositorio](../../../../README.md#cómo-correrlo-en-local).

## Licencia

GPL v3 o posterior — ver [`LICENSE`](LICENSE), requerido para publicación en
el directorio oficial de Moodle.org. El resto del repositorio (backend
Python) se distribuye bajo licencia MIT — ver el `LICENSE` en la raíz del
repositorio.
