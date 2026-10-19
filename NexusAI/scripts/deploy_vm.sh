#!/usr/bin/env bash
# Deploy del backend en una VM de Oracle (TPC-08, #580).
#
# Es el ÚNICO comando que puede ejecutar la clave SSH del pipeline: se instala
# como forced command en ~/.ssh/authorized_keys de la VM, con el ambiente fijo:
#
#   command="~/nexusAI/NexusAI/scripts/deploy_vm.sh staging",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA... github-actions-staging
#
# Así, aunque la clave se filtre, solo sirve para desplegar la rama del
# ambiente: no da shell, ni túneles, ni deja elegir otra rama (el comando que
# mande el cliente, en $SSH_ORIGINAL_COMMAND, se ignora).
#
# Hace lo mismo que el deploy manual de docs/DEPLOY_ORACLE.md §3:
#   1. verifica que la VM esté parada en la rama del ambiente;
#   2. trae el código con fast-forward (nunca reset --hard: si la VM tiene
#      cambios o commits propios, falla y lo resuelve una persona);
#   3. reconstruye y levanta el stack con docker compose;
#   4. espera a que el container de la API esté healthy;
#   5. imprime DEPLOYED_SHA=<commit> para que el pipeline verifique que se
#      desplegó exactamente lo que se pusheó.
#
# Todo vive dentro de main() y se llama en la última línea: bash termina de
# leer el archivo antes de ejecutar, así que el `git merge` del paso 2 (que
# puede reescribir este mismo script) no cambia el código a mitad de camino.

set -euo pipefail

PROJECT_DIR="${NEXUSAI_PROJECT_DIR:-$HOME/nexusAI/NexusAI}"
HEALTH_TIMEOUT_S="${NEXUSAI_HEALTH_TIMEOUT_S:-300}"
API_CONTAINER="nexusai-api"
LOCK_FILE="/tmp/nexusai-deploy.lock"

log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

branch_for() {
    case "$1" in
        staging) echo "staging" ;;
        production) echo "main" ;;
        *) die "ambiente desconocido: '$1' (staging | production)" ;;
    esac
}

wait_healthy() {
    local waited=0 status
    while (( waited < HEALTH_TIMEOUT_S )); do
        status="$(sudo docker inspect -f '{{.State.Health.Status}}' "$API_CONTAINER" 2>/dev/null || echo missing)"
        if [[ "$status" == "healthy" ]]; then
            log "$API_CONTAINER healthy (${waited} s)"
            return 0
        fi
        sleep 5
        waited=$((waited + 5))
    done
    sudo docker ps --format '{{.Names}}\t{{.Status}}' || true
    sudo docker logs --tail 40 "$API_CONTAINER" 2>&1 || true
    die "$API_CONTAINER no quedó healthy en ${HEALTH_TIMEOUT_S} s (último estado: ${status})"
}

main() {
    local env="${1:-}"
    [[ -n "$env" ]] || die "uso: deploy_vm.sh <staging|production>"
    local branch
    branch="$(branch_for "$env")"

    # Un deploy a la vez (el del pipeline y uno manual no se pisan).
    exec 9>"$LOCK_FILE"
    flock -n 9 || die "ya hay un deploy en curso en esta VM"

    cd "$PROJECT_DIR"

    local current
    current="$(git branch --show-current)"
    [[ "$current" == "$branch" ]] \
        || die "la VM está en la rama '$current' y el ambiente $env sigue '$branch' (ver DEPLOY_ORACLE.md §3)"

    local before
    before="$(git rev-parse --short HEAD)"
    log "ambiente=$env rama=$branch commit actual=$before"

    git fetch --quiet origin "$branch"
    git merge --ff-only --quiet "origin/$branch" \
        || die "no se puede avanzar con fast-forward: la VM tiene commits o cambios propios"
    log "código: $before -> $(git rev-parse --short HEAD)"

    sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    wait_healthy
    sudo docker ps --format '{{.Names}}\t{{.Status}}'

    echo "DEPLOYED_SHA=$(git rev-parse HEAD)"
}

main "$@"
exit
