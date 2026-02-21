#!/usr/bin/env bash
# k8s-e2e-tests.sh — End-to-end tests for the Turbo Engine platform running
# in a Kubernetes cluster (kind).
#
# The test script:
#   1. Waits for the control plane to be ready
#   2. Sets up port-forwards to control plane services
#   3. Iterates over scenario files in e2e/scenarios/*.json
#   4. For each scenario, calls k8s-run-scenario.py which:
#      - Publishes packages
#      - Creates an environment and triggers a build
#      - Reconciles via the operator (deploys components)
#      - Runs HTTP requests with assertions
#   5. Aggregates results from all scenarios into a single report
#
# Prerequisites:
#   - kubectl configured to talk to the kind cluster
#   - Control plane deployed via: kubectl apply -k infra/k8s/overlays/ci
#   - Deployments rolled out successfully
#
# Output: ci-report/k8s-e2e-results.json
#         ci-report/k8s/timeline.txt
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report"
RESULTS_FILE="${REPORT_DIR}/k8s-e2e-results.json"
TIMELINE_FILE="${REPORT_DIR}/k8s/timeline.txt"
NAMESPACE="${K8S_NAMESPACE:-turbo-engine-e2e}"
SCENARIOS_DIR="${ROOT_DIR}/e2e/scenarios"

# Ports for port-forwarding
REGISTRY_PORT=18081
BUILDER_PORT=18082
ENVMANAGER_PORT=18083
OPERATOR_PORT=18084
GATEWAY_PORT=18080

# Timeouts
ROLLOUT_TIMEOUT=120

mkdir -p "${REPORT_DIR}/k8s"

# ---------------------------------------------------------------------------
# Helpers (colour, timeline, test tracking)
# ---------------------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[PASS]${RESET}  %s\n" "$*"; }
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }

T_START=$(date +%s)
timeline() {
  local elapsed=$(( $(date +%s) - T_START ))
  printf "%02d:%02d  %s\n" "$(( elapsed / 60 ))" "$(( elapsed % 60 ))" "$*" >> "${TIMELINE_FILE}"
  info "[$(( elapsed / 60 ))m$(( elapsed % 60 ))s] $*"
}
> "${TIMELINE_FILE}"

# Aggregated results across all scenarios.
ALL_TESTS=()
TOTAL_PASS=0
TOTAL_FAIL=0

record_result() {
  local name="$1" status="$2" detail="$3" start_ms="$4"
  local end_ms=$(( $(date +%s%N) / 1000000 ))
  local duration_ms=$(( end_ms - start_ms ))
  ALL_TESTS+=("{\"name\":\"${name}\",\"status\":\"${status}\",\"detail\":\"${detail}\",\"duration_ms\":${duration_ms}}")
  if [[ "$status" == "pass" ]]; then ok "${name}: ${detail}"; TOTAL_PASS=$((TOTAL_PASS + 1))
  else fail "${name}: ${detail}"; TOTAL_FAIL=$((TOTAL_FAIL + 1)); fi
}
current_ms() { echo $(( $(date +%s%N) / 1000000 )); }

# ---------------------------------------------------------------------------
# Cleanup on exit
# ---------------------------------------------------------------------------
PF_PIDS=()
cleanup() {
  info "Cleaning up port-forwards..."
  for pid in "${PF_PIDS[@]}"; do kill "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT

# ===================================================================
# Step 1: Wait for control plane
# ===================================================================
timeline "Waiting for control plane deployments to roll out"
T=$(current_ms)
ROLLOUT_OK=true
for deploy in registry builder envmanager turbo-engine-operator; do
  kubectl -n "$NAMESPACE" rollout status deployment/"$deploy" --timeout="${ROLLOUT_TIMEOUT}s" 2>/dev/null || { ROLLOUT_OK=false; warn "Deployment $deploy did not roll out"; }
done
for deploy in otel-collector jaeger; do
  kubectl -n "$NAMESPACE" rollout status deployment/"$deploy" --timeout=60s 2>/dev/null || warn "Telemetry $deploy not ready (non-blocking)"
done
if $ROLLOUT_OK; then record_result "control-plane-rollout" "pass" "All control plane deployments ready" "$T"; timeline "Control plane ready"
else record_result "control-plane-rollout" "fail" "Some deployments failed" "$T"; timeline "Control plane rollout FAILED"; fi

# ===================================================================
# Step 2: Port-forwards to control plane services
# ===================================================================
timeline "Setting up port-forwards"
start_port_forward() {
  kubectl -n "$NAMESPACE" port-forward "svc/$1" "$2:$3" &>/dev/null &
  PF_PIDS+=($!); sleep 1
}
start_port_forward registry "$REGISTRY_PORT" 8081
start_port_forward builder "$BUILDER_PORT" 8082
start_port_forward envmanager "$ENVMANAGER_PORT" 8083
start_port_forward turbo-engine-operator "$OPERATOR_PORT" 8084
start_port_forward gateway "$GATEWAY_PORT" 8080
sleep 2

T=$(current_ms)
PF_OK=true
for pn in "$REGISTRY_PORT:registry" "$BUILDER_PORT:builder" "$ENVMANAGER_PORT:envmanager" "$OPERATOR_PORT:operator"; do
  port="${pn%%:*}"; name="${pn##*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/healthz" 2>/dev/null || echo "000")
  [[ "$code" != "200" ]] && { PF_OK=false; warn "${name} health HTTP ${code}"; }
