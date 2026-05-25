# Sprint 3 — Plan ejecutable

**Duración:** 21 may → 27 may 2026 (7 días)
**Foco:** producción + setup de validación interna

**Decisiones tomadas:**
- Plugin se distribuye en dos vías: Moodle público propio + ZIP descargable (opción C).
- Validación = el propio equipo (Santi + Delfi + Marcos) usando el Moodle público durante Sprint 4.
- No dependemos de UCC ni de docentes externos para la validación inicial.

---

## Día 1 — Miércoles 21 may · Deploy del backend

**Owner:** Santi

### Tareas

```bash
# 1. Instalar flyctl en local
brew install flyctl
fly auth login    # o fly auth signup si no tiene cuenta

# 2. Lanzar la app desde el directorio del backend
cd services/api
fly launch --no-deploy   # detecta fly.toml y Dockerfile, NO deploya todavía

# 3. Crear Postgres en Fly (con extensión pgvector)
fly postgres create --name nexusai-db --region scl
fly postgres attach nexusai-db --app nexusai-api

# 4. Habilitar pgvector
fly postgres connect -a nexusai-db
# Dentro del psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q

# 5. Crear Upstash Redis (free tier 10k req/día):
#    https://upstash.com → New database → Region us-east-1 → copiar redis:// URL

# 6. Setear secrets
fly secrets set \
  LLM_API_KEY="<tu API key de Gemini>" \
  EMBEDDING_API_KEY="<la misma>" \
  NEXUSAI_API_KEY="$(openssl rand -hex 32)" \
  NEXUSAI_SHARED_SECRET="$(openssl rand -hex 32)" \
  REDIS_URL="<la URL de Upstash>"

# 7. Primer deploy
fly deploy

# 8. Correr migraciones
fly ssh console -C "alembic upgrade head"

# 9. Verificar
curl https://nexusai-api.fly.dev/health
# → {"status":"ok"}
```

**Entregable del día:** backend FastAPI corriendo en `https://nexusai-api.fly.dev` con Postgres + Redis + migraciones aplicadas.

---

## Día 2 — Jueves 22 may · Levantar Moodle público

**Owner:** Marcos

Opciones para hostear Moodle:

