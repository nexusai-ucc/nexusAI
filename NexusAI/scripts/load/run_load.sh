#!/usr/bin/env bash
# Pruebas de carga de NexusAI con un comando (TPC-09, #581).
#
#   ./scripts/load/run_load.sh <smoke|sostenido|stress|rate_limit|dedup|todos>
#
# Levanta un backend efímero (misma imagen que producción, Postgres+pgvector y
# Redis reales, LLM simulado por mock_llm.py), corre k6 con el escenario,
# guarda el reporte y baja todo (incluidos los volúmenes). Requiere Docker y k6.
#
# Variables opcionales:
#   MOCK_LLM_LATENCY_MS  latencia media simulada del LLM (default 1500)
#   OUT_DIR              dónde dejar el reporte (default ./load-report)
#   KEEP_STACK=1         no bajar el stack al terminar (para inspeccionar)
#
# Sale con el código de k6: distinto de 0 si algún umbral no se cumplió.

set -euo pipefail

SCENARIO="${1:-smoke}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOAD_DIR="$ROOT/scripts/load"
OUT_DIR="$(mkdir -p "${OUT_DIR:-load-report}" && cd "${OUT_DIR:-load-report}" && pwd)"
API_URL="http://localhost:${API_PORT:-8001}"
COMPOSE=(docker compose --env-file "$LOAD_DIR/load.env" -p nexusai-load
         -f "$ROOT/docker-compose.yml" -f "$LOAD_DIR/docker-compose.load.yml")

case "$SCENARIO" in
    todos) SCENARIOS=(smoke rate_limit dedup sostenido stress) ;;
    smoke|sostenido|stress|rate_limit|dedup) SCENARIOS=("$SCENARIO") ;;
    *) echo "escenario desconocido: $SCENARIO" >&2; exit 2 ;;
esac

command -v k6 >/dev/null || { echo "falta k6 (https://grafana.com/docs/k6/latest/set-up/install-k6/)" >&2; exit 2; }

# shellcheck disable=SC2329  # se invoca desde el trap EXIT
cleanup() {
    "${COMPOSE[@]}" logs --no-color api mock-llm > "$OUT_DIR/stack.log" 2>&1 || true
    "${COMPOSE[@]}" exec -T postgres psql -U nexusai -d nexusai -tAc \
        "select count(*) as conexiones, state from pg_stat_activity where datname='nexusai' group by state" \
        > "$OUT_DIR/postgres-conexiones.txt" 2>&1 || true
    if [[ "${KEEP_STACK:-0}" != "1" ]]; then
        "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

echo "==> levantando el backend efímero (LLM simulado: ${MOCK_LLM_LATENCY_MS:-1500} ms)"
cd "$ROOT"
"${COMPOSE[@]}" up -d --build postgres redis mock-llm api

echo "==> esperando $API_URL/health"
for _ in $(seq 1 90); do
    curl -sf "$API_URL/health" >/dev/null && break
    sleep 2
done
curl -sf "$API_URL/health" || { echo "la API no levantó" >&2; exit 1; }
echo

status=0
for s in "${SCENARIOS[@]}"; do
    echo "==> k6: $s"
    rc=0
    BASE_URL="$API_URL" SUMMARY_DIR="$OUT_DIR" k6 run --quiet -e SCENARIO="$s" \
        --out "json=$OUT_DIR/raw-$s.json.gz" "$LOAD_DIR/nexus_load.js" || rc=$?
    echo "    k6 salió con $rc"
    if [[ "$s" == "stress" || "$s" == "sostenido" ]]; then
        window=$([[ "$s" == "stress" ]] && echo 30 || echo 60)
        python3 "$LOAD_DIR/analyze_k6.py" "$OUT_DIR/raw-$s.json.gz" --window "$window" \
            > "$OUT_DIR/analisis-$s.md" || true
        cat "$OUT_DIR/analisis-$s.md"
    fi
    [[ $rc -eq 0 ]] || status=$rc
done

echo "==> reporte en $OUT_DIR"
exit "$status"
