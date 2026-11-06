#!/usr/bin/env bash
# Levanta el entorno de la demo desde cero: Moodle 4.5 + plugin + backend.
#
# Requisitos: Docker con Compose, .env completo (ver .env.example) y
# outputs/cuentas.csv (python3 generar_cuentas.py ...).
#
# Uso (desde NexusAI/deploy/demo/):
#   ./setup.sh                 # con el LLM real configurado en .env
#   MOCK=1 ./setup.sh          # con el LLM simulado (pruebas sin gastar)
#   MATERIAL=outputs/informe-ipi.pdf ./setup.sh   # además sube el informe al curso
#
# Es idempotente: si Moodle ya está instalado, solo reaplica la configuración.
set -euo pipefail

cd "$(dirname "$0")"

[ -f .env ] || { echo "Falta .env: copiá .env.example y completalo." >&2; exit 1; }
set -a; . ./.env; set +a
[ -f outputs/cuentas.csv ] || { echo "Falta outputs/cuentas.csv: corré generar_cuentas.py." >&2; exit 1; }

MOODLE_DIR="${MOODLE_SRC:-./moodle}"
COMPOSE=(docker compose)
if [ "${MOCK:-0}" = "1" ]; then COMPOSE+=(--profile mock); fi

# 1. Código de Moodle 4.5 (misma rama que la matriz del CI del plugin).
# Se baja el tarball de la rama (más robusto que un clon superficial en redes inestables).
if [ ! -f "$MOODLE_DIR/version.php" ]; then
  echo "==> Descargando Moodle 4.5 en $MOODLE_DIR"
  mkdir -p "$MOODLE_DIR" outputs
  curl -fL --retry 5 --retry-all-errors --retry-delay 5 \
    -o outputs/moodle-405.tar.gz \
    https://github.com/moodle/moodle/archive/refs/heads/MOODLE_405_STABLE.tar.gz
  tar -xzf outputs/moodle-405.tar.gz -C "$MOODLE_DIR" --strip-components=1
  rm -f outputs/moodle-405.tar.gz
fi

# 2. config.php del Moodle (no se commitea: lleva la contraseña de la base).
SSLPROXY="false"
case "$MOODLE_WWWROOT" in https://*) SSLPROXY="true" ;; esac
cat > "$MOODLE_DIR/config.php" <<PHP
<?php  // Generado por deploy/demo/setup.sh — no editar a mano.
unset(\$CFG);
global \$CFG;
\$CFG = new stdClass();
\$CFG->dbtype    = 'pgsql';
\$CFG->dblibrary = 'native';
\$CFG->dbhost    = 'postgres';
\$CFG->dbname    = 'moodle';
\$CFG->dbuser    = '${POSTGRES_USER}';
\$CFG->dbpass    = '${POSTGRES_PASSWORD}';
\$CFG->prefix    = 'mdl_';
\$CFG->dboptions = ['dbport' => 5432];
\$CFG->wwwroot   = '${MOODLE_WWWROOT}';
\$CFG->dataroot  = '/var/moodledata';
\$CFG->admin     = 'admin';
\$CFG->directorypermissions = 02777;
// Caddy termina el HTTPS y le habla a Moodle por HTTP.
\$CFG->sslproxy  = ${SSLPROXY};
require_once(__DIR__ . '/lib/setup.php');
PHP

# 3. Servicios.
echo "==> Levantando servicios"
"${COMPOSE[@]}" up -d --build postgres redis uploads-perms api moodle
if [ "${MOCK:-0}" = "1" ]; then "${COMPOSE[@]}" up -d mock-llm; fi

echo "==> Esperando a la base y a la API"
for _ in $(seq 1 60); do
  if docker compose exec -T api curl -fsS http://localhost:8000/health >/dev/null 2>&1; then break; fi
  sleep 3
done
docker compose exec -T api curl -fsS http://localhost:8000/health || { echo "La API no responde" >&2; exit 1; }
echo

docker compose exec -T moodle chown -R www-data:www-data /var/moodledata

# 4. Paquete de idioma español (en moodledata, antes de instalar).
if ! docker compose exec -T moodle test -f /var/moodledata/lang/es/langconfig.php; then
  echo "==> Descargando el paquete de idioma español"
  mkdir -p outputs
  curl -fsSL https://download.moodle.org/download.php/direct/langpack/4.5/es.zip -o outputs/es.zip
  docker compose cp outputs/es.zip moodle:/tmp/es.zip
  docker compose exec -T -u www-data moodle php -r '
    @mkdir("/var/moodledata/lang", 02777, true);
    $z = new ZipArchive();
    if ($z->open("/tmp/es.zip") !== true) { fwrite(STDERR, "zip inválido\n"); exit(1); }
    $z->extractTo("/var/moodledata/lang"); $z->close();'
fi

# 5. Instalación de Moodle (instala también local_nexusai, montado en local/nexusai).
INSTALLED="$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d moodle -tAc "SELECT to_regclass('mdl_config') IS NOT NULL")"
if [ "$INSTALLED" = "t" ]; then
  echo "==> Moodle ya instalado: actualizando plugins si hace falta"
  docker compose exec -T -u www-data moodle php admin/cli/upgrade.php --non-interactive
else
  echo "==> Instalando Moodle"
  docker compose exec -T -u www-data moodle php admin/cli/install_database.php \
    --agree-license --lang=es \
    --adminuser="$MOODLE_ADMIN_USER" --adminpass="$MOODLE_ADMIN_PASSWORD" \
    --adminemail="$MOODLE_ADMIN_EMAIL" \
    --fullname="NexusAI · Demo de la defensa" --shortname="NexusAI Demo"
fi

# 6. Plugin, sitio, curso y cuentas (y el material, si se pasó).
cp outputs/cuentas.csv outputs/.cuentas-container.csv
ARGS=(--accounts=/opt/demo-outputs/.cuentas-container.csv)
if [ -n "${MATERIAL:-}" ]; then
  [ -f "$MATERIAL" ] || { echo "No existe $MATERIAL" >&2; exit 1; }
  cp "$MATERIAL" "outputs/$(basename "$MATERIAL")" 2>/dev/null || true
  ARGS+=(--material="/opt/demo-outputs/$(basename "$MATERIAL")")
fi
docker compose exec -T -u www-data \
  -e NEXUSAI_API_KEY="$NEXUSAI_API_KEY" -e NEXUSAI_SHARED_SECRET="$NEXUSAI_SHARED_SECRET" \
  moodle php /opt/demo/setup_demo.php "${ARGS[@]}"
rm -f outputs/.cuentas-container.csv

# 7. Cron y Caddy.
"${COMPOSE[@]}" up -d moodle-cron caddy
echo
echo "==> Listo: $MOODLE_WWWROOT"
