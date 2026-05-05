#!/bin/bash
# NexusAI — helper de desarrollo
#
# Wrapper de docker compose con shortcuts para tareas comunes del dev loop.
# Correr desde la raíz del repo:  ./scripts/dev.sh <comando>

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ----- Colores para output -----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}==>${NC} $*"; }
warn()  { echo -e "${YELLOW}!!${NC}  $*"; }
err()   { echo -e "${RED}xx${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}✓${NC}  $*"; }

# ----- Verificar prerequisitos -----
check_prereqs() {
    if ! command -v docker &> /dev/null; then
        err "Docker no está instalado. Instalalo desde https://docker.com"
        exit 1
    fi
    if ! docker compose version &> /dev/null; then
        err "Docker Compose v2 no está disponible. Actualizá Docker Desktop."
        exit 1
    fi
    if [ ! -f .env ]; then
        warn ".env no existe. Copiando desde .env.example..."
        cp .env.example .env
        warn "Editá .env y completá los valores marcados como REPLACE_ME antes de seguir."
        exit 1
    fi
}

# ----- Comandos -----

cmd_up() {
    check_prereqs
    log "Levantando stack mínimo (postgres + redis + api)..."
    docker compose up -d postgres redis api
    log "Esperando a que el API esté healthy..."
    sleep 5
    ok "Stack listo. URLs:"
    echo "   - API:        http://localhost:8001/docs"
    echo "   - Postgres:   localhost:5432  (user: nexusai)"
    echo "   - Redis:      localhost:6379"
}

cmd_full() {
    check_prereqs
    log "Levantando stack completo (+ moodle)..."
    docker compose --profile full up -d
    log "Esperando a Moodle (puede tardar 1-2 min en el primer arranque)..."
    sleep 10
    ok "Stack completo listo. URLs:"
    echo "   - Moodle:     http://localhost:8080  (admin/adminpass123)"
    echo "   - API:        http://localhost:8001/docs"
    echo "   - Postgres:   localhost:5432"
    echo "   - Redis:      localhost:6379"
}

cmd_tools() {
    check_prereqs
    log "Levantando herramientas de inspección (pgAdmin)..."
    docker compose --profile tools up -d pgadmin
    ok "pgAdmin disponible en: http://localhost:5050"
    echo "   User: admin@example.com  /  Pass: admin"
    echo "   Para conectar al postgres del compose:"
    echo "     Host:     postgres"
    echo "     Port:     5432"
    echo "     User:     nexusai"
    echo "     Pass:     nexusai_dev"
    echo "     Database: nexusai"
}

cmd_down() {
    log "Parando todos los servicios (preservando datos)..."
    docker compose --profile full --profile tools down
    ok "Stack detenido. Datos preservados en volúmenes."
}

cmd_destroy() {
    warn "Esto va a BORRAR TODOS LOS DATOS (postgres, redis, moodle, pgadmin)."
    read -p "¿Estás seguro? Escribí 'borrar todo' para confirmar: " confirm
    if [ "$confirm" != "borrar todo" ]; then
        log "Cancelado."
        exit 0
    fi
    log "Borrando volúmenes..."
    docker compose --profile full --profile tools down -v
    ok "Stack y datos borrados."
}

cmd_logs() {
    local service="${1:-}"
    if [ -z "$service" ]; then
        docker compose --profile full --profile tools logs -f
    else
        docker compose logs -f "$service"
    fi
}

cmd_shell_postgres() {
    log "Abriendo psql en la DB nexusai..."
    docker compose exec postgres psql -U nexusai -d nexusai
}

cmd_shell_api() {
    log "Abriendo shell en el container del API..."
    docker compose exec api bash
}

cmd_status() {
    docker compose --profile full --profile tools ps
}

cmd_reload() {
    check_prereqs
    log "Recreando containers (lee .env nuevo)..."
    docker compose up -d --force-recreate postgres redis api
    sleep 5
    ok "Containers recreados con la config actual del .env."
    echo "   Verificá:  ./scripts/dev.sh logs api"
}

cmd_help() {
    cat <<EOF
NexusAI — helper de desarrollo

USO:
  ./scripts/dev.sh <comando>

COMANDOS:
  up            Levanta stack mínimo (postgres + redis + api)
  full          Levanta stack completo (+ moodle)
  tools         Levanta herramientas de inspección (pgAdmin)
  reload        Recrea containers leyendo .env nuevo (usar tras editar .env)
  down          Para todos los servicios (preserva datos)
  destroy       Borra TODOS los volúmenes y datos (¡irreversible!)
  status        Muestra el estado de los containers
  logs [svc]    Sigue los logs (opcionalmente de un servicio: postgres, redis, api, moodle)
  shell:pg      Abre psql en la DB nexusai
  shell:api     Abre bash en el container del API
  help          Muestra esta ayuda

EJEMPLOS:
  ./scripts/dev.sh up                 # Lo más común — backend dev
  ./scripts/dev.sh full               # Demo E2E con Moodle
  ./scripts/dev.sh logs api           # Seguir logs del backend
  ./scripts/dev.sh shell:pg           # Inspeccionar la DB

URLs DESPUÉS DE 'up':
  - API:        http://localhost:8001/docs
  - Postgres:   localhost:5432
  - Redis:      localhost:6379

URLs DESPUÉS DE 'full':
  - Moodle:     http://localhost:8080  (admin/adminpass123)
  - + URLs de 'up'
EOF
}

# ----- Router -----
case "${1:-help}" in
    up)         cmd_up ;;
    full)       cmd_full ;;
    tools)      cmd_tools ;;
    reload)     cmd_reload ;;
    down)       cmd_down ;;
    destroy)    cmd_destroy ;;
    status|ps)  cmd_status ;;
    logs)       cmd_logs "${2:-}" ;;
    shell:pg|psql)  cmd_shell_postgres ;;
    shell:api)  cmd_shell_api ;;
    help|-h|--help) cmd_help ;;
    *)
        err "Comando desconocido: $1"
        cmd_help
        exit 1
        ;;
esac
