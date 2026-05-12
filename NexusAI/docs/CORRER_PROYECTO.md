# NexusAI — Cómo correr el proyecto en local

Guía paso a paso para levantar todo el stack desde cero. Tiempo estimado: 15-20 min la primera vez.

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

## 1. Clonar el repo

```bash
git clone https://github.com/delfisalinasmich/nexusAI.git
cd nexusAI
```

---

## 2. Configurar el `.env`

```bash
cp .env.example .env
```

Abrir `.env` y completar **tres cosas**:

### a) API key de Gemini (gratuita)

Sacarla en https://aistudio.google.com/apikey y pegarla en:

```env
LLM_API_KEY=AIzaSy...tu_key_aca
EMBEDDING_API_KEY=AIzaSy...la_misma_key
```

### b) Cambiar el modelo de embeddings

El `.env.example` tiene `text-embedding-004` que Google ya no acepta vía OpenAI-compat. Cambiar a:

```env
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
```

### c) Generar secretos HMAC

```bash
openssl rand -hex 32     # → copiar a NEXUSAI_SHARED_SECRET
openssl rand -hex 32     # → copiar a NEXUSAI_API_KEY
```

Y poner una password cualquiera en `POSTGRES_PASSWORD` (y actualizar el `DATABASE_URL` con la misma).

---

## 3. Levantar el stack

Hay un helper que hace todo:

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh up
```

Esto levanta **postgres + redis + api** (Moodle es opcional, va aparte).

Si querés hacerlo a mano:

```bash
docker compose up -d postgres redis api
```

La primera vez tarda 2-3 min porque baja las imágenes y buildea el container del API.

---

## 4. Verificar que está todo OK

```bash
./scripts/dev.sh status
```

Los 3 servicios tienen que estar `healthy`. Si alguno aparece `unhealthy`, ver logs:

```bash
./scripts/dev.sh logs api
```

Probar el API en el navegador:

- **Swagger:** http://localhost:8001/docs
- **Health check:** http://localhost:8001/health

---

## 5. Correr las migraciones de la DB

La primera vez hay que crear las tablas:

```bash
docker compose exec api alembic upgrade head
```

Esto crea: `documents`, `chunks`, `chat_sessions`, `messages` + el índice HNSW de pgvector.

---

## 6. Probar que funciona end-to-end

### Opción rápida — subir un PDF y preguntar

Desde la raíz del repo:

```bash
# Firmar y subir un PDF de prueba (necesita el script sign_request.py)
python3 scripts/sign_request.py upload --file ./algun-pdf.pdf --course-id 1
```

O directamente desde Swagger (http://localhost:8001/docs), pero hay que firmar las requests con HMAC — más fácil usar el script.

### Opción E2E con Moodle

```bash
./scripts/dev.sh full
```

Levanta Moodle en http://localhost:8080 (user: `admin`, pass: la que pusiste en `.env`). Para instalar el plugin ahí, ver sección 8.

---

## 7. Comandos útiles del día a día

```bash
./scripts/dev.sh status        # ver qué containers están corriendo
./scripts/dev.sh logs api      # seguir logs del backend en vivo
./scripts/dev.sh shell:pg      # entrar a psql para inspeccionar la DB
./scripts/dev.sh shell:api     # bash dentro del container del API
./scripts/dev.sh down          # parar todo (preserva datos)
./scripts/dev.sh destroy       # BORRAR todo y empezar de cero
./scripts/dev.sh reload        # recrear containers tras editar .env
```

**Importante:** cuando edites el `.env`, `docker compose restart` NO lo recarga. Usar `./scripts/dev.sh reload`.

---

## 8. Instalar el plugin en Moodle (opcional, para E2E)

Si levantaste con `./scripts/dev.sh full`, el plugin ya está montado como volumen en Moodle.

1. Entrar a http://localhost:8080 como admin.
2. Moodle detecta el plugin y muestra el wizard de instalación → "Upgrade Moodle database now".
3. Una vez instalado: **Site administration → Plugins → Local plugins → NexusAI** y completar:
   - **Backend API URL:** `http://api:8000` (¡no localhost! es el nombre del servicio Docker)
   - **API key:** la misma que pusiste en `NEXUSAI_API_KEY` del `.env`
   - **Shared secret:** la misma que pusiste en `NEXUSAI_SHARED_SECRET`
4. Crear un curso, entrar como alumno → el widget de chat aparece en la esquina.

---

## 9. (Opcional) Build del frontend en watch

Solo si vas a tocar el React:

```bash
cd plugin/local/nexusai/react
npm install
npm run dev    # watch mode
```

El bundle compilado va a `plugin/local/nexusai/amd/build/` (commiteado).

---

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `POSTGRES_PASSWORD no está en .env` | Falta completar `.env`. Volver al paso 2. |
| API queda `unhealthy` | Ver `./scripts/dev.sh logs api`. Suele ser API key vacía o modelo de embedding mal puesto. |
| `text-embedding-004 not found` | Cambiar `EMBEDDING_MODEL=gemini-embedding-001` en `.env` y `./scripts/dev.sh reload`. |
| Cambios al `.env` no se aplican | `docker compose restart` no alcanza — usar `./scripts/dev.sh reload`. |
| Puerto 5432 / 6379 / 8001 ocupado | Cambiar el puerto en `.env` (`POSTGRES_PORT`, `REDIS_PORT`, `API_PORT`). |
| Querés empezar de cero | `./scripts/dev.sh destroy` borra volúmenes y arrancás limpio. |

---

## URLs cuando todo está corriendo

| Servicio | URL | Credenciales |
|---|---|---|
| FastAPI Swagger | http://localhost:8001/docs | — |
| Health check | http://localhost:8001/health | — |
| Postgres | localhost:5432 | user `nexusai` · pass del `.env` |
| Redis | localhost:6379 | — |
| Moodle (con `full`) | http://localhost:8080 | admin · pass del `.env` |
| pgAdmin (con `tools`) | http://localhost:5050 | del `.env` |

---

Cualquier cosa que rompa, mandame el output de `./scripts/dev.sh logs api`.
