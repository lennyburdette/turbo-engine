#!/usr/bin/env bash
# capture-traces.sh — Queries the Jaeger API to export all traces from the
# last 5 minutes as JSON.  Writes to ci-report/traces.json.
#
# Usage:
#   ./hack/scripts/capture-traces.sh
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report"
TRACES_FILE="${REPORT_DIR}/traces.json"

JAEGER_URL="${JAEGER_URL:-http://localhost:16686}"
LOOKBACK_MINUTES="${LOOKBACK_MINUTES:-5}"

mkdir -p "${REPORT_DIR}"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Compute time range (last N minutes in microseconds since epoch)
# ---------------------------------------------------------------------------
NOW_US=$(( $(date +%s) * 1000000 ))
START_US=$(( NOW_US - (LOOKBACK_MINUTES * 60 * 1000000) ))

# ---------------------------------------------------------------------------
# Services to query traces for
# ---------------------------------------------------------------------------
SERVICES=("registry" "builder" "envmanager" "operator" "gateway")

info "Capturing traces from the last ${LOOKBACK_MINUTES} minutes..."
info "Jaeger API: ${JAEGER_URL}"
echo ""

# Start the combined JSON output.
{
  printf '{\n'
  printf '  "captured_at": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '  "lookback_minutes": %d,\n' "$LOOKBACK_MINUTES"
  printf '  "services": {\n'

  first_service=true
  for svc in "${SERVICES[@]}"; do
    if $first_service; then
      first_service=false
    else
      printf ',\n'
    fi

    info "  Querying traces for service: ${svc}..."

    # Query Jaeger HTTP API for traces.
    local_traces=$(curl -s \
      "${JAEGER_URL}/api/traces?service=${svc}&start=${START_US}&end=${NOW_US}&limit=50&lookback=custom" \
      2>/dev/null || echo '{"data":[],"errors":[]}')

    # Extract trace count for logging.
    trace_count=$(echo "$local_traces" | grep -o '"traceID"' | wc -l || echo "0")
    info "    Found ${trace_count} traces for ${svc}"

    printf '    "%s": %s' "$svc" "$local_traces"
  done

  printf '\n  }\n'
  printf '}\n'
} > "${TRACES_FILE}"

echo ""
ok "Traces written to: ${TRACES_FILE}"

# Print a summary.
TOTAL_SIZE=$(wc -c < "${TRACES_FILE}" 2>/dev/null || echo "0")
info "Total file size: ${TOTAL_SIZE} bytes"
