#!/bin/bash
# nexus_marcos.sh — versión personal de marcos (rutas absolutas de su máquina)
#
# USO:
#   ./scripts/nexus_marcos.sh start      # Backend + Moodle (sistema completo)
#   ./scripts/nexus_marcos.sh backend    # Solo backend (sin Moodle)
#   ./scripts/nexus_marcos.sh stop       # Para todo y preserva datos
#   ./scripts/nexus_marcos.sh restart    # Para y vuelve a levantar (completo)
#   ./scripts/nexus_marcos.sh status     # Estado de containers + URLs
#   ./scripts/nexus_marcos.sh logs [svc] # Logs en tiempo real (api, moodle, postgres, redis)
#   ./scripts/nexus_marcos.sh --help

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

NEXUSAI_DOCKER_CONTEXT="${NEXUSAI_DOCKER_CONTEXT:-default}"

# Rutas absolutas de la máquina de Marcos
MOODLE_DOCKER_DIR="${MOODLE_DOCKER_DIR:-/home/marcos/Escritorio/tesis/moodle-docker}"
export MOODLE_DOCKER_WWWROOT="${MOODLE_DOCKER_WWWROOT:-/home/marcos/Escritorio/tesis/moodle}"
export MOODLE_DOCKER_DB="${MOODLE_DOCKER_DB:-pgsql}"
export MOODLE_DOCKER_PHP_VERSION="${MOODLE_DOCKER_PHP_VERSION:-8.3}"
export MOODLE_DOCKER_WEB_PORT="${MOODLE_DOCKER_WEB_PORT:-8080}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}=>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }
die()  { err "$*"; exit 1; }

nexusai_compose() {
    docker --context "$NEXUSAI_DOCKER_CONTEXT" compose "$@"
}

moodle_compose() {
    [[ -d "$MOODLE_DOCKER_DIR" ]] || die "moodle-docker no encontrado en $MOODLE_DOCKER_DIR"
    [[ -d "$MOODLE_DOCKER_WWWROOT" ]] || die "Moodle source no encontrado en $MOODLE_DOCKER_WWWROOT"
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
    echo -e "  ${BOLD}Moodle:${NC}         http://localhost:${MOODLE_DOCKER_WEB_PORT}  (admin / admin)"
}

print_setup_reminder() {
    echo ""
    echo -e "  ${YELLOW}Primera vez?${NC} Configurar el plugin en Moodle:"
    echo -e "  Site admin → Plugins → Local plugins → NexusAI → completar:"
    echo -e "    Backend URL:    ${BOLD}http://host.docker.internal:${API_PORT:-8001}${NC}"
    echo -e "    API key:        valor de NEXUSAI_API_KEY en .env"
    echo -e "    Shared secret:  valor de NEXUSAI_SHARED_SECRET en .env"
    echo ""
    echo -e "  ${YELLOW}También:${NC} Site admin → Security → HTTP security"
    echo -e "    cURL blocked hosts list → vaciar"
    echo -e "    cURL allowed ports list → agregar ${BOLD}${API_PORT:-8001}${NC}"
}

wait_moodle_db() {
    log "Esperando a que la DB de Moodle esté lista..."
    "$MOODLE_DOCKER_DIR/bin/moodle-docker-wait-for-db" 2>/dev/null \
        && ok "DB de Moodle lista." \
        || warn "Timeout esperando DB de Moodle — puede tardar un poco más."
}

