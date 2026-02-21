#!/usr/bin/env bash
# k8s-e2e-tests.sh — End-to-end tests for the Turbo Engine platform running
# in a Kubernetes cluster (kind).
#
# Topology under test:
#
#   client → gateway → orchestrator (RPC-to-REST) → petstore-api (REST mock)
#
# The test publishes two packages (an OpenAPI upstream + a workflow-engine
# orchestrator), triggers a build, reconciles via the operator, and verifies
# the full request chain including trace propagation.
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

# Ports for port-forwarding
REGISTRY_PORT=18081
BUILDER_PORT=18082
ENVMANAGER_PORT=18083
OPERATOR_PORT=18084

# Timeouts
ROLLOUT_TIMEOUT=120

# Images (loaded into kind before this script runs)
PETSTORE_IMAGE="${E2E_PETSTORE_IMAGE:-turbo-engine/petstore-mock:e2e}"
ORCHESTRATOR_IMAGE="${E2E_ORCHESTRATOR_IMAGE:-turbo-engine/orchestrator:e2e}"

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

TESTS=()
PASS_COUNT=0
FAIL_COUNT=0

record_result() {
  local name="$1" status="$2" detail="$3" start_ms="$4"
  local end_ms=$(( $(date +%s%N) / 1000000 ))
  local duration_ms=$(( end_ms - start_ms ))
  TESTS+=("{\"name\":\"${name}\",\"status\":\"${status}\",\"detail\":\"${detail}\",\"duration_ms\":${duration_ms}}")
  if [[ "$status" == "pass" ]]; then ok "${name}: ${detail}"; PASS_COUNT=$((PASS_COUNT + 1))
  else fail "${name}: ${detail}"; FAIL_COUNT=$((FAIL_COUNT + 1)); fi
}
current_ms() { echo $(( $(date +%s%N) / 1000000 )); }

# json_field extracts a top-level key from a JSON blob via python3.
json_field() { python3 -c "import json,sys; print(json.load(sys.stdin).get('$1',''))" 2>/dev/null || echo ""; }

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
# Step 3: Publish petstore-api package (upstream REST API)
# ===================================================================
timeline "Publishing petstore-api package"
T=$(current_ms)
RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${REGISTRY_PORT}/v1/packages" \
  -H "Content-Type: application/json" \
  -d '{
    "package": {
      "name": "petstore-api",
      "kind": "openapi-service",
      "version": "1.0.0",
      "schema": "{\"openapi\":\"3.0.0\",\"info\":{\"title\":\"Petstore\",\"version\":\"1.0.0\"},\"paths\":{\"/pets\":{\"get\":{\"operationId\":\"listPets\",\"summary\":\"List all pets\"}},\"/pets/{id}\":{\"get\":{\"operationId\":\"getPet\",\"summary\":\"Get pet by ID\"}}}}",
      "upstreamConfig": {"url": "http://petstore-api:8080"},
      "dependencies": []
    }
  }' 2>/dev/null || echo -e '\n000')
CODE=$(echo "$RESP" | tail -1)
if [[ "$CODE" =~ ^(200|201)$ ]]; then
  record_result "publish-petstore-api" "pass" "Published petstore-api@1.0.0 (HTTP ${CODE})" "$T"
  timeline "Published petstore-api@1.0.0"
else
  record_result "publish-petstore-api" "fail" "HTTP ${CODE}" "$T"
  timeline "Publish petstore-api FAILED (HTTP ${CODE})"
fi

