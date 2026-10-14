#!/bin/bash
# test-all.sh — correr todas las suites de NexusAI con cobertura (TPC-01, #573)
#
# USO:
#   ./scripts/test-all.sh            # backend + frontend (+ plugin si hay moodle-docker)
#   ./scripts/test-all.sh backend    # solo una suite: backend | frontend | plugin
#
# REQUISITOS:
#   backend  — Postgres y Redis arriba (./scripts/nexus.sh backend) y las deps
#              de services/api instaladas (usa services/api/.venv si existe).
#   frontend — node_modules en plugin/local/nexusai/react (npm ci).
#   plugin   — MOODLE_DOCKER_DIR exportada, como para nexus.sh, con PHPUnit
#              inicializado en moodle-docker. Sin eso se salta: la cobertura
#              del plugin se mide en CI (moodle-ci.yml).
#
# Sale con código ≠ 0 si alguna suite falla.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

MOODLE_DOCKER_DIR="${MOODLE_DOCKER_DIR:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}=>${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC}  $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*" >&2; }

declare -a SUMMARY=()
FAILED=0

record() {  # record <suite> <ok|fail|skip> [detalle]
    SUMMARY+=("$1|$2|${3:-}")
    [[ "$2" == "fail" ]] && FAILED=1
    return 0
}

run_backend() {
    log "Backend (pytest + cobertura de sentencia y decisión)"
    local py="python3"
    [[ -x services/api/.venv/bin/python ]] && py="$REPO_ROOT/services/api/.venv/bin/python"
    if (cd services/api && "$py" -m pytest --cov=app --cov-branch --cov-report=term --cov-report=xml); then
        record backend ok "services/api/coverage.xml"
    else
        record backend fail
    fi
}

run_frontend() {
    log "Frontend (Vitest + cobertura v8)"
    local dir=plugin/local/nexusai/react
    if [[ ! -d "$dir/node_modules" ]]; then
        err "Falta $dir/node_modules — corré: (cd $dir && npm ci)"
        record frontend fail "sin node_modules"
        return 0
    fi
    if (cd "$dir" && npm run --silent test:coverage); then
        record frontend ok "$dir/coverage/"
    else
        record frontend fail
    fi
}

run_plugin() {
    log "Plugin (PHPUnit en moodle-docker)"
    if [[ -z "$MOODLE_DOCKER_DIR" ]]; then
        warn "MOODLE_DOCKER_DIR no está seteada — se salta (la cobertura del plugin se mide en CI)"
        record plugin skip "sin moodle-docker"
        return 0
    fi
    if "$MOODLE_DOCKER_DIR/bin/moodle-docker-compose" exec -T webserver \
        vendor/bin/phpunit --testsuite local_nexusai_testsuite; then
        record plugin ok
    else
        record plugin fail
    fi
}

SUITES=("${@:-backend frontend plugin}")
# shellcheck disable=SC2068
for suite in ${SUITES[@]}; do
    case "$suite" in
        backend)  run_backend ;;
        frontend) run_frontend ;;
        plugin)   run_plugin ;;
        *) err "Suite desconocida: $suite (backend | frontend | plugin)"; exit 2 ;;
    esac
done

echo
echo -e "${BOLD}Resumen${NC}"
for line in "${SUMMARY[@]}"; do
    IFS='|' read -r suite status detail <<< "$line"
    case "$status" in
        ok)   ok   "$suite ${detail:+— $detail}" ;;
        skip) warn "$suite saltado ${detail:+— $detail}" ;;
        fail) err  "$suite FALLÓ" ;;
    esac
done

exit "$FAILED"