**Opción rápida — VPS Hetzner CX11 (~$5/mes):**
1. Crear cuenta en Hetzner Cloud.
2. Levantar una VM Ubuntu 22.04 con 2GB RAM.
3. Instalar Docker + Docker Compose.
4. Subir `moodle-docker` adaptado al VPS (con dominio real + Caddy/Nginx + SSL via Let's Encrypt).
5. Configurar dominio (puede ser `nexusai-moodle.<dominio-gratis>` o un subdominio de algo que ya tengan).

**Opción Fly.io (más complejo pero todo en un solo lugar):**
1. Armar un Dockerfile que parta de `php:8.1-apache` con Moodle instalado.
2. Apuntar a la misma DB de Fly Postgres con otra DB schema.
3. `fly launch` desde una carpeta `services/moodle/`.

**Recomendación:** Hetzner. Más simple, más barato, mejor performance para Moodle.

### Pasos en el VPS

```bash
# Una vez con la VM y el dominio apuntando al IP:
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
git clone https://github.com/moodlehq/moodle-docker.git
cd moodle-docker
git clone --depth 1 -b MOODLE_405_STABLE https://github.com/moodle/moodle.git ./moodle

# Linkear el plugin de NexusAI
ln -s /opt/nexusai-plugin moodle/local/nexusai
# (Subir el plugin/local/nexusai/ del repo al VPS antes)

# Levantar
export MOODLE_DOCKER_WWWROOT=$(pwd)/moodle
export MOODLE_DOCKER_DB=pgsql
bin/moodle-docker-compose up -d

# Instalar Moodle
bin/moodle-docker-compose exec webserver php admin/cli/install_database.php \
  --agree-license --fullname="NexusAI Demo" --shortname="nexusai-demo" \
  --adminpass="<password seguro>" --adminemail="admin@nexusai.com"

# Configurar Caddy para HTTPS + dominio
# (config aparte)
```

**Entregable del día:** Moodle público accesible en `https://moodle.nexusai.com` (o el dominio que elijan) con NexusAI instalado y apuntando al backend de Fly.

---

## Día 3 — Viernes 23 may · ZIP del plugin + CI/CD

**Owner:** Marcos + Santi

### Marcos: ZIP descargable del plugin

```bash
# Desde la raíz del repo, después de cualquier cambio al plugin:
./scripts/package-plugin.sh --clean
# Genera: dist/local_nexusai-v0.3.0.zip
```

Subir el ZIP a la sección "Releases" del repo en GitHub:
```bash
gh release create v0.3.0 dist/local_nexusai-v0.3.0.zip \
  --title "NexusAI v0.3.0 — Sprint 2 cierre" \
  --notes "Pipeline RAG completo + markdown rendering + soporte DOCX/TXT"
```

### Santi: GitHub Actions secrets

1. Obtener el token de Fly: `fly auth token`
2. En GitHub: Settings → Secrets and variables → Actions → New repository secret
3. Nombre: `FLY_API_TOKEN`, valor: el token de arriba.
4. Verificar el workflow: hacer un commit dummy a `services/api/` y ver que dispare el deploy.

**Entregable del día:** ZIP publicado en Releases + CI/CD desplegando automáticamente en cada merge a main.

---

## Día 4 — Sábado 24 may · Demos en video

**Owner:** Delfi

3 videos cortos de Loom (no más de 3 min cada uno):

1. **Tour del docente (3 min)** — desde "instalar plugin" hasta "ver indexación completa".
2. **Tour del alumno (2 min)** — abrir el widget, preguntar 2-3 cosas, ver las citas de fuentes.
3. **Overview general (2-3 min)** — qué es el proyecto, problema, solución, demo rápida.

Guion sugerido al final de este archivo.

**Entregable del día:** 3 links de Loom listos para incluir en el repo y en el informe MVP.

---

## Día 5 — Domingo 25 may · Manual de usuario

**Owner:** Delfi

Dos PDFs cortos en `docs/manual/`:

1. `manual-alumno.pdf` (1-2 páginas) — solo screenshots con flechas y captions.
2. `manual-docente.pdf` (3-4 páginas) — instalación del plugin, configuración, subir material, ver estado.

Pueden hacerse con Notion exportado a PDF, o markdown a PDF con pandoc.

**Entregable del día:** 2 PDFs en `docs/manual/`.

---

## Día 6 — Lunes 26 may · Empezamos a usar el sistema nosotros

**Owners:** los 3

Cada uno usa el Moodle público + el plugin como tester real durante los días que siguen:

| Tester | Rol | Curso | Material a subir |
|---|---|---|---|
| Santi | Docente | Cálculo I | 5 PDFs de derivadas/integrales (apuntes propios o MIT OCW) |
| Delfi | Docente | Programación I | 5 PDFs de Python (libro "Automate the Boring Stuff", apuntes) |
| Marcos | Docente | Bases de datos | 5 PDFs de SQL (apuntes UCC, libros open source) |

Y los 3 entran como **alumnos** a los cursos de los otros 2:
- Santi entra a "Programación I" y "Bases de datos" → hace preguntas.
- Delfi entra a "Cálculo I" y "Bases de datos" → hace preguntas.
- Marcos entra a "Cálculo I" y "Programación I" → hace preguntas.

Cada uno anota bugs y observaciones en una planilla compartida.

**Entregable del día:** 3 cursos cargados + cada uno haciendo preguntas reales.

---

## Día 7 — Martes 27 may · Cierre del Sprint 3

**Owner:** Santi

- Acta de cierre `docs/fases/03-sprint-3-cierre.md`
- Métricas actualizadas (SPI, CPI, LOC, tests).
- Bug list priorizada para el Sprint 4.
- Sprint 4 planning: qué bugs fixean primero.

**Entregable del día:** acta firmada por los 3 + bug list ordenada para el bug bash del jueves.

---

## Guion sugerido para los 3 demos de Loom (día 4)

### Video 1 — Tour del docente

> 0:00 — "Hola, soy [nombre], parte del equipo NexusAI. Te muestro cómo un docente usa el plugin."
>
> 0:15 — Site administration → Plugins → Install plugin → subir ZIP.
>
> 0:30 — Site administration → NexusAI settings → Backend URL + API key + Shared secret.
>
> 0:50 — Crear curso "Cálculo I" → entrar.
>
> 1:10 — Abrir NexusAI Materiales → drag & drop de un PDF.
>
> 1:25 — Mostrar la tabla con estado pending → indexing → indexed.
>
> 2:00 — Subir otro PDF, mostrar que se indexa en paralelo.
>
> 2:30 — "Y eso es todo, en 2 minutos el material del curso está listo para que los alumnos pregunten."

### Video 2 — Tour del alumno

> 0:00 — "Soy alumna, vengo a estudiar Cálculo I. Voy a mostrar cómo uso el asistente."
>
> 0:15 — Logueada como alumna, entrar al curso.
>
> 0:25 — Click en la burbuja flotante 💬 abajo a la derecha.
>
> 0:35 — Pregunta 1: "¿Qué es una derivada?" → respuesta + cita de la fuente.
>
> 1:00 — Pregunta 2: "Dame un ejemplo aplicado de la regla de la cadena."
>
> 1:30 — Pregunta 3: "¿Cuál es la diferencia entre la integral definida y la indefinida?"
>
> 2:00 — Mostrar el botón "Nueva conversación" + cierre.

### Video 3 — Overview general

> 0:00 — Logo + "NexusAI — asistente académico con IA para Moodle."
>
> 0:15 — Problema: alumno se pierde en el material, docente sin visibilidad.
>
> 0:30 — Solución: plugin que indexa el material del curso y responde con citas.
>
> 0:50 — Demo de 30 seg del tour del docente.
>
> 1:20 — Demo de 30 seg del tour del alumno.
>
> 1:50 — Stack técnico: React + FastAPI + pgvector + Gemini.
>
> 2:10 — "Open source bajo MIT, podés descargar el plugin en github.com/..."
>
> 2:25 — "Gracias."

---

## Recursos creados en este sprint

- `services/api/fly.toml` — config del deploy a Fly.io
- `.github/workflows/deploy.yml` — CI/CD auto-deploy
- `scripts/package-plugin.sh` — empaqueta plugin como ZIP
- `docs/sprint-3-plan.md` — este documento
- `docs/manual/manual-alumno.pdf` — pendiente (día 5)
- `docs/manual/manual-docente.pdf` — pendiente (día 5)
- `docs/fases/03-sprint-3-cierre.md` — pendiente (día 7)