# ===================================================================
# Step 4: Publish petstore-orchestrator package (depends on petstore-api)
# ===================================================================
timeline "Publishing petstore-orchestrator package"
T=$(current_ms)
RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${REGISTRY_PORT}/v1/packages" \
  -H "Content-Type: application/json" \
  -d '{
    "package": {
      "name": "petstore-orchestrator",
      "kind": "workflow-engine",
      "version": "1.0.0",
      "schema": "{\"workflows\":{\"listPets\":{\"method\":\"POST\",\"path\":\"/rpc/listPets\",\"upstream\":\"petstore-api\",\"upstreamMethod\":\"GET\",\"upstreamPath\":\"/pets\"},\"getPet\":{\"method\":\"POST\",\"path\":\"/rpc/getPet\",\"upstream\":\"petstore-api\",\"upstreamMethod\":\"GET\",\"upstreamPath\":\"/pets/{id}\"}}}",
      "dependencies": [
        {"packageName": "petstore-api", "versionConstraint": "1.0.0"}
      ]
    }
  }' 2>/dev/null || echo -e '\n000')
CODE=$(echo "$RESP" | tail -1)
if [[ "$CODE" =~ ^(200|201)$ ]]; then
  record_result "publish-orchestrator" "pass" "Published petstore-orchestrator@1.0.0 (HTTP ${CODE})" "$T"
  timeline "Published petstore-orchestrator@1.0.0"
else
  record_result "publish-orchestrator" "fail" "HTTP ${CODE}" "$T"
  timeline "Publish petstore-orchestrator FAILED (HTTP ${CODE})"
fi

# ===================================================================
# Step 5: Create environment
# ===================================================================
timeline "Creating test environment"
T=$(current_ms)
RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${ENVMANAGER_PORT}/v1/environments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "petstore-e2e",
    "baseRootPackage": "petstore-orchestrator",
    "baseRootVersion": "1.0.0",
    "branch": "k8s-e2e",
    "createdBy": "k8s-e2e-tests"
  }' 2>/dev/null || echo -e '\n000')
CODE=$(echo "$RESP" | tail -1)
if [[ "$CODE" =~ ^(200|201)$ ]]; then
  ENV_ID=$(echo "$RESP" | head -n -1 | json_field id)
  record_result "create-environment" "pass" "Created environment ${ENV_ID} (HTTP ${CODE})" "$T"
  timeline "Created environment ${ENV_ID}"
else
  ENV_ID="petstore-e2e"
  record_result "create-environment" "fail" "HTTP ${CODE}" "$T"
  timeline "Create environment FAILED (HTTP ${CODE})"
fi

# ===================================================================
# Step 6: Trigger build
# ===================================================================
timeline "Triggering build"
T=$(current_ms)
RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${BUILDER_PORT}/v1/builds" \
  -H "Content-Type: application/json" \
  -d "{
    \"environmentId\": \"${ENV_ID}\",
    \"rootPackageName\": \"petstore-orchestrator\",
    \"rootPackageVersion\": \"1.0.0\"
  }" 2>/dev/null || echo -e '\n000')
CODE=$(echo "$RESP" | tail -1)
if [[ "$CODE" =~ ^(200|201|202)$ ]]; then
  BUILD_ID=$(echo "$RESP" | head -n -1 | json_field id)
  record_result "trigger-build" "pass" "Build ${BUILD_ID} triggered (HTTP ${CODE})" "$T"
  timeline "Build ${BUILD_ID} triggered"
else
  BUILD_ID="unknown"
  record_result "trigger-build" "fail" "HTTP ${CODE}" "$T"
  timeline "Build trigger FAILED (HTTP ${CODE})"
fi

# ===================================================================
# Step 7: Poll build status
# ===================================================================
timeline "Polling build status"
T=$(current_ms)
BUILD_STATUS="unknown"
POLL_DEADLINE=$(( $(date +%s) + 90 ))
while [[ $(date +%s) -lt $POLL_DEADLINE ]]; do
  BUILD_STATUS=$(curl -s "http://localhost:${BUILDER_PORT}/v1/builds/${BUILD_ID}" 2>/dev/null | json_field status)
  [[ "$BUILD_STATUS" == "succeeded" || "$BUILD_STATUS" == "completed" || "$BUILD_STATUS" == "failed" ]] && break
  sleep 3
