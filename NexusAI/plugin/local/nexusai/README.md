# NexusAI

**AI-powered academic assistant for Moodle.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Moodle: 4.1–4.5](https://img.shields.io/badge/Moodle-4.1--4.5-orange)]()

NexusAI integrates a conversational AI assistant with RAG (Retrieval-Augmented
Generation) directly into the Moodle course. Unlike a generic chatbot, it
answers **based on the real material uploaded by the teacher** (PDF, DOCX,
TXT) — it cites the source, and if the answer isn't in the material, it says
so explicitly instead of making something up.

Repository: <https://github.com/nexusai-ucc/nexusAI>

## Features

**For students**

- Chat with the assistant about the course's real content, with streaming
  responses and cited sources.
- Semantic search across all course material, with a history of recent
  searches.
- Practice quiz generation (multiple choice and open-ended), with adaptive
  difficulty based on past performance, exportable to PDF.
- A spaced-repetition study plan for flashcards, and a study streak.
- Course calendar (list and month-grid views), with configurable alerts and
  `.ics` export to import into any calendar app.
- AI-powered forum panel: duplicate-post detection before publishing, thread
  summaries, and reply suggestions grounded in the course material.
- 👍/👎 feedback on chat responses.

**For teachers**

- Material management: bulk upload, replace, reindex, and delete documents,
  with preview and automatic summary.
- Analytics dashboard: most frequent questions, daily usage, quiz score
  distribution, detected content-gap ratio, and PDF report export.
- Content gap detection: questions the material couldn't answer well, to
  know what to reinforce in the next class.
- Exam generator based on the course material.
- Weekly forum activity digest, with detection of posts that look
  urgent/frustrated, and optional notification to an external webhook
  (Slack, Discord, Teams).

**Across the board**

- Dark mode and an accessibility panel (font size, high contrast, reduced
  motion).
- Personal data export/deletion (privacy, GDPR-friendly).

## Installation

1. Download the plugin `.zip` from the [official Moodle.org
   directory](https://moodle.org/plugins/) (or from a release of this
   repository).
2. **Site administration → Plugins → Install plugins** → upload the `.zip`
   → **Install**.
3. Moodle detects the `local` plugin type automatically and runs the
   installer.

## Configuration

NexusAI needs its own backend running (FastAPI + PostgreSQL/pgvector). See
the self-hosting guide in the main project repository:
[`docs/CORRER_PROYECTO.md`](https://github.com/nexusai-ucc/nexusAI/blob/main/NexusAI/docs/CORRER_PROYECTO.md).
Once the backend is running:

**Site administration → Plugins → Local plugins → NexusAI:**

| Field | Description |
|---|---|
| **Backend API URL** | URL where the FastAPI backend runs (e.g. `https://api.your-institution.edu`) |
| **API key** | Value of `NEXUSAI_API_KEY` configured on the backend |
| **Shared secret (HMAC)** | Value of `NEXUSAI_SHARED_SECRET` configured on the backend |

After saving: **Site administration → Development → Purge all caches**.

## Capabilities

| Capability | Default role | Purpose |
|---|---|---|
| `local/nexusai:use` | student, teacher, manager | Use the chat, search, quizzes, study plan, calendar and AI-powered forums |
| `local/nexusai:manage` | editingteacher, manager | Manage material, view Analytics, generate exams, configure the forum digest |
| `local/nexusai:viewanalytics` | editingteacher, manager | View the course Analytics dashboard |

## Compatibility

- **Moodle:** 4.1 LTS (build 2022112800) through 4.5.
- **PHP:** 8.0+.
- **Backend database:** PostgreSQL with the `pgvector` extension.

## Support

- Bug reports and feature requests: [issue
  tracker](https://github.com/nexusai-ucc/moodle-local_nexusai/issues) on
  this repository.
- Version history: [`CHANGES.md`](CHANGES.md).

## Development and contribution

To run the full project locally (Docker, backend, React widget build) and
contribute, see the [README at the root of the main
repository](https://github.com/nexusai-ucc/nexusAI).

## License

GPL v3 or later — see [`LICENSE`](LICENSE), required for publication on the
official Moodle.org directory. The rest of the repository (Python backend)
is distributed under the MIT license — see the `LICENSE` file at the root
of the main repository.
