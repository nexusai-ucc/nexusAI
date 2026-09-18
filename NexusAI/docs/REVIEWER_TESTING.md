# NexusAI — Testing instructions for Moodle Marketplace reviewers

This document exists to satisfy the Marketplace guideline: *"For review
purposes, you must provide any information or demo credentials needed for
reviewers to test the plugin's functionality."* Its content is meant to be
pasted (or summarized) into the reviewer-notes field of the Marketplace
submission form — it is not part of the plugin ZIP itself.

NexusAI is a Moodle **client** plugin. All AI processing (chat, RAG search,
quiz/exam generation, etc.) happens in a separate open-source backend
service, not in PHP. To fully exercise the plugin's features you need that
backend running somewhere reachable from your Moodle test site. Two options
are provided below — pick whichever is more convenient.

## Option A — Use our hosted backend (fastest)

We run a live instance of the backend that you can point your test Moodle
site at directly, no setup required on your side.

1. In your Moodle test site, go to
   **Site administration → Plugins → Local plugins → NexusAI**.
2. Fill in:
   - **Backend URL**: `<PROVIDED_SEPARATELY_TO_REVIEWER>`
   - **API key**: `<PROVIDED_SEPARATELY_TO_REVIEWER>`
   - **Shared secret**: `<PROVIDED_SEPARATELY_TO_REVIEWER>`
3. Save. Enroll a test user in a course, upload a PDF/DOCX as course
   material, and open the NexusAI chat — it should answer using that
   material and cite the source.

> These are credentials to our real, shared production backend. Please
> don't use them for anything beyond reviewing this submission, and let us
> know when you're done so we can rotate them if needed.

## Option B — Self-host the backend (no shared credentials needed)

We publish a ready-to-run image of the backend on every release. You only
need two files, not the whole repository — no `git clone`, no local build:

```bash
curl -O https://raw.githubusercontent.com/nexusai-ucc/nexusAI/main/NexusAI/docker-compose.selfhost.yml
curl -O https://raw.githubusercontent.com/nexusai-ucc/nexusAI/main/NexusAI/.env.example
cp .env.example .env
```

Edit `.env` and fill in:
- `LLM_API_KEY` and `EMBEDDING_API_KEY` — a free Gemini key from
  https://aistudio.google.com/apikey (same key works for both)
- `NEXUSAI_SHARED_SECRET` and `NEXUSAI_API_KEY` — generate with
  `openssl rand -hex 32` (run it twice, once per value)
- `POSTGRES_PASSWORD` — any value

Then:

```bash
docker compose -f docker-compose.selfhost.yml up -d
curl http://localhost:8001/health   # -> {"status":"ok", ...}
```

This pulls `ghcr.io/nexusai-ucc/nexusai-backend:latest` — the same image our
own staging/production deployments run — and applies DB migrations
automatically on startup.

Configure the plugin (same settings page as Option A) with:
- **Backend URL**: `http://localhost:8001` (or wherever this instance is
  reachable from your Moodle server)
- **API key** / **Shared secret**: the values you generated above

## What to test

- Chat: ask a question about material you uploaded; confirm the answer
  cites the source and that it explicitly says "not found" for questions
  outside the material.
- Quiz generation and flashcards (student side).
- Analytics dashboard and material management (teacher side).
- Privacy: **Site administration → Users → Privacy → Data requests** should
  let an admin export/delete a user's NexusAI data (routed through the
  backend, see `classes/privacy/provider.php`).

## Questions

Open an issue on the plugin's tracker:
https://github.com/nexusai-ucc/moodle-local_nexusai/issues — or contact us
via the email on the Marketplace listing.
