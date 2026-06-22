#!/bin/bash
# nexus.sh — levantar y cerrar el sistema NexusAI completo
#
# USO:
#   ./scripts/nexus.sh start      # Backend + Moodle (sistema completo)
#   ./scripts/nexus.sh backend    # Solo backend (sin Moodle)
#   ./scripts/nexus.sh stop       # Para todo y preserva datos
#   ./scripts/nexus.sh restart    # Para y vuelve a levantar (completo)
#   ./scripts/nexus.sh status     # Estado de containers + URLs
#   ./scripts/nexus.sh logs [svc] # Logs en tiempo real (api, moodle, postgres, redis)
#   ./scripts/nexus.sh --help

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Backend nexusai corre en el daemon del sistema (no Docker Desktop)
NEXUSAI_DOCKER_CONTEXT="${NEXUSAI_DOCKER_CONTEXT:-default}"

# moodle-docker — override con MOODLE_DOCKER_DIR si está en otro lugar
MOODLE_DOCKER_DIR="${MOODLE_DOCKER_DIR:-$HOME/dev/moodle-docker}"
export MOODLE_DOCKER_WWWROOT="${MOODLE_DOCKER_WWWROOT:-$HOME/dev/moodle}"
export MOODLE_DOCKER_DB="${MOODLE_DOCKER_DB:-pgsql}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}=>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }
die()  { err "$*"; exit 1; }

# Wrapper: docker compose apuntando al daemon correcto
nexusai_compose() {
    docker --context "$NEXUSAI_DOCKER_CONTEXT" compose "$@"
}

# Wrapper: moodle-docker-compose con las vars necesarias
moodle_compose() {
    [[ -d "$MOODLE_DOCKER_DIR" ]] || die "moodle-docker no encontrado en $MOODLE_DOCKER_DIR. Cloná con: git clone https://github.com/moodlehq/moodle-docker.git $MOODLE_DOCKER_DIR"
    [[ -d "$MOODLE_DOCKER_WWWROOT" ]] || die "Moodle source no encontrado en $MOODLE_DOCKER_WWWROOT. Cloná con: git clone -b MOODLE_404_STABLE https://git.in.moodle.com/moodle/moodle.git $MOODLE_DOCKER_WWWROOT"
    "$MOODLE_DOCKER_DIR/bin/moodle-docker-compose" "$@"
}

check_prereqs() {
    command -v docker &>/dev/null || die "Docker no está instalado."
    docker --context "$NEXUSAI_DOCKER_CONTEXT" compose version &>/dev/null || die "Docker Compose v2 no disponible."
    [[ -f .env ]] || {
        warn ".env no existe — copiando desde .env.example..."
        cp .env.example .env
        die "Editá .env y completá los valores antes de continuar."
    }
}

print_urls_backend() {
    echo ""
    echo -e "  ${BOLD}API (Swagger):${NC}  http://localhost:${API_PORT:-8001}/docs"
    echo -e "  ${BOLD}Postgres:${NC}       localhost:${POSTGRES_PORT:-5432}"
    echo -e "  ${BOLD}Redis:${NC}          localhost:${REDIS_PORT:-6379}"
}

print_urls_moodle() {
    echo -e "  ${BOLD}Moodle:${NC}         http://localhost:8000  (admin / admin)"
}

wait_healthy() {
    local service="$1"
    local max=30
    local i=0
    log "Esperando que '$service' esté healthy..."
    while [[ $i -lt $max ]]; do
        status=$(docker --context "$NEXUSAI_DOCKER_CONTEXT" inspect --format='{{.State.Health.Status}}' "nexusai-${service}" 2>/dev/null || echo "")
        [[ "$status" == "healthy" ]] && return 0
        sleep 3
        (( i++ )) || true
    done
    warn "'$service' todavía no está healthy después de ${max} intentos — seguimos igual."
}

