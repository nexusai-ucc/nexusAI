# NexusAI — Cómo correr el proyecto en local

> **Última revisión:** 2026-07-09 — verificada contra el estado real del repo.

## TL;DR — un solo comando

```bash
cd nexusAI/NexusAI
./scripts/nexus.sh start
```

Eso levanta todo: backend (FastAPI + Postgres + Redis) + Moodle. Instala la DB de Moodle si es la primera vez. Al terminar imprime las URLs y los pasos de configuración del plugin.

Para parar todo:
```bash
./scripts/nexus.sh stop
```

---

> El resto de este documento explica qué hace ese comando y cómo resolver problemas.

---

## 0. Prerrequisitos

Tener instalado:

- **Docker Desktop** (incluye Docker Compose v2) — https://docker.com
- **Git**
- **Node.js 20 LTS** — solo si vas a tocar el bundle React (opcional)

Verificar:

```bash
docker --version              # Docker version 24+
docker compose version        # v2.20+
git --version
```

---

## 1. Estructura del repo local

El proyecto usa **dos stacks Docker separados**:

| Stack | Directorio | Qué levanta |
|---|---|---|
| **nexusAI backend** | `nexusAI/NexusAI/` | FastAPI + PostgreSQL + Redis |
| **Moodle** | `moodle-docker/` (repo aparte) | Moodle + su propia DB |

Ambos tienen que estar corriendo para hacer E2E.

---

## 2. Verificar el `.env` del backend

El archivo `.env` ya existe en `nexusAI/NexusAI/`. Verificar que tenga completados:

```bash
cd nexusAI/NexusAI
grep -E "LLM_API_KEY|EMBEDDING_API_KEY|NEXUSAI_API_KEY|NEXUSAI_SHARED_SECRET|POSTGRES_PASSWORD" .env
```

Todos deben tener un valor (no estar vacíos ni con `REPLACE_ME`). Si falta alguno:

```bash
# API key de Gemini (gratis en https://aistudio.google.com/apikey)
# Pegar en LLM_API_KEY y EMBEDDING_API_KEY

# Generar secretos HMAC
openssl rand -hex 32     # → NEXUSAI_SHARED_SECRET
openssl rand -hex 32     # → NEXUSAI_API_KEY
```

Asegurarse también de que el modelo de embeddings sea el correcto:
```env
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
```

---

## 3. Levantar el backend NexusAI

```bash
cd nexusAI/NexusAI
chmod +x scripts/dev.sh
./scripts/dev.sh up
```

Esto levanta **postgres + redis + api**. La primera vez tarda 2-3 min (buildea la imagen).

> **Importante:** `dev.sh up` no levanta Moodle. Moodle va por separado (sección 5).

Si el build falla o querés reconstruir la imagen:
```bash
docker compose build api
./scripts/dev.sh up
```

---

## 4. Verificar el backend

```bash
./scripts/dev.sh status
```

Los 3 servicios (`nexusai-postgres`, `nexusai-redis`, `nexusai-api`) tienen que estar `healthy`.

Si el API queda `unhealthy`, ver logs:
```bash
./scripts/dev.sh logs api
```

Causas comunes: API key vacía o modelo de embedding incorrecto en `.env`.

Verificar en el browser:
- **Health check:** http://localhost:8001/health → debe responder `{"status":"ok"}`
- **Swagger:** http://localhost:8001/docs → acá se ven todos los endpoints

---

## 5. Correr las migraciones de la DB

En modo `dev`, el entrypoint no se usa (el compose override arranca uvicorn directamente). Hay que correr las migraciones a mano una vez:

```bash
docker compose exec api alembic upgrade head
```

Verificar que esté en la última versión:
```bash
docker compose exec api alembic current
# Debe mostrar: 009_forum_post_embeddings (head)
```

> Si es la primera vez que levantás, crea todas las tablas desde cero.
> Si ya habías levantado antes, solo aplica las migraciones nuevas.

---

## 6. Levantar Moodle (para E2E)

