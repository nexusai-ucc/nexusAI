#!/bin/bash
# NexusAI — empaqueta el plugin como ZIP listo para subir a un Moodle.
#
# Uso:
#   ./scripts/package-plugin.sh          # genera local_nexusai-vX.Y.Z.zip
#   ./scripts/package-plugin.sh --clean  # primero limpia node_modules y rebuildea
#
# Output:
#   ./dist/local_nexusai-vX.Y.Z.zip
#
# El ZIP queda con la estructura que espera Moodle:
#   local_nexusai/
#     ├── version.php
#     ├── lib.php
#     ├── classes/
#     ├── db/
#     ├── lang/
#     ├── amd/build/
#     └── ...

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PLUGIN_DIR="plugin/local/nexusai"
DIST_DIR="dist"
CLEAN_BUILD=0

# ----- Parsear flags -----
for arg in "$@"; do
    case "$arg" in
        --clean)  CLEAN_BUILD=1 ;;
        -h|--help)
            sed -n '2,18p' "$0"
            exit 0
            ;;
    esac
done

# ----- Colores -----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}==>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}!!${NC}  $*"; }
err()  { echo -e "${RED}xx${NC}  $*" >&2; }

# ----- 1. Leer version.php para extraer la versión -----
if [ ! -f "$PLUGIN_DIR/version.php" ]; then
    err "No se encuentra $PLUGIN_DIR/version.php"
    exit 1
fi

VERSION=$(grep "release" "$PLUGIN_DIR/version.php" | grep -oE "'[0-9]+\.[0-9]+\.[0-9]+'" | tr -d "'" | head -1)
if [ -z "$VERSION" ]; then
    err "No pude extraer la versión de $PLUGIN_DIR/version.php"
    exit 1
fi
log "Versión detectada: $VERSION"

# ----- 2. (Opcional) rebuild del frontend en modo producción -----
if [ "$CLEAN_BUILD" -eq 1 ]; then
    log "Limpiando y rebuildeando frontend en modo producción..."
    pushd "$PLUGIN_DIR/react" > /dev/null
    npm install
    npm run build
    popd > /dev/null
    ok "Bundle rebuildeado"
else
    if [ ! -f "$PLUGIN_DIR/amd/build/chatwidget-lazy.min.js" ]; then
        warn "No se encuentra el bundle compilado. Corré: ./scripts/package-plugin.sh --clean"
        exit 1
    fi
    log "Usando bundle ya compilado (correr con --clean para rebuildear)"
fi

# ----- 3. Verificar que no hay bundle de dev -----
# El bundle de dev tiene .map files y comentarios — Moodle lo aceptaría igual
# pero queda feo en producción.
if find "$PLUGIN_DIR/amd/build" -name "*.map" | grep -q .; then
    warn "El build contiene .map files (modo dev). Considerá rebuildear con --clean para producción."
fi

# ----- 4. Limpiar dist y crear el ZIP -----
log "Limpiando $DIST_DIR/"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

ZIP_NAME="local_nexusai-v${VERSION}.zip"
log "Generando $ZIP_NAME..."

# zip desde plugin/local/ para que la raíz del ZIP sea "local_nexusai/" (lo que
# Moodle espera al hacer "Install plugin from ZIP").
cd "plugin/local"
zip -r "../../${DIST_DIR}/${ZIP_NAME}" "nexusai" \
    -x "nexusai/react/node_modules/*" \
    -x "nexusai/react/.cache/*" \
    -x "nexusai/react/src/*" \
    -x "nexusai/react/package-lock.json" \
    -x "nexusai/react/webpack.config.js" \
    -x "nexusai/react/babel.config.json" \
    -x "nexusai/react/.eslintrc*" \
    -x "nexusai/react/README.md" \
    -x "*.DS_Store" \
    -x "*.swp" \
    > /dev/null

cd "$REPO_ROOT"
SIZE=$(du -h "${DIST_DIR}/${ZIP_NAME}" | cut -f1)

ok "ZIP generado: ${DIST_DIR}/${ZIP_NAME} (${SIZE})"
echo ""
echo "Para instalar en cualquier Moodle 4.1–4.5:"
echo "  1. Loguearse como admin"
echo "  2. Site administration → Plugins → Install plugins"
echo "  3. Subir ${ZIP_NAME}"
echo "  4. Seguir el wizard"
echo "  5. Configurar Backend URL + API key + Shared secret en"
echo "     Site administration → Plugins → Local plugins → NexusAI"