moodle_install_if_needed() {
    log "Verificando instalación de Moodle (puede tardar ~30s la primera vez)..."
    local output
    output=$(moodle_compose exec -T webserver php admin/cli/install_database.php \
        --agree-license \
        --fullname="NexusAI Dev" \
        --shortname="nexusai-dev" \
        --adminpass="admin" \
        --adminemail="admin@nexusai.dev" 2>&1 || true)

    if echo "$output" | grep -qi "already installed\|ya está instalado\|already exist"; then
        ok "Moodle ya estaba instalado — usando datos existentes."
    elif echo "$output" | grep -qi "Installation completed\|Instalación completada\|Success"; then
        ok "Base de datos de Moodle instalada."
    else
        if curl -sf "http://localhost:${MOODLE_DOCKER_WEB_PORT}/login/index.php" -o /dev/null 2>/dev/null; then
            ok "Moodle respondiendo en http://localhost:${MOODLE_DOCKER_WEB_PORT}"
        else
            warn "No se pudo verificar el estado de Moodle. Abrí http://localhost:${MOODLE_DOCKER_WEB_PORT} y seguí el wizard si aparece."
        fi
    fi
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

run_migrations() {
    log "Aplicando migraciones de Alembic en el backend..."
    if nexusai_compose exec -T api alembic upgrade head; then
        ok "Migraciones aplicadas (DB del backend al día)."
    else
        warn "No se pudieron aplicar las migraciones. Revisá: docker compose logs api"
    fi
}

cmd_start() {
    check_prereqs
    set -a; source .env 2>/dev/null || true; set +a

    log "Levantando backend (postgres + redis + api)..."
    nexusai_compose up -d postgres redis api
    wait_healthy postgres
    wait_healthy api
    run_migrations

    log "Levantando Moodle (moodle-docker)..."
    moodle_compose up -d
    wait_moodle_db
    moodle_install_if_needed
    ok "Sistema NexusAI levantado."
    print_urls_backend
    print_urls_moodle
    print_setup_reminder
    echo ""
}

cmd_backend() {
    check_prereqs
    set -a; source .env 2>/dev/null || true; set +a
    log "Levantando solo el backend (postgres + redis + api)..."
    nexusai_compose up -d postgres redis api
    wait_healthy postgres
    wait_healthy api
    run_migrations
    ok "Backend listo."
    print_urls_backend
    echo ""
}

cmd_stop() {
    log "Parando Moodle (stop, preserva DB y config)..."
    moodle_compose stop 2>/dev/null || warn "moodle-docker no estaba corriendo."
    log "Parando backend nexusai..."
    nexusai_compose down
    ok "Sistema detenido. Los datos siguen en los volúmenes."
}

cmd_moodle_reset() {
    warn "Esto borra TODOS los datos de Moodle (DB, uploads, config)."
    read -r -p "¿Seguro? Escribí 'borrar moodle': " confirm
    [[ "$confirm" == "borrar moodle" ]] || { log "Cancelado."; return; }
    moodle_compose down 2>/dev/null || true
    ok "Moodle reseteado. La próxima vez que levantes se instalará de cero."
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

${BOLD}nexus_marcos.sh — Sistema NexusAI (config de Marcos)${NC}

  moodle-docker: $MOODLE_DOCKER_DIR
  Moodle source: $MOODLE_DOCKER_WWWROOT

USO:
  ./scripts/nexus_marcos.sh <comando>

COMANDOS:
  start     Levanta el sistema completo (backend + Moodle) con auto-install
  backend   Levanta solo el backend (postgres + redis + api)
  stop      Para todos los servicios (preserva los datos)
  restart   Para y vuelve a levantar el sistema completo
  status    Muestra estado de containers y URLs
  logs [s]  Sigue los logs (api, moodle, postgres, redis)
  --help        Muestra esta ayuda
  moodle-reset  Borra TODOS los datos de Moodle (empezar de cero)

EOF
}

case "${1:-}" in
    start)          cmd_start ;;
    backend)        cmd_backend ;;
    stop|down)      cmd_stop ;;
    restart)        cmd_restart ;;
    status|ps)      cmd_status ;;
    logs)           cmd_logs "${2:-}" ;;
    moodle-reset)   cmd_moodle_reset ;;
    --help|-h|help) cmd_help ;;
    "")             cmd_help ;;
    *)              err "Comando desconocido: $1"; cmd_help; exit 1 ;;
esac
