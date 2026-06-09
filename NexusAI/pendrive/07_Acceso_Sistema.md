# Acceso al sistema NexusAI

> Documento separado con todos los links y credenciales para reproducir
> el sistema. Este archivo se entrega como anexo del pendrive según los
> criterios del syllabus.

## Backend en producción (Railway)

| | |
|---|---|
| **URL del backend** | <https://nexusai-production-e414.up.railway.app> |
| **Swagger interactivo** | <https://nexusai-production-e414.up.railway.app/docs> |
| **Health check** | <https://nexusai-production-e414.up.railway.app/health> |
| **Estado** | Online 24/7 hasta la defensa final (Feb 2027) |
| **Hosting** | Railway free tier |

## Credenciales del backend

Para conectar un Moodle (o cualquier cliente HTTP) al backend en producción:

| Campo | Valor |
|---|---|
| **API key** | `3f6db387999e0bc2b6f7ea155a983f6540a51ceea5e8a3b19d3033150df5689b` |
| **Shared secret** | `06ba2057056dcdc0c42814bc47b887cf2c4945156a8b9790031015a855c55759` |

Estos valores se pegan en **Site administration > Plugins > Local plugins
> NexusAI** del Moodle de destino, después de instalar el ZIP del plugin.

## Cómo reproducir el sistema completo en una laptop

### Opción A — Instalar solo el plugin en un Moodle existente

1. Tener un Moodle 4.1 LTS a 4.5 corriendo (propio o testing).
2. Descomprimir o usar el ZIP del plugin que está en `06_Codigo_Fuente/local_nexusai-plugin-v0.9.4.zip`.
3. En Moodle: **Site administration > Plugins > Install plugins**, subir el ZIP.
4. Seguir el wizard de instalación.
5. Configurar las credenciales de arriba en **Local plugins > NexusAI**.
6. Crear un curso de prueba, subir un PDF desde **NexusAI · Materials** y probar el chat como alumno.

### Opción B — Stack completo en docker-compose

Si querés correr todo localmente (Moodle + backend + DB + Redis):

1. Descomprimir el código en `06_Codigo_Fuente/nexusAI-source.zip`.
2. `cd NexusAI && cp .env.example .env` y completar credenciales.
3. `./scripts/dev.sh up` — levanta postgres + redis + backend.
4. `docker compose exec api alembic upgrade head` — corre migraciones.
5. Levantar Moodle local con `moodle-docker` aparte y apuntarlo al backend en `http://host.docker.internal:8001`.

Detalle completo en el capítulo 18 del documento principal (`01_Documentacion_Final.pdf`).

## Repositorios públicos

| | |
|---|---|
| **Código fuente (GitHub)** | <https://github.com/nexusai-ucc/nexusAI> |
| **Release del plugin** | <https://github.com/nexusai-ucc/nexusAI/releases/latest> |
| **Issues del MVP** | <https://github.com/nexusai-ucc/nexusAI/issues?q=label:mvp> |
| **GitHub Actions (CI/CD)** | <https://github.com/nexusai-ucc/nexusAI/actions> |

## Demo presencial (durante la defensa)

El día de la defensa el equipo levanta Moodle local en su laptop
conectado al backend en producción (Railway). El tribunal puede
simultáneamente verificar el backend desde su propio dispositivo
abriendo la URL de health check.

| | |
|---|---|
| **URL Moodle demo (local)** | `http://localhost:8082` |
| **Usuario admin demo** | Proporcionado por el equipo durante la defensa |
| **Usuario alumno demo** | Proporcionado por el equipo durante la defensa |
| **Usuario docente demo** | Proporcionado por el equipo durante la defensa |

## Equipo y contacto

- **Santiago Tricherri** · Project Manager · Backend & AI Developer
- **Delfina Salinas** · Scrum Master · Frontend & RAG Developer

Universidad Católica de Córdoba · Facultad de Ingeniería · Ingeniería en Sistemas · 2026.