Moodle corre con `moodle-docker` (repo oficial de Moodle HQ) en un directorio separado.

**Prerrequisito:** el directorio `moodle-docker/` ya tiene el `local.yml` configurado con el bind mount del plugin NexusAI. Verificar:

```bash
cat moodle-docker/local.yml
```

Debe mostrar algo así:
```yaml
services:
  webserver:
    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - /home/marcos/Escritorio/tesis/nexusAI/NexusAI/plugin/local/nexusai:/var/www/html/local/nexusai
```

Si la ruta del volumen es incorrecta, corregirla con el path absoluto del plugin en tu máquina.

**Levantar Moodle:**

```bash
cd moodle-docker

export MOODLE_DOCKER_WWWROOT=/home/marcos/Escritorio/tesis/moodle
export MOODLE_DOCKER_DB=pgsql
export MOODLE_DOCKER_PHP_VERSION=8.3
export MOODLE_DOCKER_WEB_PORT=8080

bin/moodle-docker-compose up -d
```

Esperar a que la DB esté lista:
```bash
bin/moodle-docker-wait-for-db
```

### Si es la primera vez (o si se borraron los volúmenes)

Instalar la base de datos de Moodle:

```bash
bin/moodle-docker-compose exec webserver php admin/cli/install_database.php \
    --agree-license \
    --fullname="NexusAI Dev" \
    --shortname="nexusai-dev" \
    --adminpass="admin" \
    --adminemail="admin@nexusai.dev"
```

### Si ya habías levantado Moodle antes

Los volúmenes persisten entre reinicios. Levantar directamente con `up -d`.

---

## 7. Configurar el plugin NexusAI en Moodle

1. Abrir http://localhost:8080 → loguearse como `admin` / `admin`
2. Si aparece el wizard "Upgrade Moodle database now" → hacer click en el botón (detectó el plugin nuevo)
3. Ir a: **Site administration → Plugins → Local plugins → NexusAI**
4. Completar:
   - **Backend API URL:** `http://host.docker.internal:8001`
     _(NO usar `localhost` — Moodle corre en su propio container y `localhost` apunta al container de Moodle, no al host)_
   - **API key:** el valor de `NEXUSAI_API_KEY` del `.env` del backend
   - **Shared secret:** el valor de `NEXUSAI_SHARED_SECRET` del `.env`
5. Guardar cambios

### Fix requerido — cURL blocked hosts

Moodle por defecto bloquea requests a IPs privadas (anti-SSRF). `host.docker.internal` resuelve a una IP privada, así que hay que desbloquearlo:

1. **Site administration → Security → HTTP security**
2. **cURL blocked hosts list** → borrar todo el contenido del campo
3. **cURL allowed ports list** → agregar `8001`
4. Guardar

Sin este paso, Moodle bloquea todos los requests al backend y el chat no funciona.

---

## 8. Probar que funciona E2E

### Como docente

1. Loguearse como `admin` (o crear un usuario con rol docente)
2. Crear un curso
3. Entrar al curso → buscar el menú **NexusAI · Materiales** (en el sidebar o el header)
4. Subir un PDF
5. Esperar a que el estado cambie a `✓ Indexado`

### Como alumno

1. Crear un usuario alumno o usar una cuenta de alumno del curso
2. Entrar al curso como alumno
3. Ver el widget flotante de chat en la esquina inferior derecha
4. Hacer una pregunta sobre el PDF que subió el docente

---

## 9. Comandos útiles del día a día

### Backend (correr desde `nexusAI/NexusAI/`)

```bash
./scripts/dev.sh status        # ver qué containers están corriendo
./scripts/dev.sh logs api      # seguir logs del backend en vivo
./scripts/dev.sh shell:pg      # entrar a psql para inspeccionar la DB
./scripts/dev.sh shell:api     # bash dentro del container del API
./scripts/dev.sh down          # parar todo (preserva datos)
./scripts/dev.sh reload        # recrear containers tras editar .env
./scripts/dev.sh destroy       # BORRAR todo y empezar de cero
```

