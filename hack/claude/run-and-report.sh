#!/usr/bin/env bash
# run-and-report.sh — The "one command" a Claude Code agent runs to get full
# feedback on the Turbo Engine platform.
#
# This script:
#   1. Starts the full platform via Docker Compose
#   2. Waits for all services to become healthy
#   3. Runs smoke tests
#   4. Captures distributed traces from Jaeger
#   5. Captures console UI screenshots
#   6. Generates a comprehensive CI report (REPORT.md)
#
# The final output is ci-report/REPORT.md — the single file to read.
#
# Usage:
#   ./hack/claude/run-and-report.sh [--skip-build] [--timeout SECONDS]
#
# Options:
#   --skip-build   Skip rebuilding Docker images (use existing)
#   --timeout N    Override the health-check timeout (default: 120)
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker/docker-compose.yml"
REPORT_DIR="${ROOT_DIR}/ci-report"

SKIP_BUILD=false
HEALTH_TIMEOUT=120

# Parse arguments.
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --timeout)
      HEALTH_TIMEOUT="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

banner()  { printf "\n${BOLD}${CYAN}%s${RESET}\n\n" "$*"; }
info()    { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()      { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
warn()    { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
fail()    { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Ensure clean report directory
# ---------------------------------------------------------------------------
mkdir -p "${REPORT_DIR}"

# ---------------------------------------------------------------------------
# Step tracking
# ---------------------------------------------------------------------------
STEP=0
TOTAL_STEPS=6
step() {
  STEP=$((STEP + 1))
  banner "[${STEP}/${TOTAL_STEPS}] $*"
}

EXIT_CODE=0

# ---------------------------------------------------------------------------
# Step 1: Start the platform
# ---------------------------------------------------------------------------
step "Starting the platform"

if $SKIP_BUILD; then
  info "Skipping image rebuild (--skip-build)"
  docker compose -f "$COMPOSE_FILE" up -d 2>&1 || {
    fail "Failed to start Docker Compose"
    EXIT_CODE=1
  }
else
  info "Building and starting all services..."
  docker compose -f "$COMPOSE_FILE" up -d --build 2>&1 || {
    fail "Failed to build/start Docker Compose"
    EXIT_CODE=1
  }
fi

ok "Docker Compose started"

# ---------------------------------------------------------------------------
# Step 2: Wait for healthy
# ---------------------------------------------------------------------------
step "Waiting for services to become healthy"

export HEALTH_TIMEOUT
if "${ROOT_DIR}/hack/scripts/wait-for-healthy.sh" "$HEALTH_TIMEOUT"; then
  ok "All services healthy"
else
  warn "Some services did not become healthy within ${HEALTH_TIMEOUT}s"
  warn "Continuing with remaining steps..."
  EXIT_CODE=1
fi

# ---------------------------------------------------------------------------
# Step 3: Run smoke tests
# ---------------------------------------------------------------------------
step "Running smoke tests"

if "${ROOT_DIR}/hack/scripts/run-smoke-tests.sh"; then
  ok "Smoke tests passed"
else
  warn "Some smoke tests failed"
  EXIT_CODE=1
fi

# ---------------------------------------------------------------------------
# Step 4: Capture traces
# ---------------------------------------------------------------------------
step "Capturing distributed traces"

if "${ROOT_DIR}/hack/scripts/capture-traces.sh"; then
  ok "Traces captured"
else
  warn "Failed to capture traces (Jaeger may not be available)"
fi

# ---------------------------------------------------------------------------
# Step 5: Capture screenshots
# ---------------------------------------------------------------------------
step "Capturing console screenshots"

if "${ROOT_DIR}/hack/scripts/capture-screenshots.sh"; then
  ok "Screenshots captured"
else
  warn "Failed to capture screenshots"
fi

# ---------------------------------------------------------------------------
# Step 6: Generate CI report
# ---------------------------------------------------------------------------
step "Generating CI report"

if "${ROOT_DIR}/hack/scripts/dump-ci-report.sh"; then
  ok "CI report generated"
else
  warn "Failed to generate CI report"
  EXIT_CODE=1
fi

# ---------------------------------------------------------------------------
# Final Summary
# ---------------------------------------------------------------------------
banner "COMPLETE"

echo "Report artifacts:"
echo ""
printf "  %-30s %s\n" "CI Report:" "ci-report/REPORT.md"
printf "  %-30s %s\n" "Smoke Test Results:" "ci-report/smoke-results.json"
printf "  %-30s %s\n" "Traces:" "ci-report/traces.json"
printf "  %-30s %s\n" "Screenshots:" "ci-report/screenshots/"
echo ""

if [[ -f "${REPORT_DIR}/REPORT.md" ]]; then
  info "Read the report:"
  echo "  cat ci-report/REPORT.md"
  echo ""
fi

if (( EXIT_CODE == 0 )); then
  ok "All steps completed successfully."
else
  warn "Completed with some failures. Check ci-report/REPORT.md for details."
fi

exit $EXIT_CODE
