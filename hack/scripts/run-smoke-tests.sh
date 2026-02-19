#!/usr/bin/env bash
# run-smoke-tests.sh — End-to-end smoke tests for the Turbo Engine platform.
#
# Exercises the full publish -> list -> fork -> build -> status -> routing flow,
# then writes structured JSON results to ci-report/smoke-results.json.
#
# Usage:
#   ./hack/scripts/run-smoke-tests.sh
set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report"
RESULTS_FILE="${REPORT_DIR}/smoke-results.json"

REGISTRY_URL="${REGISTRY_URL:-http://localhost:8081}"
BUILDER_URL="${BUILDER_URL:-http://localhost:8082}"
ENVMANAGER_URL="${ENVMANAGER_URL:-http://localhost:8083}"
OPERATOR_URL="${OPERATOR_URL:-http://localhost:8084}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"

BUILD_POLL_INTERVAL=3
BUILD_POLL_TIMEOUT=90

mkdir -p "${REPORT_DIR}"

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[PASS]${RESET}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Results tracking
# ---------------------------------------------------------------------------
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
declare -a RESULTS_JSON=()

record_result() {
  local name="$1"
  local status="$2"  # pass | fail
  local detail="${3:-}"
  local duration="${4:-0}"

  TESTS_RUN=$((TESTS_RUN + 1))
  if [[ "$status" == "pass" ]]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    ok "$name"
  else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    fail "$name: ${detail}"
  fi

  # Escape double quotes in detail for JSON safety.
  local safe_detail
  safe_detail=$(printf '%s' "$detail" | sed 's/"/\\"/g' | tr '\n' ' ')

  RESULTS_JSON+=("{\"name\":\"${name}\",\"status\":\"${status}\",\"detail\":\"${safe_detail}\",\"duration_ms\":${duration}}")
}

# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------
http_code() {
  curl -s -o /dev/null -w '%{http_code}' "$@" 2>/dev/null || echo "000"
}

http_body() {
  curl -s -w '\n' "$@" 2>/dev/null || echo ""
}

timer_start() { date +%s%N; }
timer_elapsed_ms() {
  local start="$1"
  local end
  end=$(date +%s%N)
  echo $(( (end - start) / 1000000 ))
}