done
if [[ "$BUILD_STATUS" == "succeeded" || "$BUILD_STATUS" == "completed" ]]; then
  record_result "build-status" "pass" "Build ${BUILD_ID} succeeded" "$T"
  timeline "Build ${BUILD_ID} succeeded"
else
  record_result "build-status" "fail" "Build status: ${BUILD_STATUS}" "$T"
  timeline "Build ${BUILD_ID} status: ${BUILD_STATUS}"
fi

# ===================================================================
# Step 8: Reconcile — deploy both components via operator
# ===================================================================
timeline "Triggering operator reconciliation (2 components)"
T=$(current_ms)

RECONCILE_RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${OPERATOR_PORT}/v1/reconcile" \
  -H "Content-Type: application/json" \
  -d "{
    \"spec\": {
      \"environmentId\": \"${ENV_ID}\",
      \"buildId\": \"${BUILD_ID}\",
      \"rootPackage\": \"petstore-orchestrator\",
      \"components\": [
        {
          \"packageName\": \"petstore-api\",
          \"packageVersion\": \"1.0.0\",
          \"kind\": \"OPENAPI_SERVICE\",
          \"artifactHash\": \"petstore-api-hash\",
          \"runtime\": {
            \"replicas\": 1,
            \"image\": \"${PETSTORE_IMAGE}\",
            \"resources\": {\"cpuRequest\": \"50m\", \"memoryRequest\": \"64Mi\"}
          }
        },
        {
          \"packageName\": \"petstore-orchestrator\",
          \"packageVersion\": \"1.0.0\",
          \"kind\": \"WORKFLOW_ENGINE\",
          \"artifactHash\": \"orchestrator-hash\",
          \"runtime\": {
            \"replicas\": 1,
            \"image\": \"${ORCHESTRATOR_IMAGE}\",
            \"env\": {
              \"UPSTREAM_URL\": \"http://svc-petstore-api:8080\"
            },
            \"resources\": {\"cpuRequest\": \"50m\", \"memoryRequest\": \"64Mi\"}
          }
        }
      ],
      \"ingress\": {
        \"host\": \"localhost\",
        \"routes\": [
          {
            \"path\": \"/api/pets\",
            \"targetComponent\": \"petstore-orchestrator\",
            \"targetPort\": 8080
          }
        ]
      }
    }
  }" 2>/dev/null || echo -e '\n000')

RECONCILE_CODE=$(echo "$RECONCILE_RESP" | tail -1)
if [[ "$RECONCILE_CODE" == "200" ]]; then
  sleep 5
  record_result "operator-reconcile" "pass" "Reconciliation triggered (HTTP ${RECONCILE_CODE})" "$T"
  timeline "Operator reconciliation complete"
else
  RECONCILE_BODY=$(echo "$RECONCILE_RESP" | head -n -1)
  record_result "operator-reconcile" "fail" "HTTP ${RECONCILE_CODE}: ${RECONCILE_BODY}" "$T"
  timeline "Operator reconciliation FAILED (HTTP ${RECONCILE_CODE})"
fi

# ===================================================================
# Step 9: Verify K8s resources for BOTH components
# ===================================================================
timeline "Verifying operator-created K8s resources"
T=$(current_ms)
RESOURCES_OK=true

for comp in petstore-api petstore-orchestrator; do
  for kind_name in "deployment/deploy-${comp}" "service/svc-${comp}" "configmap/cm-${comp}"; do
    if kubectl -n "$NAMESPACE" get "$kind_name" &>/dev/null; then
      info "  Found ${kind_name}"
    else
      warn "  Missing ${kind_name}"
      RESOURCES_OK=false
    fi
  done
done

if $RESOURCES_OK; then
  record_result "verify-k8s-resources" "pass" "All 6 resources created (2x Deployment, Service, ConfigMap)" "$T"
  timeline "K8s resources verified"
else
  record_result "verify-k8s-resources" "fail" "Some resources missing" "$T"
  timeline "K8s resource verification FAILED"
fi

