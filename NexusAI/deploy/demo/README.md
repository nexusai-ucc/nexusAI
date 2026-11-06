# Entorno de la demo de la defensa

Un Moodle 4.5 público con el plugin NexusAI y su backend, en un solo servidor, para que el público use NexusAI desde el celular durante la defensa oral. Las cuentas que hay que crear (DigitalOcean, OpenAI, dominio) están en `docs/defensa/SERVIDOR_DEMO.md`.

**No es producción:** es un entorno descartable, con cuentas de un solo uso, que se borra después de la defensa.

## Qué hay

| Archivo | Qué hace |
|---|---|
| `docker-compose.yml` | PostgreSQL con pgvector (bases `nexusai` y `moodle`), Redis, API, Moodle 4.5 con el plugin montado, cron de Moodle y Caddy con HTTPS. Solo Caddy publica puertos; el plugin llama al backend por la red interna (`http://api:8000`) |
| `Caddyfile` | Proxy a Moodle, sin buffer para que el chat en streaming llegue palabra por palabra |
| `apache-demo.conf` | Más procesos de Apache: cada chat en streaming ocupa uno mientras dura |
| `.env.example` | Variables: dominio, contraseñas, OpenAI (`gpt-4o-mini`, embeddings en 768 dimensiones), moderación y límites |
| `provision.sh` | Prepara un Ubuntu 24.04 limpio: Docker, firewall, swap, actualizaciones y el repo en `/opt/nexusai` |
| `setup.sh` | Baja Moodle 4.5, genera su `config.php`, levanta todo, instala Moodle en español y configura el sitio, el plugin, el curso y las cuentas. Es idempotente |
| `cli/setup_demo.php` | Lo que corre adentro de Moodle: plugin conectado, sitio cerrado (login obligatorio, sin invitados, sin mensajería), permisos, curso "NexusAI: la tesis", cuentas y material |
| `generar_cuentas.py` | `outputs/cuentas.csv` (1 docente y N invitados con contraseñas aleatorias) y `outputs/tarjetas.pdf` con QR, 10 por hoja A4 |

`outputs/`, `moodle/` y `.env` no se commitean.

## Levantarlo

```bash
cd NexusAI/deploy/demo
cp .env.example .env                        # completar
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python generar_cuentas.py --url https://TU-DOMINIO --cantidad 70
MATERIAL=outputs/informe-ipi.pdf ./setup.sh
```

- **Sin gastar cuota:** `MOCK=1 ./setup.sh` levanta el LLM simulado de las pruebas de carga (`scripts/load/mock_llm.py`). En `.env`, `LLM_BASE_URL` y `EMBEDDING_BASE_URL` tienen que apuntar a `http://mock-llm:9000/v1/`.
- **En local:** `DEMO_SITE_ADDRESS=http://localhost`, `MOODLE_WWWROOT=http://localhost:8088` y `HTTP_PORT=8088`. Si ya tenés Moodle 4.5 bajado, `MOODLE_SRC` puede apuntar a una **copia** (setup.sh escribe su `config.php`).
- **Reimprimir tarjetas** sin invalidar las repartidas: volver a correr `generar_cuentas.py` (reutiliza las contraseñas); `--nuevas` las regenera.

## Comprobar que anda

1. `docker compose ps`: todos `running` (y `uploads-perms` terminado).
2. `docker compose exec api curl -s localhost:8000/health` → `status: ok` con el modelo de la demo.
3. Entrar con una tarjeta desde un celular con datos móviles, abrir el widget ✧ y preguntar algo del informe.

## Después de la defensa

1. Exportar lo que haga falta para el informe (Analytics del curso).
2. Borrar las cuentas del público (o directamente el droplet).
3. Revocar la key de OpenAI del proyecto de la demo.
4. `docker compose down -v` y destruir el droplet en DigitalOcean.
5. Dar de baja el registro DNS, y el dominio si no se usa más.
