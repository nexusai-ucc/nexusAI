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

El plugin vive en el repo NexusAI pero se monta como `local/nexusai/` dentro del Moodle. Hay tres formas de hacerlo, en orden de preferencia:

### Opción A — Bind mount via `local.yml` (recomendada para dev) ⭐

`moodle-docker` carga automáticamente cualquier archivo `local.yml` en su raíz. Creá uno con:

```yaml
# moodle-docker/local.yml — override para montar el plugin sin copiarlo
services:
  webserver:
    volumes:
      - /Users/delfisalinasmich/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai:/var/www/html/local/nexusai
```

Después: `bin/moodle-docker-compose down && up -d`. Cualquier cambio en el repo NexusAI se refleja inmediatamente en Moodle (hace falta purgar cachés para PHP, hard refresh para JS).

**Ventaja:** una única fuente de verdad. Editás en el repo NexusAI → se refleja en Moodle.

### Opción B — Copy manual (rápido para verificar)

```bash
rm -rf ~/Documents/NexusAI/moodle-docker/moodle/local/nexusai
cp -R ~/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai ~/Documents/NexusAI/moodle-docker/moodle/local/
```

Útil para una primera verificación antes de configurar el bind mount. **Desventaja:** cada cambio en el repo NexusAI requiere repetir el `cp`.

### Opción C — Symlink ❌ NO funciona en Docker

```bash
# ESTO NO FUNCIONA con moodle-docker:
ln -s ~/Documents/NexusAI/nexusAI/NexusAI/plugin/local/nexusai \
      ~/Documents/NexusAI/moodle-docker/moodle/local/nexusai
```

**Por qué falla (verificado en Sprint 1):** moodle-docker monta solamente `$MOODLE_DOCKER_WWWROOT` (la carpeta `moodle/`) dentro del container en `/var/www/html/`. Si dentro hay un symlink a `/Users/.../NexusAI/plugin/local/nexusai`, el container intenta resolver esa ruta absoluta **dentro de su filesystem virtual** — donde no existe. El symlink queda colgando y Moodle nunca ve el plugin.

Síntoma típico: el plugin no aparece en `Site administration → Plugins → Plugins overview` aunque el symlink se ve correcto desde el host.

**Conclusión:** symlinks solo sirven para Moodle nativo (sin Docker). Para moodle-docker usar siempre bind mount o copy.

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
| Plugin no aparece y usaste symlink | Symlinks no se siguen dentro de Docker | Reemplazar por bind mount en `local.yml` o copy directo (ver "Montar el plugin NexusAI" → Opción C) |
| JS cambia y no se refleja | `cachejs=true` o caché de AMD | `$CFG->cachejs = false` + Site admin → Development → Purge all caches + Ctrl+Shift+R |
| Hook `before_footer` muestra warning de deprecación | Moodle 4.4+ requiere Hook API nuevo | Migrar a `db/hooks.php` + listener — ver `01-moodle/hooks-y-apis.md` |
| Bundle React falla con `ChunkLoadError` apuntando a otro CDN | Dynamic imports + sin `publicPath` configurado | Imports estáticos + `splitChunks: false` — ver `06-frontend-react/integracion-moodle-amd.md` |
| PHPUnit falla con "behat no inicializado" | Falta init | `php admin/tool/phpunit/cli/init.php` |
| "Your Moodle is out of date" después de `git pull` del plugin | Cambió `version.php` | Visitar `/admin/index.php` |
| Credenciales admin de moodle-docker | Default tras install vía CLI | Usuario `admin`, password `test` (las define el script `install_database.php` en el quickstart oficial) |

## Decisiones tomadas para NexusAI

- **Moodle 4.4 / 4.5** en Docker como base de desarrollo. Skeleton verificado end-to-end en 4.5 (Sprint 1).
- **PostgreSQL** (coincide con el supuesto de producción UCC).
- **`local.yml` con bind mount directo del plugin** — no copy, no symlink. Verificado en Sprint 1: los symlinks no funcionan dentro del container Docker.
- **`$CFG->cachejs = false`** mientras iteramos en el bundle React.
- **Eventualmente probamos contra 4.1 LTS** usando `MOODLE_DOCKER_WWWROOT` apuntando a un clone distinto, para validar el callback legacy de `lib.php`.

## Abierto / pendiente

- [ ] Script helper `scripts/dev.sh` que haga `up + install + link del plugin` en un solo comando.
- [ ] Documentar setup con Apple Silicon (ARM) vs Intel.
- [ ] Evaluar Docker Compose profiles para alternar entre 4.1, 4.4 y 4.5 rápido.

## Referencias

- [moodlehq/moodle-docker](https://github.com/moodlehq/moodle-docker)
- [Moodle Dev — Setting up development environment](https://moodledev.io/general/development/process/setup)
- [Moodle — Debug settings](https://moodledev.io/docs/apis/core/log/debug)
- [Docker — Bind mounts](https://docs.docker.com/storage/bind-mounts/)
- Issue #126 — verificación end-to-end del setup en Sprint 1 (2026-05-04)

---

*Última actualización: 2026-05-04 — Delfina Salinas (revisado tras debug del setup en Sprint 1)*