# ===================================================================
# Step 10: Verify labels on operator-created resources
# ===================================================================
T=$(current_ms)
LABELS_OK=true
if $RESOURCES_OK; then
  for comp in petstore-api petstore-orchestrator; do
    ENV_LABEL=$(kubectl -n "$NAMESPACE" get deployment "deploy-${comp}" -o jsonpath='{.metadata.labels.turboengine\.io/environment}' 2>/dev/null || echo "")
    COMP_LABEL=$(kubectl -n "$NAMESPACE" get deployment "deploy-${comp}" -o jsonpath='{.metadata.labels.turboengine\.io/component}' 2>/dev/null || echo "")
    MANAGED_BY=$(kubectl -n "$NAMESPACE" get deployment "deploy-${comp}" -o jsonpath='{.metadata.labels.app\.kubernetes\.io/managed-by}' 2>/dev/null || echo "")

    [[ "$ENV_LABEL" != "$ENV_ID" ]] && { warn "deploy-${comp}: expected env=${ENV_ID}, got '${ENV_LABEL}'"; LABELS_OK=false; }
    [[ "$COMP_LABEL" != "$comp" ]] && { warn "deploy-${comp}: expected component=${comp}, got '${COMP_LABEL}'"; LABELS_OK=false; }
    [[ "$MANAGED_BY" != "turbo-engine-operator" ]] && { warn "deploy-${comp}: expected managed-by=turbo-engine-operator, got '${MANAGED_BY}'"; LABELS_OK=false; }
  done
fi
if $LABELS_OK; then record_result "verify-labels" "pass" "Correct labels on both components" "$T"
else record_result "verify-labels" "fail" "Label mismatch" "$T"; fi

# ===================================================================
# Step 11: Wait for both pods to be running
# ===================================================================
T=$(current_ms)
PODS_OK=true
if $RESOURCES_OK; then
  for comp in petstore-api petstore-orchestrator; do
    if ! kubectl -n "$NAMESPACE" wait --for=condition=available "deployment/deploy-${comp}" --timeout=60s &>/dev/null; then
      warn "deploy-${comp} did not become available"
      PODS_OK=false
    fi
  done
fi
if $PODS_OK; then record_result "pods-running" "pass" "Both component pods running" "$T"; timeline "Both pods running"
else record_result "pods-running" "fail" "Some pods not available" "$T"; timeline "Pod readiness FAILED"; fi

# ===================================================================
# Step 12: Test petstore-api directly (port-forward)
# ===================================================================
timeline "Testing petstore-api directly"
T=$(current_ms)
PETSTORE_PORT=18090
if $PODS_OK; then
  kubectl -n "$NAMESPACE" port-forward "svc/svc-petstore-api" "${PETSTORE_PORT}:8080" &>/dev/null &
  PF_PIDS+=($!); sleep 2

  RESP=$(curl -s "http://localhost:${PETSTORE_PORT}/pets" 2>/dev/null || echo '{}')
  PET_COUNT=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('pets',[])))" 2>/dev/null || echo "0")

  if [[ "$PET_COUNT" -gt 0 ]]; then
    record_result "petstore-direct" "pass" "Petstore API returned ${PET_COUNT} pets" "$T"
    timeline "Petstore API responding (${PET_COUNT} pets)"
  else
    record_result "petstore-direct" "fail" "No pets returned" "$T"
    timeline "Petstore API test FAILED"
    info "Response: ${RESP}"
  fi
else
  record_result "petstore-direct" "fail" "Skipped — pods not running" "$T"
fi