### Moodle (correr desde `moodle-docker/` con las vars de entorno seteadas)

```bash
bin/moodle-docker-compose logs -f webserver    # logs de Moodle
bin/moodle-docker-compose exec webserver php admin/cli/purge_caches.php   # purgar cachés
bin/moodle-docker-compose down                 # parar Moodle (preserva datos)
bin/moodle-docker-compose down -v              # parar y BORRAR datos de Moodle
```

### Correr tests del backend

```bash
# Desde nexusAI/NexusAI/ — tests unitarios (no necesitan DB real)
docker run --rm \
  -v $(pwd)/services/api:/app \
  -w /app \
  nexusai-api:latest \
  python -m pytest tests/ -v

# Solo tests de foros
docker run --rm \
  -v $(pwd)/services/api:/app \
  -w /app \
  nexusai-api:latest \
  python -m pytest tests/test_forums_router.py -v
```

---

## 10. Dev loop del plugin PHP/React

Cuando editás código PHP del plugin:
```bash
# Purgar cachés (no hace falta reiniciar containers)
cd moodle-docker
bin/moodle-docker-compose exec webserver php admin/cli/purge_caches.php
```

Cuando editás React:
```bash
# Build del bundle
cd nexusAI/NexusAI/plugin/local/nexusai/react
npm install   # solo la primera vez
npm run build
# Después: Ctrl+Shift+R en el browser (hard refresh)
```

---

## 11. Problemas comunes

| Síntoma | Solución |
|---|---|
| `POSTGRES_PASSWORD no está en .env` | Completar `.env`. Ver sección 2. |
| API queda `unhealthy` | `./scripts/dev.sh logs api`. Suele ser API key vacía o modelo de embedding incorrecto. |
| `text-embedding-004 not found` | Cambiar `EMBEDDING_MODEL=gemini-embedding-001` en `.env` → `./scripts/dev.sh reload` |
| Cambios al `.env` no se aplican | `docker compose restart` no alcanza — usar `./scripts/dev.sh reload` |
| Puerto 8001 ocupado | Cambiar `API_PORT` en `.env` |
| Moodle no llega al backend (timeout) | Verificar que `local.yml` tenga `extra_hosts: host.docker.internal:host-gateway` |
| "The URL is blocked" en Moodle | Limpiar `cURL blocked hosts list` + agregar 8001 a `cURL allowed ports list` (ver sección 7) |
| Plugin no aparece en Moodle admin | Verificar el bind mount en `local.yml` y que el path del plugin sea correcto |
| JS no se actualiza en el browser | `$CFG->cachejs = false` en `config.php` de Moodle + Ctrl+Shift+R |
| "Upgrade Moodle database" después de cambiar código PHP | Visitar `/admin/index.php` y hacer click en upgrade |
| `alembic current` muestra una versión vieja | Correr `docker compose exec api alembic upgrade head` |

---

## URLs cuando todo está corriendo

| Servicio | URL | Credenciales |
|---|---|---|
| FastAPI Swagger | http://localhost:8001/docs | — |
| Health check API | http://localhost:8001/health | — |
| Postgres (backend) | localhost:5432 | user `nexusai` · pass del `.env` |
| Redis | localhost:6379 | — |
| Moodle | http://localhost:8080 | admin / admin |

---

## Notas de arquitectura (para no olvidar)

- El backend FastAPI **nunca es llamado directamente desde el browser**. El browser llama a Moodle PHP, Moodle llama al backend con HMAC.
- La URL correcta del backend en la config de Moodle es `http://host.docker.internal:8001` (no `localhost`).
- `dev.sh full` y `dev.sh tools` levantan **pgAdmin** (no Moodle). Moodle siempre va por `moodle-docker`.
- Las migraciones de DB se corren con `docker compose exec api alembic upgrade head`. En producción (Fly.io/Railway) el `entrypoint.sh` las corre solo al arrancar.