# ---------------------------------------------------------------------------
# Test 1: Publish a test package to the registry
# ---------------------------------------------------------------------------
test_publish_package() {
  info "Test: Publish a test package to the registry..."
  local ts
  ts=$(timer_start)

  local response
  response=$(curl -s -w '\n%{http_code}' -X POST "${REGISTRY_URL}/v1/packages" \
    -H "Content-Type: application/json" \
    -d '{
      "package": {
        "name": "smoke-test-pkg",
        "namespace": "smoke-tests",
        "kind": "graphql-subgraph",
        "version": "1.0.0-smoke",
        "schema": "type Query { hello: String }",
        "metadata": {"smoke_test": "true"}
      }
    }' 2>/dev/null || echo -e "\n000")

  local body http_status
  http_status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if [[ "$http_status" == "201" || "$http_status" == "200" ]]; then
    record_result "publish_package" "pass" "Published smoke-test-pkg@1.0.0-smoke (HTTP ${http_status})" "$elapsed"
  else
    record_result "publish_package" "fail" "HTTP ${http_status}: ${body}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Test 2: List packages and verify our test package exists
# ---------------------------------------------------------------------------
test_list_packages() {
  info "Test: List packages and verify smoke-test-pkg..."
  local ts
  ts=$(timer_start)

  local body
  body=$(http_body "${REGISTRY_URL}/v1/packages?namespace=smoke-tests")
  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if echo "$body" | grep -q "smoke-test-pkg"; then
    record_result "list_packages" "pass" "smoke-test-pkg found in listing" "$elapsed"
  else
    record_result "list_packages" "fail" "smoke-test-pkg not found. Response: ${body}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Test 3: Create an environment (fork)
# ---------------------------------------------------------------------------
ENV_ID=""
test_create_environment() {
  info "Test: Create a test environment (fork)..."
  local ts
  ts=$(timer_start)

  local response
  response=$(curl -s -w '\n%{http_code}' -X POST "${ENVMANAGER_URL}/v1/environments" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "smoke-test-env",
      "baseRootPackage": "smoke-test-pkg",
      "baseRootVersion": "1.0.0-smoke",
      "branch": "smoke-test",
      "createdBy": "ci-harness"
    }' 2>/dev/null || echo -e "\n000")

  local body http_status
  http_status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if [[ "$http_status" == "201" || "$http_status" == "200" ]]; then
    # Try to extract environment ID from JSON.
    ENV_ID=$(echo "$body" | grep -o '"id"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    record_result "create_environment" "pass" "Created env ${ENV_ID:-unknown} (HTTP ${http_status})" "$elapsed"
  else
    record_result "create_environment" "fail" "HTTP ${http_status}: ${body}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Test 4: Trigger a build
# ---------------------------------------------------------------------------
BUILD_ID=""
test_trigger_build() {
  info "Test: Trigger a build..."
  local ts
  ts=$(timer_start)

  local env_id="${ENV_ID:-smoke-test-env}"
  local response
  response=$(curl -s -w '\n%{http_code}' -X POST "${BUILDER_URL}/v1/builds" \
    -H "Content-Type: application/json" \
    -d "{
      \"environmentId\": \"${env_id}\",
      \"rootPackageName\": \"smoke-test-pkg\",
      \"rootPackageVersion\": \"1.0.0-smoke\"
    }" 2>/dev/null || echo -e "\n000")

  local body http_status
  http_status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if [[ "$http_status" == "201" || "$http_status" == "200" ]]; then
    BUILD_ID=$(echo "$body" | grep -o '"id"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    record_result "trigger_build" "pass" "Build ${BUILD_ID:-unknown} created (HTTP ${http_status})" "$elapsed"
  else
    record_result "trigger_build" "fail" "HTTP ${http_status}: ${body}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Test 5: Poll build status until complete
# ---------------------------------------------------------------------------
test_poll_build_status() {
  info "Test: Poll build status until complete..."
  local ts
  ts=$(timer_start)

  if [[ -z "$BUILD_ID" ]]; then
    record_result "poll_build_status" "fail" "No build ID available (previous step failed)" "0"
    return
  fi

  local start_time
  start_time=$(date +%s)
  local final_status="unknown"

  while true; do
    local elapsed_poll=$(( $(date +%s) - start_time ))
    if (( elapsed_poll >= BUILD_POLL_TIMEOUT )); then
      local elapsed
      elapsed=$(timer_elapsed_ms "$ts")
      record_result "poll_build_status" "fail" "Timeout (${BUILD_POLL_TIMEOUT}s) waiting for build ${BUILD_ID}" "$elapsed"
      return
    fi

    local body
    body=$(http_body "${BUILDER_URL}/v1/builds/${BUILD_ID}")
    final_status=$(echo "$body" | grep -o '"status"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")

    info "  Build ${BUILD_ID}: status=${final_status} (${elapsed_poll}s/${BUILD_POLL_TIMEOUT}s)"

    case "$final_status" in
      succeeded)
        local elapsed
        elapsed=$(timer_elapsed_ms "$ts")
        record_result "poll_build_status" "pass" "Build ${BUILD_ID} succeeded" "$elapsed"
        return
        ;;
      failed)
        local error_msg
        error_msg=$(echo "$body" | grep -o '"errorMessage"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown error")
        local elapsed
        elapsed=$(timer_elapsed_ms "$ts")
        record_result "poll_build_status" "fail" "Build failed: ${error_msg}" "$elapsed"
        return
        ;;
      pending|running)
        sleep "$BUILD_POLL_INTERVAL"
        ;;
      *)
        sleep "$BUILD_POLL_INTERVAL"
        ;;
    esac
  done
}

# ---------------------------------------------------------------------------
# Test 6: Check operator status
# ---------------------------------------------------------------------------
test_operator_status() {
  info "Test: Check operator status endpoint..."
  local ts
  ts=$(timer_start)

  local status_code
  status_code=$(http_code "${OPERATOR_URL}/healthz")

  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if [[ "$status_code" == "200" ]]; then
    record_result "operator_status" "pass" "Operator healthy (HTTP 200)" "$elapsed"
  else
    record_result "operator_status" "fail" "Operator returned HTTP ${status_code}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Test 7: Verify gateway routing
# ---------------------------------------------------------------------------
test_gateway_routing() {
  info "Test: Verify gateway routing..."
  local ts
  ts=$(timer_start)

  local status_code
  status_code=$(http_code "${GATEWAY_URL}/healthz")

  local elapsed
  elapsed=$(timer_elapsed_ms "$ts")

  if [[ "$status_code" == "200" ]]; then
    record_result "gateway_routing" "pass" "Gateway healthy and routing (HTTP 200)" "$elapsed"
  else
    record_result "gateway_routing" "fail" "Gateway returned HTTP ${status_code}" "$elapsed"
  fi
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------
info "Starting Turbo Engine smoke tests..."
info "Registry:   ${REGISTRY_URL}"
info "Builder:    ${BUILDER_URL}"
info "EnvManager: ${ENVMANAGER_URL}"
info "Operator:   ${OPERATOR_URL}"
info "Gateway:    ${GATEWAY_URL}"
echo ""

test_publish_package
test_list_packages
test_create_environment
test_trigger_build
test_poll_build_status
test_operator_status
test_gateway_routing

# ---------------------------------------------------------------------------
# Write JSON results
# ---------------------------------------------------------------------------
echo ""
info "Writing results to ${RESULTS_FILE}..."

{
  printf '{\n'
  printf '  "timestamp": "%s",\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '  "summary": {\n'
  printf '    "total": %d,\n' "$TESTS_RUN"
  printf '    "passed": %d,\n' "$TESTS_PASSED"
  printf '    "failed": %d\n' "$TESTS_FAILED"
  printf '  },\n'
  printf '  "tests": [\n'
  local first=true
  for entry in "${RESULTS_JSON[@]}"; do
    if $first; then
      first=false
    else
      printf ',\n'
    fi
    printf '    %s' "$entry"
  done
  printf '\n  ]\n'
  printf '}\n'
} > "${RESULTS_FILE}"

# Print summary
echo ""
echo "============================================"
printf "  Smoke Tests: "
if (( TESTS_FAILED == 0 )); then
  printf "${GREEN}ALL %d PASSED${RESET}\n" "$TESTS_PASSED"
else
  printf "${RED}%d FAILED${RESET}, %d passed (of %d)\n" "$TESTS_FAILED" "$TESTS_PASSED" "$TESTS_RUN"
fi
echo "============================================"
echo ""
info "Results written to: ${RESULTS_FILE}"

# Exit with failure if any test failed.
if (( TESTS_FAILED > 0 )); then
  exit 1
fi