# ===================================================================
# Step 13: Test orchestrator directly (port-forward)
# ===================================================================
timeline "Testing orchestrator directly"
T=$(current_ms)
ORCH_PORT=18091
if $PODS_OK; then
  kubectl -n "$NAMESPACE" port-forward "svc/svc-petstore-orchestrator" "${ORCH_PORT}:8080" &>/dev/null &
  PF_PIDS+=($!); sleep 2

  RESP=$(curl -s -X POST "http://localhost:${ORCH_PORT}/rpc/listPets" 2>/dev/null || echo '{}')
  RPC_NAME=$(echo "$RESP" | json_field rpc)
  UPSTREAM_STATUS=$(echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('upstream_status',''))" 2>/dev/null || echo "")

  if [[ "$RPC_NAME" == "listPets" && "$UPSTREAM_STATUS" == "200" ]]; then
    record_result "orchestrator-direct" "pass" "Orchestrator translated RPC to REST (upstream HTTP ${UPSTREAM_STATUS})" "$T"
    timeline "Orchestrator RPC→REST working"
  else
    record_result "orchestrator-direct" "fail" "rpc=${RPC_NAME}, upstream_status=${UPSTREAM_STATUS}" "$T"
    timeline "Orchestrator test FAILED"
    info "Response: ${RESP}"
  fi
else
  record_result "orchestrator-direct" "fail" "Skipped — pods not running" "$T"
fi

# ===================================================================
# Step 14: Test gateway routing to orchestrator
# ===================================================================
timeline "Checking gateway routing config"
T=$(current_ms)
GATEWAY_PORT=18080
kubectl -n "$NAMESPACE" port-forward svc/gateway "${GATEWAY_PORT}:8080" &>/dev/null &
PF_PIDS+=($!); sleep 2

ROUTE_READY=false
for i in $(seq 1 8); do
  GW_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${GATEWAY_PORT}/api/pets/healthz" 2>/dev/null || echo "000")
  if [[ "$GW_CODE" == "200" ]]; then ROUTE_READY=true; break; fi
  sleep 5
done

if $ROUTE_READY; then
  record_result "gateway-routing" "pass" "Gateway routes /api/pets → orchestrator (HTTP ${GW_CODE})" "$T"
  timeline "Gateway routing active"
else
  record_result "gateway-routing" "fail" "Route not ready after 40s (HTTP ${GW_CODE})" "$T"
  timeline "Gateway routing FAILED"
fi

# ===================================================================
# Step 15: End-to-end RPC call — gateway → orchestrator → petstore-api
# ===================================================================
timeline "Testing end-to-end RPC call through full chain"
T=$(current_ms)

if [[ "${ROUTE_READY}" == "true" ]]; then
  E2E_RESP=$(curl -s -X POST "http://localhost:${GATEWAY_PORT}/api/pets/rpc/listPets" 2>/dev/null || echo '{}')
  E2E_RPC=$(echo "$E2E_RESP" | json_field rpc)
  E2E_UPSTREAM=$(echo "$E2E_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('upstream_status',''))" 2>/dev/null || echo "")
  E2E_RESULT=$(echo "$E2E_RESP" | python3 -c "import json,sys; r=json.load(sys.stdin).get('result',{}); print(len(r.get('pets',[])))" 2>/dev/null || echo "0")

  if [[ "$E2E_RPC" == "listPets" && "$E2E_UPSTREAM" == "200" && "$E2E_RESULT" -gt 0 ]]; then
    record_result "e2e-rpc-call" "pass" "gateway → orchestrator → petstore-api: ${E2E_RESULT} pets returned" "$T"
    timeline "E2E RPC call passed (${E2E_RESULT} pets)"
  else
    record_result "e2e-rpc-call" "fail" "rpc=${E2E_RPC}, upstream=${E2E_UPSTREAM}, pets=${E2E_RESULT}" "$T"
    timeline "E2E RPC call FAILED"
    info "Response: ${E2E_RESP}"
  fi
else
  record_result "e2e-rpc-call" "fail" "Skipped — gateway routing not ready" "$T"
  timeline "E2E RPC call SKIPPED"
fi

# ===================================================================
# Step 16: Test single-pet RPC call (getPet)
# ===================================================================
timeline "Testing getPet RPC call"
T=$(current_ms)

