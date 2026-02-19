#!/usr/bin/env bash
# investigate.sh — Quick summary of the current Turbo Engine platform state.
#
# Designed to be called from a Claude Code session to get rapid feedback on:
#   - Which services are up/down
#   - Recent errors in logs
#   - Trace summaries from Jaeger
#   - Any failing health checks
#
# Usage:
#   ./hack/claude/investigate.sh
#
# Output: Structured text to stdout (optimized for LLM consumption).
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.yml"

GATEWAY_PORT="${GATEWAY_PORT:-8080}"
REGISTRY_PORT="${REGISTRY_PORT:-8081}"
BUILDER_PORT="${BUILDER_PORT:-8082}"
ENVMANAGER_PORT="${ENVMANAGER_PORT:-8083}"
OPERATOR_PORT="${OPERATOR_PORT:-8084}"
CONSOLE_PORT="${CONSOLE_PORT:-3000}"
JAEGER_URL="${JAEGER_URL:-http://localhost:16686}"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

section() { printf "\n${BOLD}${CYAN}=== %s ===${RESET}\n\n" "$*"; }
info()    { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()      { printf "${GREEN}  [OK]${RESET}    %-14s %s\n" "$1" "$2"; }
down()    { printf "${RED}  [DOWN]${RESET}  %-14s %s\n" "$1" "$2"; }

# ---------------------------------------------------------------------------
# Section 1: Service Health
# ---------------------------------------------------------------------------
section "SERVICE HEALTH"

declare -A ENDPOINTS=(
  [gateway]="http://localhost:${GATEWAY_PORT}/healthz"
  [registry]="http://localhost:${REGISTRY_PORT}/healthz"
  [builder]="http://localhost:${BUILDER_PORT}/healthz"
  [envmanager]="http://localhost:${ENVMANAGER_PORT}/healthz"
  [operator]="http://localhost:${OPERATOR_PORT}/healthz"
  [console]="http://localhost:${CONSOLE_PORT}/"
)

HEALTHY_COUNT=0
TOTAL_COUNT=${#ENDPOINTS[@]}

for svc in gateway registry builder envmanager operator console; do
  url="${ENDPOINTS[$svc]}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    ok "$svc" "(HTTP 200 at $url)"
    HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
  else
    down "$svc" "(HTTP ${code} at $url)"
  fi
done

echo ""
if (( HEALTHY_COUNT == TOTAL_COUNT )); then
  printf "${GREEN}All %d services healthy.${RESET}\n" "$TOTAL_COUNT"
else
  printf "${YELLOW}%d/%d services healthy. %d service(s) down.${RESET}\n" \
    "$HEALTHY_COUNT" "$TOTAL_COUNT" "$((TOTAL_COUNT - HEALTHY_COUNT))"
fi

# ---------------------------------------------------------------------------
# Section 2: Docker Container Status
# ---------------------------------------------------------------------------
section "CONTAINER STATUS"

if [[ -f "$COMPOSE_FILE" ]]; then
  docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
    || echo "(docker compose not available or not running)"
else
  echo "(docker-compose.yml not found at $COMPOSE_FILE)"
fi

# ---------------------------------------------------------------------------
# Section 3: Recent Errors
# ---------------------------------------------------------------------------
section "RECENT ERRORS (last 100 lines per service)"

SERVICES=(registry builder envmanager operator gateway)
ERRORS_FOUND=false

if [[ -f "$COMPOSE_FILE" ]]; then
  for svc in "${SERVICES[@]}"; do
    errors=$(docker compose -f "$COMPOSE_FILE" logs --tail=100 --no-color "$svc" 2>/dev/null \
      | grep -iE '(error|panic|fatal|exception)' \
      | tail -5 || true)

    if [[ -n "$errors" ]]; then
      ERRORS_FOUND=true
      printf "${RED}[%s]${RESET}\n" "$svc"
      echo "$errors"
      echo ""
    fi
  done

  if ! $ERRORS_FOUND; then
    printf "${GREEN}No errors found in recent logs.${RESET}\n"
  fi
else
  echo "(Cannot check logs — docker-compose.yml not found)"
fi

# ---------------------------------------------------------------------------
# Section 4: Trace Summary (from Jaeger)
# ---------------------------------------------------------------------------
section "TRACE SUMMARY (last 2 minutes)"

# Check if Jaeger is reachable.
jaeger_status=$(curl -s -o /dev/null -w '%{http_code}' "${JAEGER_URL}/" 2>/dev/null || echo "000")

if [[ "$jaeger_status" == "200" ]]; then
  NOW_US=$(( $(date +%s) * 1000000 ))
  START_US=$(( NOW_US - (2 * 60 * 1000000) ))

  for svc in "${SERVICES[@]}"; do
    trace_data=$(curl -s "${JAEGER_URL}/api/traces?service=${svc}&start=${START_US}&end=${NOW_US}&limit=10&lookback=custom" 2>/dev/null || echo '{"data":[]}')
    trace_count=$(echo "$trace_data" | grep -o '"traceID"' | wc -l 2>/dev/null || echo "0")
    printf "  %-14s %s traces\n" "$svc" "$trace_count"
  done
else
  echo "Jaeger not reachable at ${JAEGER_URL} (HTTP ${jaeger_status})"
fi

# ---------------------------------------------------------------------------
# Section 5: Quick Recommendations
# ---------------------------------------------------------------------------
section "RECOMMENDATIONS"

if (( HEALTHY_COUNT == TOTAL_COUNT )); then
  echo "All services are healthy. You can run smoke tests:"
  echo "  ./hack/scripts/run-smoke-tests.sh"
elif (( HEALTHY_COUNT == 0 )); then
  echo "No services are running. Start the platform:"
  echo "  docker compose -f infra/docker/docker-compose.yml up -d --build"
  echo ""
  echo "Then wait for health:"
  echo "  ./hack/scripts/wait-for-healthy.sh"
else
  echo "Some services are down. Check logs for failing services:"
  echo "  docker compose -f infra/docker/docker-compose.yml logs <service-name>"
  echo ""
  echo "Or restart everything:"
  echo "  docker compose -f infra/docker/docker-compose.yml down"
  echo "  docker compose -f infra/docker/docker-compose.yml up -d --build"
fi

echo ""