done
if $PF_OK; then record_result "port-forward-health" "pass" "All port-forwards healthy" "$T"; timeline "Port-forwards healthy"
else record_result "port-forward-health" "fail" "Some port-forwards unhealthy" "$T"; timeline "Port-forward health FAILED"; fi

# ===================================================================
# Step 3: Run scenarios
# ===================================================================
SCENARIO_FILES=()
if [[ -d "$SCENARIOS_DIR" ]]; then
  for f in "${SCENARIOS_DIR}"/*.json; do
    [[ -f "$f" ]] && SCENARIO_FILES+=("$f")
  done
fi

if [[ ${#SCENARIO_FILES[@]} -eq 0 ]]; then
  warn "No scenario files found in ${SCENARIOS_DIR}/*.json"
  record_result "scenarios" "fail" "No scenario files found" "$(current_ms)"
else
  info "Found ${#SCENARIO_FILES[@]} scenario(s)"
  for scenario_file in "${SCENARIO_FILES[@]}"; do
    scenario_name=$(python3 -c "import json; print(json.load(open('${scenario_file}'))['name'])" 2>/dev/null || basename "$scenario_file" .json)
    timeline "Running scenario: ${scenario_name}"
    T=$(current_ms)

    # Run the scenario and capture its JSON output.
    SCENARIO_OUTPUT=$(python3 "${SCRIPT_DIR}/k8s-run-scenario.py" \
      "$scenario_file" \
      --registry-port "$REGISTRY_PORT" \
      --builder-port "$BUILDER_PORT" \
      --envmanager-port "$ENVMANAGER_PORT" \
      --operator-port "$OPERATOR_PORT" \
      --gateway-port "$GATEWAY_PORT" \
      --namespace "$NAMESPACE" \
      2>&1 1>/tmp/scenario-result.json || true)

    # Print the scenario's stderr output (diagnostics).
    echo "$SCENARIO_OUTPUT" >&2

    # Parse the scenario results and merge into the aggregate.
    if [[ -f /tmp/scenario-result.json ]] && python3 -c "import json; json.load(open('/tmp/scenario-result.json'))" 2>/dev/null; then
      SCENARIO_PASSED=$(python3 -c "import json; print(json.load(open('/tmp/scenario-result.json'))['passed'])" 2>/dev/null || echo "0")
      SCENARIO_FAILED=$(python3 -c "import json; print(json.load(open('/tmp/scenario-result.json'))['failed'])" 2>/dev/null || echo "0")
      SCENARIO_TOTAL=$(python3 -c "import json; print(json.load(open('/tmp/scenario-result.json'))['total'])" 2>/dev/null || echo "0")

      # Merge individual test results.
      SCENARIO_TESTS=$(python3 -c "
import json
data = json.load(open('/tmp/scenario-result.json'))
for t in data.get('tests', []):
    print(json.dumps(t))
" 2>/dev/null || true)

      while IFS= read -r test_json; do
        [[ -z "$test_json" ]] && continue
        ALL_TESTS+=("$test_json")
      done <<< "$SCENARIO_TESTS"

      TOTAL_PASS=$((TOTAL_PASS + SCENARIO_PASSED))
      TOTAL_FAIL=$((TOTAL_FAIL + SCENARIO_FAILED))

      timeline "Scenario ${scenario_name}: ${SCENARIO_PASSED}/${SCENARIO_TOTAL} passed"
    else
      warn "Scenario ${scenario_name} produced no valid results"
      ALL_TESTS+=("{\"name\":\"${scenario_name}/error\",\"status\":\"fail\",\"detail\":\"Scenario runner crashed\",\"duration_ms\":0}")
      TOTAL_FAIL=$((TOTAL_FAIL + 1))
      timeline "Scenario ${scenario_name} FAILED (runner error)"
    fi
  done
fi

# ===================================================================
# Write aggregated results JSON
# ===================================================================
TOTAL=$((TOTAL_PASS + TOTAL_FAIL))

{
  printf '{\n'
  printf '  "total": %d,\n' "$TOTAL"
  printf '  "passed": %d,\n' "$TOTAL_PASS"
  printf '  "failed": %d,\n' "$TOTAL_FAIL"
  printf '  "tests": [\n'
  for i in "${!ALL_TESTS[@]}"; do
    (( i > 0 )) && printf ',\n'
    printf '    %s' "${ALL_TESTS[$i]}"
  done
  printf '\n  ]\n'
  printf '}\n'
} > "${RESULTS_FILE}"

timeline "Tests complete: ${TOTAL_PASS} passed, ${TOTAL_FAIL} failed"

echo ""
echo "======================================"
echo "  K8s E2E Results: ${TOTAL_PASS}/${TOTAL} passed"
echo "======================================"
echo ""
echo "Results: ${RESULTS_FILE}"
echo "Timeline: ${TIMELINE_FILE}"

# Exit with failure if any tests failed
(( TOTAL_FAIL > 0 )) && exit 1 || exit 0
