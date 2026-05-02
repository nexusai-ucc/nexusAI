# Moodle 4.4 local con Docker

> **Resumen:** Usamos `moodlehq/moodle-docker` (repo oficial de Moodle HQ) para tener Moodle 4.4 corriendo localmente con PostgreSQL. Es donde se hace desarrollo, testing y la demo para el jurado.

---

## Contexto

No se puede desarrollar contra el Moodle de producción de UCC. Necesitamos una instancia local que podamos romper sin miedo. Docker es el estándar del ecosistema.

## Por qué `moodlehq/moodle-docker`

- Repo oficial de Moodle HQ.
- Soporta PostgreSQL, MariaDB, MySQL, Oracle, MSSQL.
- Incluye servicios para tests (PHPUnit, Behat).
- Scripts helpers (`bin/moodle-docker-compose`).

## Setup — paso a paso

### 1. Clonar repos necesarios

```bash
# Repo de Moodle (versión que queremos probar)
git clone -b MOODLE_404_STABLE https://git.in.moodle.com/moodle/moodle.git ~/dev/moodle

# Repo de moodle-docker
git clone https://github.com/moodlehq/moodle-docker.git ~/dev/moodle-docker
```

### 2. Variables de entorno

```bash
cd ~/dev/moodle-docker
export MOODLE_DOCKER_WWWROOT=~/dev/moodle
export MOODLE_DOCKER_DB=pgsql
export MOODLE_DOCKER_BROWSER=chrome

# Guardarlas en .env para no repetir
cat > .env <<'EOF'
MOODLE_DOCKER_WWWROOT=/Users/delfisalinasmich/dev/moodle
MOODLE_DOCKER_DB=pgsql
MOODLE_DOCKER_BROWSER=chrome
EOF
```

### 3. Primer arranque + instalación

```bash
cp config.docker-template.php $MOODLE_DOCKER_WWWROOT/config.php
bin/moodle-docker-compose up -d
bin/moodle-docker-wait-for-db
bin/moodle-docker-compose exec webserver php admin/cli/install_database.php \
    --agree-license \
    --fullname="NexusAI Dev" \
    --shortname="nexusai-dev" \
    --summary="Instancia de desarrollo" \
    --adminpass="admin" \
    --adminemail="admin@example.com"
```

### 4. Acceder

- Web: http://localhost:8000
- Usuario: `admin` / password: `admin`

## Montar el plugin NexusAI

El plugin vive en el repo `nexusAI/` pero se monta como `local/nexusai/` dentro del Moodle:

```yaml
# local.yml — override para moodle-docker
services:
  webserver:
    volumes:
      - /Users/delfisalinasmich/Documents/NexusAI/nexusAI/NexusAI/plugin:/var/www/html/local/nexusai
```

Con `local.yml` presente, `bin/moodle-docker-compose` lo incluye automáticamente al próximo `up`.

## Comandos frecuentes

```bash
# Levantar
bin/moodle-docker-compose up -d

# Logs
bin/moodle-docker-compose logs -f webserver

# Shell dentro del container
bin/moodle-docker-compose exec webserver bash

# Purgar cachés Moodle (después de cambiar código PHP)
bin/moodle-docker-compose exec webserver php admin/cli/purge_caches.php

# Correr PHPUnit del plugin
bin/moodle-docker-compose exec webserver \
    vendor/bin/phpunit --testsuite local_nexusai_testsuite

# Parar
bin/moodle-docker-compose down

# Limpiar todo (incluye DB)
bin/moodle-docker-compose down -v
```

## Dev loop recomendado

Durante desarrollo del plugin:

1. Activar **desarrollador**: Admin → Herramientas de desarrollo → Debug → `DEVELOPER`.
2. En `config.php` del Moodle montado:
   ```php
   $CFG->debug = (E_ALL | E_STRICT);
   $CFG->debugdisplay = 1;
   $CFG->cachejs = false;      // No cachear JS bundle durante dev
   $CFG->themedesignermode = false;  // Pero sí cachear CSS de themes (más rápido)
   ```
3. Después de cambiar PHP: purgar cachés (no hace falta restart).
4. Después de cambiar JS: `npm run build` en el plugin → hard refresh.
5. Después de cambiar `version.php`: visitar `/admin/index.php`.

## Base de datos — acceso directo

```bash
# Postgres CLI
bin/moodle-docker-compose exec db psql -U moodle -d moodle

# pgAdmin via port
# Agregar a local.yml:
#   pgadmin:
#     image: dpage/pgadmin4
#     ports: ["5050:80"]
#     environment:
#       PGADMIN_DEFAULT_EMAIL: admin@example.com
#       PGADMIN_DEFAULT_PASSWORD: admin
```

## Testing con PHPUnit + Behat

```bash
# Inicializar PHPUnit una vez
bin/moodle-docker-compose exec webserver php admin/tool/phpunit/cli/init.php

# Correr
bin/moodle-docker-compose exec webserver vendor/bin/phpunit

# Behat
bin/moodle-docker-compose exec webserver \
    php admin/tool/behat/cli/init.php
bin/moodle-docker-compose exec webserver \
    vendor/bin/behat --config /var/www/behatdata/behatrun/behat/behat.yml \
    --tags=@local_nexusai
```

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| "Cannot connect to database" | DB no terminó de iniciar | `bin/moodle-docker-wait-for-db` antes del install |
| Plugin no aparece en admin/Notificaciones | `version.php` mal armado o no montado | Verificar `local.yml` + estructura de archivos |
| JS cambia y no se refleja | `cachejs=true` | `$CFG->cachejs = false` + hard refresh |
| PHPUnit falla con "behat no inicializado" | Falta init | `php admin/tool/phpunit/cli/init.php` |
| "Your Moodle is out of date" después de `git pull` del plugin | Cambió `version.php` | Visitar `/admin/index.php` |

## Decisiones tomadas para NexusAI

- **Moodle 4.4** en Docker como base de desarrollo (balance entre LTS 4.1 y 4.5).
- **PostgreSQL** (coincide con el supuesto de producción UCC).
- **Volumen `local.yml`** para montar el plugin sin duplicar código.
- **`$CFG->cachejs = false`** mientras durameos iterando en el bundle React.
- **Eventualmente probamos contra 4.1 y 4.5** usando `MOODLE_DOCKER_WWWROOT` apuntando a distintos clones.

## Abierto / pendiente

- [ ] Script helper `scripts/dev.sh` que haga `up + install + link del plugin` en un solo comando.
- [ ] Documentar setup con Apple Silicon (ARM) vs Intel.
- [ ] Evaluar Docker Compose profiles para alternar entre 4.1, 4.4 y 4.5 rápido.

## Referencias

- [moodlehq/moodle-docker](https://github.com/moodlehq/moodle-docker)
- [Moodle Dev — Setting up development environment](https://moodledev.io/general/development/process/setup)
- [Moodle — Debug settings](https://moodledev.io/docs/apis/core/log/debug)

---

*Última actualización: 2026-04-24 — equipo NexusAI*
