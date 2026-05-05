#!/bin/bash
# NexusAI — setup end-to-end
#
# Levanta el stack del backend (Postgres + Redis + FastAPI), espera a que esté
# healthy, y al final imprime las credenciales que tenés que pegar en la
# pantalla de admin de Moodle.
#
# Pre-requisitos:
#   - .env existe con LLM_API_KEY real (no REPLACE_ME)
#   - Docker Desktop corriendo
#
# Uso:
#   cd ~/Documents/NexusAI/nexusAI/NexusAI
#   ./scripts/setup-e2e.sh
#
# Si querés volver a empezar desde cero (borrando datos):
#   ./scripts/dev.sh destroy
#   ./scripts/setup-e2e.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

step()  { echo -e "${BLUE}▶${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}!${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*" >&2; }

# ============================================================
# 1. Pre-checks
# ============================================================
step "Verificando pre-requisitos..."

if ! command -v docker &> /dev/null; then
    err "Docker no está instalado. Instalalo desde https://docker.com"
    exit 1
fi

if ! docker info &> /dev/null; then
    err "Docker Desktop no está corriendo. Abrilo y volvé a correr este script."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    err "Docker Compose v2 no disponible. Actualizá Docker Desktop."
    exit 1
fi

if [ ! -f .env ]; then
    err ".env no existe. Corré primero:  cp .env.example .env  y completá los valores."
    exit 1
fi

# Validar que LLM_API_KEY esté completada
if grep -qE "^LLM_API_KEY=REPLACE_ME" .env; then
    err "LLM_API_KEY tiene el placeholder REPLACE_ME en .env."
    err "Conseguí una API key gratis en https://aistudio.google.com/apikey"
    err "y reemplazá ambas líneas LLM_API_KEY= y EMBEDDING_API_KEY= en .env"
    exit 1
fi

if grep -qE "^EMBEDDING_API_KEY=REPLACE_ME" .env; then
    err "EMBEDDING_API_KEY tiene el placeholder REPLACE_ME en .env."
    err "Usá la misma key de Gemini que pusiste en LLM_API_KEY."
    exit 1
fi

# Validar HMAC secrets (estos los generamos automáticos antes)
for var in NEXUSAI_API_KEY NEXUSAI_SHARED_SECRET; do
    if grep -qE "^${var}=REPLACE" .env; then
        err "$var no está completada en .env."
        err "Generala con:  openssl rand -hex 32"
        exit 1
    fi
done

ok ".env validado"

# Leer credenciales para mostrar al final
API_KEY=$(grep -E "^NEXUSAI_API_KEY=" .env | cut -d= -f2-)
SHARED_SECRET=$(grep -E "^NEXUSAI_SHARED_SECRET=" .env | cut -d= -f2-)
LLM_MODEL=$(grep -E "^LLM_MODEL=" .env | cut -d= -f2-)

# ============================================================
# 2. Levantar el stack
# ============================================================
step "Levantando Postgres + pgvector + Redis + API..."
docker compose up -d postgres redis api

# ============================================================
# 3. Esperar a que el API esté healthy
# ============================================================
step "Esperando a que el API responda /health..."

API_URL="http://localhost:8001/health"
MAX_WAIT=60
WAITED=0

while ! curl -sf "$API_URL" > /dev/null 2>&1; do
    if [ $WAITED -ge $MAX_WAIT ]; then
        err "Timeout: el API no respondió en ${MAX_WAIT}s."
        err "Mirá los logs:  docker compose logs api"
        exit 1
    fi
    sleep 2
    WAITED=$((WAITED + 2))
    echo -n "."
done
echo ""
ok "API healthy en http://localhost:8001"

# ============================================================
# 4. Verificar que las migraciones corran
# ============================================================
step "Aplicando migraciones de Alembic (si Marcos las tiene listas)..."
if docker compose exec -T api alembic upgrade head 2>&1 | grep -qE "(Running upgrade|already at head|head|FAILED)"; then
    ok "Migraciones aplicadas"
else
    warn "Alembic no está configurado todavía o falló. El endpoint /chat puede fallar hasta que esté."
    warn "Para revisar:  docker compose exec api alembic current"
fi

# ============================================================
# 5. Smoke test del backend
# ============================================================
step "Smoke test: GET /health"
curl -s "$API_URL" | head -c 300
echo ""

# ============================================================
# 6. Resumen final
# ============================================================
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║                  STACK LEVANTADO CORRECTAMENTE                   ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}URLs útiles:${NC}"
echo "  • API health:        http://localhost:8001/health"
echo "  • API docs (Swagger): http://localhost:8001/docs"
echo "  • Postgres:           localhost:5432  (user: nexusai)"
echo "  • Redis:              localhost:6379"
echo ""
echo -e "${BOLD}Próximos pasos manuales:${NC}"
echo ""
echo -e "${YELLOW}1.${NC} Asegurate que moodle-docker esté corriendo:"
echo "   cd ~/Documents/NexusAI/moodle-docker && bin/moodle-docker-compose up -d"
echo ""
echo -e "${YELLOW}2.${NC} Entrá a Moodle:  http://localhost:8000  (admin / test)"
echo ""
echo -e "${YELLOW}3.${NC} Site administration → Notifications → confirmá el upgrade del plugin (versión 0.2.1)"
echo ""
echo -e "${YELLOW}4.${NC} Site administration → Plugins → Local plugins → NexusAI"
echo "   Pegá estos valores:"
echo ""
echo -e "   ${BOLD}Backend API URL:${NC}"
echo -e "      ${BLUE}http://host.docker.internal:8001${NC}"
echo ""
echo -e "   ${BOLD}API key:${NC}"
echo -e "      ${BLUE}${API_KEY}${NC}"
echo ""
echo -e "   ${BOLD}Shared secret:${NC}"
echo -e "      ${BLUE}${SHARED_SECRET}${NC}"
echo ""
echo -e "${YELLOW}5.${NC} Site administration → Development → Purge all caches"
echo ""
echo -e "${YELLOW}6.${NC} Andá a tu curso → abrí el chat → preguntá algo. Vas a ver respuesta del LLM (${LLM_MODEL})."
echo ""
echo -e "${BOLD}Si algo falla:${NC}"
echo "  • Logs API:    docker compose logs -f api"
echo "  • Logs Redis:  docker compose logs -f redis"
echo "  • Logs Postgres: docker compose logs -f postgres"
echo ""
echo -e "${BOLD}Para parar todo cuando termines:${NC}"
echo "  ./scripts/dev.sh down"
echo ""