if [[ "${ROUTE_READY}" == "true" ]]; then
  RESP=$(curl -s -X POST "http://localhost:${GATEWAY_PORT}/api/pets/rpc/getPet?id=2" 2>/dev/null || echo '{}')
  PET_NAME=$(echo "$RESP" | python3 -c "import json,sys; r=json.load(sys.stdin).get('result',{}); print(r.get('pet',{}).get('name',''))" 2>/dev/null || echo "")

  if [[ "$PET_NAME" == "Whiskers" ]]; then
    record_result "e2e-get-pet" "pass" "getPet(id=2) returned Whiskers" "$T"
    timeline "getPet RPC passed"
  else
    record_result "e2e-get-pet" "fail" "Expected Whiskers, got '${PET_NAME}'" "$T"
    timeline "getPet RPC FAILED"
    info "Response: ${RESP}"
  fi
else
  record_result "e2e-get-pet" "fail" "Skipped — gateway routing not ready" "$T"
fi

# ===================================================================
# Step 17: Verify trace propagation (traceparent flows end-to-end)
# ===================================================================
timeline "Verifying trace propagation"
T=$(current_ms)

if [[ "${ROUTE_READY}" == "true" ]]; then
  # Generate a known trace ID and send it with the request.
  TRACE_ID="a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5"
  TRACEPARENT="00-${TRACE_ID}-0000000000000001-01"

  RESP=$(curl -s -X POST "http://localhost:${GATEWAY_PORT}/api/pets/rpc/listPets" \
    -H "Traceparent: ${TRACEPARENT}" 2>/dev/null || echo '{}')
  RESP_TRACE=$(echo "$RESP" | json_field trace_id)

  # The orchestrator extracts trace_id from traceparent and includes it
  # in the response. Verify it matches what we sent.
  if [[ "$RESP_TRACE" == "$TRACE_ID" ]]; then
    record_result "trace-propagation" "pass" "Traceparent propagated through gateway → orchestrator (trace_id=${TRACE_ID:0:12}...)" "$T"
    timeline "Trace propagation verified"
  else
    record_result "trace-propagation" "fail" "Expected trace_id=${TRACE_ID:0:12}..., got '${RESP_TRACE}'" "$T"
    timeline "Trace propagation FAILED"
    info "Response: ${RESP}"
  fi
else
  record_result "trace-propagation" "fail" "Skipped — gateway routing not ready" "$T"
fi

# ===================================================================
# Step 18: Dump pod logs to report (for debugging)
# ===================================================================
timeline "Capturing component logs"
for comp in petstore-api petstore-orchestrator; do
  POD=$(kubectl -n "$NAMESPACE" get pods -l "app.kubernetes.io/name=${comp}" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
  if [[ -n "$POD" ]]; then
    kubectl -n "$NAMESPACE" logs "$POD" --tail=50 > "${REPORT_DIR}/k8s/${comp}-logs.txt" 2>&1 || true
  fi
done

# ===================================================================
# Write results JSON
# ===================================================================
TOTAL=$((PASS_COUNT + FAIL_COUNT))

{
  printf '{\n'
  printf '  "total": %d,\n' "$TOTAL"
  printf '  "passed": %d,\n' "$PASS_COUNT"
  printf '  "failed": %d,\n' "$FAIL_COUNT"
  printf '  "tests": [\n'
  for i in "${!TESTS[@]}"; do
    (( i > 0 )) && printf ',\n'
    printf '    %s' "${TESTS[$i]}"
  done
  printf '\n  ]\n'
  printf '}\n'
} > "${RESULTS_FILE}"

timeline "Tests complete: ${PASS_COUNT} passed, ${FAIL_COUNT} failed"

echo ""
echo "======================================"
echo "  K8s E2E Results: ${PASS_COUNT}/${TOTAL} passed"
echo "======================================"
echo ""
echo "Results: ${RESULTS_FILE}"
echo "Timeline: ${TIMELINE_FILE}"

# Exit with failure if any tests failed
(( FAIL_COUNT > 0 )) && exit 1 || exit 0
