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
need two files, not the whole repository — no `git clone`, no local build.

**Requirements:** Docker with the Compose plugin. On Windows and macOS that
means [Docker Desktop](https://www.docker.com/products/docker-desktop/) (start
it before running the commands below); on Linux, Docker Engine with the
`docker compose` plugin.

### 1. Download the two files

**Linux / macOS (bash or zsh)**

```bash
curl -O https://raw.githubusercontent.com/nexusai-ucc/nexusai-backend/main/docker-compose.selfhost.yml
curl -O https://raw.githubusercontent.com/nexusai-ucc/nexusai-backend/main/.env.example
cp .env.example .env
```

**Windows (PowerShell)** — note the `curl.exe`: in PowerShell, plain `curl`
is an alias of a different command and does not accept `-O`.

```powershell
curl.exe -O https://raw.githubusercontent.com/nexusai-ucc/nexusai-backend/main/docker-compose.selfhost.yml
curl.exe -O https://raw.githubusercontent.com/nexusai-ucc/nexusai-backend/main/.env.example
Copy-Item .env.example .env
```

### 2. Fill in `.env`

Open `.env` in any text editor and set:
- `LLM_API_KEY` and `EMBEDDING_API_KEY` — a free Gemini key from
  https://aistudio.google.com/apikey (the same key works for both).
- `NEXUSAI_API_KEY` and `NEXUSAI_SHARED_SECRET` — two random 64-character
  hex strings, one per variable. Generate each one with:

  **Linux / macOS**
  ```bash
  openssl rand -hex 32
  ```

  **Windows (PowerShell)**
  ```powershell
  $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | ForEach-Object { $_.ToString('x2') })
  ```
- `POSTGRES_PASSWORD` — any value.

### 3. Start it

Same command on every system:

```
docker compose -f docker-compose.selfhost.yml up -d
```

This pulls `ghcr.io/nexusai-ucc/nexusai-backend:latest` — the same image our
own staging/production deployments run — and applies the database migrations
automatically on startup. On Apple Silicon Macs the image runs under
emulation, which works but starts a bit slower.

Check that it is up (or just open the URL in a browser):

```bash
curl http://localhost:8001/health          # Linux / macOS
```
```powershell
curl.exe http://localhost:8001/health      # Windows (PowerShell)
```

The response should be `{"status":"ok", ...}`. If port 8001 is already in use,
set `API_PORT` in `.env` to another value and use that port below.

### 4. Point the plugin at it

Configure the plugin (same settings page as Option A). The **Backend URL**
depends on where your Moodle runs:

| Where Moodle runs | Backend URL |
|---|---|
| Directly on the same machine (XAMPP, MAMP, Laragon, native install) | `http://localhost:8001` |
| In Docker on Windows or macOS (Docker Desktop) | `http://host.docker.internal:8001` |
| In Docker on Linux | `http://host.docker.internal:8001` if your Moodle container maps `host.docker.internal` to the host (for example with `extra_hosts: ["host.docker.internal:host-gateway"]`); otherwise use the host's IP address |
| On another machine | `http://<address of the machine running the backend>:8001` |

- **API key** / **Shared secret**: the two values you generated in step 2.

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