cmd_start() {
    check_prereqs
    set -a; source .env 2>/dev/null || true; set +a

    log "Levantando backend (postgres + redis + api)..."
    nexusai_compose up -d postgres redis api
    wait_healthy postgres
    wait_healthy api

    log "Levantando Moodle (moodle-docker)..."
    moodle_compose up -d
    ok "Sistema NexusAI levantado."
    print_urls_backend
    print_urls_moodle
    echo ""
}

cmd_backend() {
    check_prereqs
    set -a; source .env 2>/dev/null || true; set +a
    log "Levantando solo el backend (postgres + redis + api)..."
    nexusai_compose up -d postgres redis api
    wait_healthy postgres
    wait_healthy api
    ok "Backend listo."
    print_urls_backend
    echo ""
}

cmd_stop() {
    log "Parando Moodle..."
    moodle_compose down 2>/dev/null || warn "moodle-docker no estaba corriendo."
    log "Parando backend nexusai..."
    nexusai_compose down
    ok "Sistema detenido. Los datos siguen en los volúmenes."
}

cmd_restart() {
    cmd_stop
    cmd_start
}

cmd_status() {
    set -a; source .env 2>/dev/null || true; set +a
    echo ""
    echo -e "${BOLD}=== Backend NexusAI ===${NC}"
    nexusai_compose ps 2>/dev/null || warn "Backend no está corriendo."
    echo ""
    echo -e "${BOLD}=== Moodle ===${NC}"
    moodle_compose ps 2>/dev/null || warn "Moodle no está corriendo."
    echo ""
    echo -e "${BOLD}URLs:${NC}"
    print_urls_backend
    print_urls_moodle
    echo ""
}

cmd_logs() {
    local svc="${1:-}"
    if [[ -z "$svc" ]]; then
        nexusai_compose logs -f --tail=100
    elif [[ "$svc" == "moodle" ]]; then
        moodle_compose logs -f --tail=100 webserver
    else
        nexusai_compose logs -f --tail=100 "$svc"
    fi
}

cmd_help() {
    cat <<EOF

${BOLD}nexus.sh — Sistema NexusAI${NC}

USO:
  ./scripts/nexus.sh <comando> [opciones]

COMANDOS:
  start           Levanta el sistema completo (backend + Moodle)
  backend         Levanta solo el backend (postgres + redis + api), sin Moodle
  stop            Para todos los servicios (preserva los datos)
  restart         Para y vuelve a levantar el sistema completo
  status          Muestra estado de containers y URLs
  logs [servicio] Sigue los logs en tiempo real
                  Servicios: api, moodle, postgres, redis
  --help / -h     Muestra esta ayuda

EJEMPLOS:
  ./scripts/nexus.sh start          # Arrancar todo
  ./scripts/nexus.sh stop           # Apagar todo
  ./scripts/nexus.sh logs api       # Ver logs del backend
  ./scripts/nexus.sh logs moodle    # Ver logs de Moodle
  ./scripts/nexus.sh backend        # Solo backend (modo desarrollo)

NOTAS:
  - Backend corre en el daemon del sistema (contexto Docker: $NEXUSAI_DOCKER_CONTEXT).
  - Moodle usa moodle-docker en $MOODLE_DOCKER_DIR con source en $MOODLE_DOCKER_WWWROOT.
  - Los datos (DB, uploads) sobreviven al stop. Para borrar volúmenes: docker compose down -v
  - Para más opciones avanzadas (psql, rebuild, pgAdmin): ./scripts/dev.sh --help

EOF
}

case "${1:-}" in
    start)          cmd_start ;;
    backend)        cmd_backend ;;
    stop|down)      cmd_stop ;;
    restart)        cmd_restart ;;
    status|ps)      cmd_status ;;
    logs)           cmd_logs "${2:-}" ;;
    --help|-h|help) cmd_help ;;
    "")             cmd_help ;;
    *)              err "Comando desconocido: $1"; cmd_help; exit 1 ;;
esac
