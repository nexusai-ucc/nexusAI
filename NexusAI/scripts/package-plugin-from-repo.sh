#!/bin/bash
# NexusAI — empaqueta el plugin como ZIP directo desde el repo separado
# moodle-local_nexusai (no desde el working tree local del monorepo).
#
# Por qué este script y no package-plugin.sh: moodle-local_nexusai es el
# repo que Moodle Marketplace usa como "código fuente" del plugin (por eso
# se separó del monorepo en primer lugar — ver .github/workflows/sync-derived-repos.yml).
# Armar el ZIP desde un clone fresco de su rama `main` garantiza que lo que
# se sube a Marketplace es exactamente lo que cualquiera puede ver/auditar
# en ese repo público — sin depender de que el working tree local no tenga
# cambios sin commitear ni pushear.
#
# El bundle de React (amd/build/*.min.js) ya viene commiteado en ese repo
# (ver su .gitignore), así que no hace falta Node/npm para nada acá.
#
# lang/es/ se excluye SOLO del ZIP (queda intacto en el repo, para quien
# quiera clonar y usar el plugin en local en español). La guía de
# Marketplace dice explícitamente que la publicación inicial debe incluir
# solo strings en inglés -- las traducciones se suben después vía AMOS.
#
# Uso:
#   ./scripts/package-plugin-from-repo.sh            # clona main y empaqueta
#   ./scripts/package-plugin-from-repo.sh development # o cualquier otra rama/tag
#
# Output:
#   ./dist/local_nexusai-vX.Y.Z.zip

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PLUGIN_REPO_URL="https://github.com/nexusai-ucc/moodle-local_nexusai.git"
REF="${1:-main}"
DIST_DIR="dist"

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}==>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
err()  { echo -e "${RED}xx${NC}  $*" >&2; }

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

log "Clonando moodle-local_nexusai @ ${REF} (shallow)..."
git clone --quiet --depth 1 --branch "$REF" "$PLUGIN_REPO_URL" "$WORKDIR/nexusai"

if [ ! -f "$WORKDIR/nexusai/version.php" ]; then
    err "El clone no tiene version.php -- ¿rama/tag correcto?"
    exit 1
fi

VERSION=$(grep "release" "$WORKDIR/nexusai/version.php" | grep -oE "'[0-9]+\.[0-9]+\.[0-9]+'" | tr -d "'" | head -1)
if [ -z "$VERSION" ]; then
    err "No pude extraer la versión de version.php"
    exit 1
fi
log "Versión detectada: $VERSION (ref: $REF)"

if [ ! -f "$WORKDIR/nexusai/amd/build/chatwidget-lazy.min.js" ]; then
    err "El repo clonado no tiene el bundle compilado en amd/build/ -- algo anda mal con ese repo."
    exit 1
fi

log "Limpiando $DIST_DIR/"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

ZIP_NAME="local_nexusai-v${VERSION}.zip"
log "Generando $ZIP_NAME..."

# La carpeta raíz del ZIP tiene que llamarse "nexusai" (el nombre del plugin
# SIN el prefijo del tipo): Moodle la descomprime dentro de local/. El
# checkout ya se llama así, así que solo hay que sacarle el .git.
rm -rf "$WORKDIR/nexusai/.git"

cd "$WORKDIR"
zip -r "${REPO_ROOT}/${DIST_DIR}/${ZIP_NAME}" "nexusai" \
    -x "nexusai/.github/*" \
    -x "nexusai/.gitignore" \
    -x "nexusai/react/node_modules/*" \
    -x "nexusai/react/.cache/*" \
    -x "nexusai/react/src/*" \
    -x "nexusai/react/package-lock.json" \
    -x "nexusai/react/webpack.config.js" \
    -x "nexusai/react/babel.config.json" \
    -x "nexusai/react/.babelrc" \
    -x "nexusai/react/vitest.setup.js" \
    -x "nexusai/react/vitest.config.js" \
    -x "nexusai/react/scripts/*" \
    -x "nexusai/react/.eslintrc*" \
    -x "nexusai/react/README.md" \
    -x "nexusai/lang/es/*" \
    -x "*.gitignore" \
    -x "*.gitkeep" \
    -x "*.DS_Store" \
    -x "*.swp" \
    > /dev/null

cd "$REPO_ROOT"
SIZE=$(du -h "${DIST_DIR}/${ZIP_NAME}" | cut -f1)

ok "ZIP generado: ${DIST_DIR}/${ZIP_NAME} (${SIZE})"
echo ""
echo "Fuente: https://github.com/nexusai-ucc/moodle-local_nexusai @ ${REF}"
echo "Nota: lang/es/ NO va en este ZIP (solo inglés, por la guía de Marketplace)."
echo "      Sigue disponible clonando el repo directamente."
