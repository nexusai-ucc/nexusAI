#!/usr/bin/env bash
# seed_demo.sh — Carga datos de demo en Moodle local para NexusAI.
#
# Uso:
#   ./scripts/seed_demo.sh          # desde NexusAI/
#
# Qué hace:
#   - Copia seed_demo_data.php al directorio raíz de Moodle
#   - Lo ejecuta dentro del container webserver vía moodle-docker-compose
#   - Lo limpia al terminar
#
# Requisitos:
#   - Sistema levantado: ./scripts/nexus_marcos.sh start
#   - Variables de entorno de moodle-docker ya seteadas (o usa los defaults de nexus_marcos.sh)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOODLE_DOCKER_DIR="${MOODLE_DOCKER_DIR:-/home/marcos/Escritorio/tesis/moodle-docker}"
MOODLE_WWWROOT="${MOODLE_DOCKER_WWWROOT:-/home/marcos/Escritorio/tesis/moodle}"
MOODLE_DOCKER_DB="${MOODLE_DOCKER_DB:-pgsql}"
MOODLE_DOCKER_PHP_VERSION="${MOODLE_DOCKER_PHP_VERSION:-8.3}"

COMPOSE="$MOODLE_DOCKER_DIR/bin/moodle-docker-compose"
SEED_PHP="$SCRIPT_DIR/seed_demo_data.php"
DEST_PHP="$MOODLE_WWWROOT/seed_demo_data.php"

bold='\033[1m'
green='\033[0;32m'
red='\033[0;31m'
reset='\033[0m'

log()  { echo -e "  $1"; }
ok()   { echo -e "  ${green}✓${reset} $1"; }
die()  { echo -e "  ${red}✗ ERROR:${reset} $1"; exit 1; }

echo ""
echo -e "${bold}=== NexusAI — Seed de datos de demo ===${reset}"
echo ""

# Verificaciones previas
[[ -f "$SEED_PHP" ]]    || die "No se encontró $SEED_PHP"
[[ -d "$MOODLE_WWWROOT" ]] || die "Moodle source no encontrado en $MOODLE_WWWROOT. Verificá MOODLE_DOCKER_WWWROOT."
[[ -f "$COMPOSE" ]]     || die "moodle-docker-compose no encontrado en $COMPOSE. Verificá MOODLE_DOCKER_DIR."

# Verificar que el container webserver está corriendo
if ! "$COMPOSE" ps webserver 2>/dev/null | grep -q "Up\|running"; then
    die "El container de Moodle no está corriendo. Ejecutá primero: ./scripts/nexus_marcos.sh start"
fi

# Copiar el script al WWWROOT (que está montado en el container como /var/www/html)
log "Copiando seed_demo_data.php a $MOODLE_WWWROOT ..."
cp "$SEED_PHP" "$DEST_PHP"
ok "Archivo copiado"

# Ejecutar dentro del container
log "Ejecutando en el container webserver ..."
echo ""
"$COMPOSE" exec -T webserver php /var/www/html/seed_demo_data.php
echo ""

# Limpiar
log "Limpiando archivo temporal ..."
rm -f "$DEST_PHP"
ok "Archivo eliminado"

echo ""
echo -e "${bold}=== Seed terminado ===${reset}"
echo ""
echo "  Moodle: http://localhost:8080"
echo "  Admin:  admin / admin"
echo "  Probar con alumno: alumno1 / Alumno123!"
echo "  Probar con docente: dr.garcia / Garcia123!"
echo ""
