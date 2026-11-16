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
| `cli/setup_demo.php` | Lo que corre adentro de Moodle: plugin conectado, sitio cerrado (login obligatorio, sin invitados, sin mensajería), sin tours de bienvenida, topes de tokens del alumno para la demo (80 k por hora y 200 k por día), permisos, curso "NexusAI: la tesis", cuentas y material (no lo duplica si ya está) |
| `generar_cuentas.py` | `outputs/cuentas.csv` (1 docente y N invitados con contraseñas aleatorias) y `outputs/tarjetas.pdf` con QR, 10 por hoja A4 |
| `carga_moodle.py` | Prueba de carga **pasando por Moodle**, como el público: cada usuario entra con su tarjeta y pregunta por `chat_stream.php`. Mide % OK y p95 del primer token y del total por escalón |

`outputs/`, `moodle/` y `.env` no se commitean.

## Levantarlo

```bash
cd NexusAI/deploy/demo
cp .env.example .env                        # completar
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python generar_cuentas.py --url https://TU-DOMINIO --cantidad 70
MATERIAL=outputs/informe-ipi.pdf ./setup.sh
```

- **Sin gastar cuota:** `MOCK=1 ./setup.sh` levanta el LLM simulado de las pruebas de carga (`scripts/load/mock_llm.py`). En `.env`, `LLM_BASE_URL` y `EMBEDDING_BASE_URL` tienen que apuntar a `http://mock-llm:9000/v1/`. El mock responde en streaming y agrupa las preguntas frecuentes, pero siempre contesta lo mismo: sirve para probar el flujo y la carga, no la calidad de las respuestas ni los vacíos.
- **En local:** `DEMO_SITE_ADDRESS=http://localhost`, `MOODLE_WWWROOT=http://localhost:8088` y `HTTP_PORT=8088`. Si ya tenés Moodle 4.5 bajado, `MOODLE_SRC` puede apuntar a una **copia** (setup.sh escribe su `config.php`).
- **Reimprimir tarjetas** sin invalidar las repartidas: volver a correr `generar_cuentas.py` (reutiliza las contraseñas); `--nuevas` las regenera.

## Comprobar que anda

1. `docker compose ps`: todos `running` (y `uploads-perms` terminado).
2. `docker compose exec api curl -s localhost:8000/health` → `status: ok` con el modelo de la demo.
3. Entrar con una tarjeta desde un celular con datos móviles, abrir el widget ✧ y preguntar algo del informe.

`setup.sh` espera a que el material termine de indexarse. **No volver a correrlo mientras indexa:** el `--build` reinicia la API y el documento queda en error.

## Prueba de carga a través de Moodle

```bash
.venv/bin/python carga_moodle.py --url http://localhost:8088 --usuarios 10 30 60 --preguntas 2
```

Todos los usuarios entran primero y después preguntan a la vez (el momento de "pregunten"). Con el modelo real cada pregunta gasta tokens de verdad (~4 k): 60 usuarios × 2 preguntas son ~0,5 M tokens.

Resultado en local (Mac, Docker, LLM simulado a ~1,5 s con streaming, 16/11/2026), con el pool de Redis que espera conexión libre (PR de robustez del backend):

| Usuarios a la vez | Preguntas | OK | p95 primer token | p95 total |
|---|---|---|---|---|
| 30 | 60 | 100 % | 1,59 s | 2,63 s |
| 60 | 120 | 100 % | 2,10 s | 3,17 s |
| 70 | 140 | 100 % | 1,64 s | 2,84 s |

Sin ese arreglo, a 60 usuarios el 2,5 % de los pedidos daba 500 (`redis: Too many connections`). Falta repetirla en el servidor y con el modelo real.

## Después de la defensa

1. Exportar lo que haga falta para el informe (Analytics del curso).
2. Borrar las cuentas del público (o directamente el droplet).
3. Revocar la key de OpenAI del proyecto de la demo.
4. `docker compose down -v` y destruir el droplet en DigitalOcean.
5. Dar de baja el registro DNS, y el dominio si no se usa más.
