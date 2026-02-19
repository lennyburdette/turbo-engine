#!/usr/bin/env bash
# wait-for-healthy.sh — Polls each service's /healthz endpoint until all return
# 200, or the configurable timeout (default 120s) is exceeded.
#
# Usage:
#   ./hack/scripts/wait-for-healthy.sh [TIMEOUT_SECONDS]
#
# Environment:
#   GATEWAY_PORT   (default: 8080)
#   REGISTRY_PORT  (default: 8081)
#   BUILDER_PORT   (default: 8082)
#   ENVMANAGER_PORT (default: 8083)
#   OPERATOR_PORT  (default: 8084)
#   CONSOLE_PORT   (default: 3000)
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
TIMEOUT="${1:-${HEALTH_TIMEOUT:-120}}"
POLL_INTERVAL=3

GATEWAY_PORT="${GATEWAY_PORT:-8080}"
REGISTRY_PORT="${REGISTRY_PORT:-8081}"
BUILDER_PORT="${BUILDER_PORT:-8082}"
ENVMANAGER_PORT="${ENVMANAGER_PORT:-8083}"
OPERATOR_PORT="${OPERATOR_PORT:-8084}"
CONSOLE_PORT="${CONSOLE_PORT:-3000}"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Service list: name=host:port
# ---------------------------------------------------------------------------
declare -A SERVICES=(
  [gateway]="localhost:${GATEWAY_PORT}"
  [registry]="localhost:${REGISTRY_PORT}"
  [builder]="localhost:${BUILDER_PORT}"
  [envmanager]="localhost:${ENVMANAGER_PORT}"
  [operator]="localhost:${OPERATOR_PORT}"
  [console]="localhost:${CONSOLE_PORT}"
)

# Track which services have come up.
declare -A HEALTHY

check_service() {
  local name="$1"
  local addr="$2"
  local endpoint="/healthz"

  # Console doesn't necessarily have /healthz — fall back to /
  if [[ "$name" == "console" ]]; then
    endpoint="/"
  fi

  local status
  status=$(curl -s -o /dev/null -w '%{http_code}' "http://${addr}${endpoint}" 2>/dev/null || echo "000")

  if [[ "$status" == "200" ]]; then
    return 0
  fi
  return 1
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
info "Waiting for services to become healthy (timeout: ${TIMEOUT}s)..."

START_TIME=$(date +%s)
ALL_HEALTHY=false

while true; do
  ELAPSED=$(( $(date +%s) - START_TIME ))

  if (( ELAPSED >= TIMEOUT )); then
    fail "Timeout (${TIMEOUT}s) exceeded. The following services never became healthy:"
    for svc in "${!SERVICES[@]}"; do
      if [[ -z "${HEALTHY[$svc]:-}" ]]; then
        fail "  - ${svc} (${SERVICES[$svc]})"
      fi
    done
    exit 1
  fi

  PENDING=0
  for svc in "${!SERVICES[@]}"; do
    # Skip already healthy services.
    if [[ -n "${HEALTHY[$svc]:-}" ]]; then
      continue
    fi

    if check_service "$svc" "${SERVICES[$svc]}"; then
      ok "${svc} is healthy (${SERVICES[$svc]})"
      HEALTHY[$svc]=1
    else
      PENDING=$((PENDING + 1))
    fi
  done

  if (( PENDING == 0 )); then
    ALL_HEALTHY=true
    break
  fi

  HEALTHY_COUNT=$(( ${#SERVICES[@]} - PENDING ))
  info "[${ELAPSED}s/${TIMEOUT}s] ${HEALTHY_COUNT}/${#SERVICES[@]} services healthy, ${PENDING} pending..."
  sleep "$POLL_INTERVAL"
done

if $ALL_HEALTHY; then
  echo ""
  ok "All ${#SERVICES[@]} services are healthy!"
  echo ""
  for svc in "${!SERVICES[@]}"; do
    printf "  %-12s  http://%s\n" "$svc" "${SERVICES[$svc]}"
  done
  echo ""
  exit 0
fi
