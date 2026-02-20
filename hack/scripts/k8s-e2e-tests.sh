#!/usr/bin/env bash
# k8s-e2e-tests.sh — End-to-end tests for the Turbo Engine platform running
# in a Kubernetes cluster (kind).
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
JAEGER_PORT=16686

# Timeouts
ROLLOUT_TIMEOUT=120
RECONCILE_TIMEOUT=120

mkdir -p "${REPORT_DIR}/k8s"

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
fail()  { printf "${RED}[FAIL]${RESET}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Timeline logging
# ---------------------------------------------------------------------------
T_START=$(date +%s)

timeline() {
  local elapsed=$(( $(date +%s) - T_START ))
  local mins=$(( elapsed / 60 ))
  local secs=$(( elapsed % 60 ))
  printf "%02d:%02d  %s\n" "$mins" "$secs" "$*" >> "${TIMELINE_FILE}"
  info "[${mins}m${secs}s] $*"
}

> "${TIMELINE_FILE}"  # Truncate

# ---------------------------------------------------------------------------
# Test result tracking
# ---------------------------------------------------------------------------
TESTS=()
PASS_COUNT=0
FAIL_COUNT=0

record_result() {
  local name="$1"
  local status="$2"  # pass or fail
  local detail="$3"
  local start_ms="$4"
  local end_ms=$(( $(date +%s%N) / 1000000 ))
  local duration_ms=$(( end_ms - start_ms ))

  TESTS+=("{\"name\":\"${name}\",\"status\":\"${status}\",\"detail\":\"${detail}\",\"duration_ms\":${duration_ms}}")

  if [[ "$status" == "pass" ]]; then
    ok "${name}: ${detail}"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    fail "${name}: ${detail}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

current_ms() {
  echo $(( $(date +%s%N) / 1000000 ))
}

# ---------------------------------------------------------------------------
# Cleanup on exit: kill port-forwards
# ---------------------------------------------------------------------------
PF_PIDS=()

cleanup() {
  info "Cleaning up port-forwards..."
  for pid in "${PF_PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Step 1: Wait for control plane rollout
# ---------------------------------------------------------------------------
timeline "Waiting for control plane deployments to roll out"

T=$(current_ms)
ROLLOUT_OK=true
for deploy in registry builder envmanager turbo-engine-operator; do
  if ! kubectl -n "$NAMESPACE" rollout status deployment/"$deploy" --timeout="${ROLLOUT_TIMEOUT}s" 2>/dev/null; then
    ROLLOUT_OK=false
    warn "Deployment $deploy did not roll out in time"
  fi
done

# Also wait for telemetry (non-blocking if they fail)
for deploy in otel-collector jaeger; do
  kubectl -n "$NAMESPACE" rollout status deployment/"$deploy" --timeout=60s 2>/dev/null || \
    warn "Telemetry deployment $deploy not ready (non-blocking)"
done

if $ROLLOUT_OK; then
  record_result "control-plane-rollout" "pass" "All control plane deployments ready" "$T"
  timeline "Control plane pods ready"
else
  record_result "control-plane-rollout" "fail" "Some deployments failed to roll out" "$T"
  timeline "Control plane rollout FAILED"
fi

# ---------------------------------------------------------------------------
# Step 2: Port-forward services
# ---------------------------------------------------------------------------
timeline "Setting up port-forwards"

start_port_forward() {
  local svc="$1"
  local local_port="$2"
  local remote_port="$3"

  kubectl -n "$NAMESPACE" port-forward "svc/$svc" "${local_port}:${remote_port}" &>/dev/null &
  PF_PIDS+=($!)
  # Wait a moment for the port-forward to establish
  sleep 1
}

start_port_forward registry "$REGISTRY_PORT" 8081
start_port_forward builder "$BUILDER_PORT" 8082
start_port_forward envmanager "$ENVMANAGER_PORT" 8083
start_port_forward turbo-engine-operator "$OPERATOR_PORT" 8084

# Give port-forwards a moment to settle
sleep 2

# Verify port-forwards are working
T=$(current_ms)
PF_OK=true
for port_name in "$REGISTRY_PORT:registry" "$BUILDER_PORT:builder" "$ENVMANAGER_PORT:envmanager" "$OPERATOR_PORT:operator"; do
  port="${port_name%%:*}"
  name="${port_name##*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/healthz" 2>/dev/null || echo "000")
  if [[ "$code" != "200" ]]; then
    PF_OK=false
    warn "${name} health check failed (HTTP ${code}) via port-forward"
  fi
done

if $PF_OK; then
  record_result "port-forward-health" "pass" "All port-forwards healthy" "$T"
  timeline "Port-forwards established and healthy"
else
  record_result "port-forward-health" "fail" "Some port-forwards unhealthy" "$T"
  timeline "Port-forward health check FAILED"
fi

# ---------------------------------------------------------------------------
# Step 3: Publish a package
# ---------------------------------------------------------------------------
timeline "Publishing test package to registry"

T=$(current_ms)
PUBLISH_RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${REGISTRY_PORT}/v1/packages" \
  -H "Content-Type: application/json" \
  -d '{
    "package": {
      "name": "k8s-e2e-test-pkg",
      "kind": "graphql-subgraph",
      "version": "1.0.0",
      "schema": "type Query { hello: String }",
      "dependencies": []
    }
  }' 2>/dev/null || echo -e '\n000')

PUBLISH_CODE=$(echo "$PUBLISH_RESP" | tail -1)
if [[ "$PUBLISH_CODE" =~ ^(200|201)$ ]]; then
  record_result "publish-package" "pass" "Published k8s-e2e-test-pkg@1.0.0 (HTTP ${PUBLISH_CODE})" "$T"
  timeline "Published k8s-e2e-test-pkg@1.0.0"
else
  record_result "publish-package" "fail" "HTTP ${PUBLISH_CODE}" "$T"
  timeline "Publish FAILED (HTTP ${PUBLISH_CODE})"
fi

# ---------------------------------------------------------------------------
# Step 4: Create environment
# ---------------------------------------------------------------------------
timeline "Creating test environment"

T=$(current_ms)
ENV_RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${ENVMANAGER_PORT}/v1/environments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "k8s-e2e-env",
    "baseRootPackage": "k8s-e2e-test-pkg",
    "baseRootVersion": "1.0.0",
    "branch": "k8s-e2e",
    "createdBy": "k8s-e2e-tests"
  }' 2>/dev/null || echo -e '\n000')

ENV_CODE=$(echo "$ENV_RESP" | tail -1)
if [[ "$ENV_CODE" =~ ^(200|201)$ ]]; then
  ENV_ID=$(echo "$ENV_RESP" | head -n -1 | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','unknown'))" 2>/dev/null || echo "unknown")
  record_result "create-environment" "pass" "Created environment ${ENV_ID} (HTTP ${ENV_CODE})" "$T"
  timeline "Created environment ${ENV_ID}"
else
  ENV_ID="k8s-e2e-env"
  record_result "create-environment" "fail" "HTTP ${ENV_CODE}" "$T"
  timeline "Create environment FAILED (HTTP ${ENV_CODE})"
fi

# ---------------------------------------------------------------------------
# Step 5: Trigger build
# ---------------------------------------------------------------------------
timeline "Triggering build"

T=$(current_ms)
BUILD_RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${BUILDER_PORT}/v1/builds" \
  -H "Content-Type: application/json" \
  -d "{
    \"environmentId\": \"${ENV_ID}\",
    \"rootPackageName\": \"k8s-e2e-test-pkg\",
    \"rootPackageVersion\": \"1.0.0\"
  }" 2>/dev/null || echo -e '\n000')

BUILD_CODE=$(echo "$BUILD_RESP" | tail -1)
if [[ "$BUILD_CODE" =~ ^(200|201|202)$ ]]; then
  BUILD_ID=$(echo "$BUILD_RESP" | head -n -1 | python3 -c "import json,sys; print(json.load(sys.stdin).get('id','unknown'))" 2>/dev/null || echo "unknown")
  record_result "trigger-build" "pass" "Build ${BUILD_ID} triggered (HTTP ${BUILD_CODE})" "$T"
  timeline "Build ${BUILD_ID} triggered"
else
  BUILD_ID="unknown"
  record_result "trigger-build" "fail" "HTTP ${BUILD_CODE}" "$T"
  timeline "Build trigger FAILED (HTTP ${BUILD_CODE})"
fi

# ---------------------------------------------------------------------------
# Step 6: Poll build status
# ---------------------------------------------------------------------------
timeline "Polling build status"

T=$(current_ms)
BUILD_STATUS="unknown"
POLL_DEADLINE=$(( $(date +%s) + 90 ))

while [[ $(date +%s) -lt $POLL_DEADLINE ]]; do
  STATUS_RESP=$(curl -s "http://localhost:${BUILDER_PORT}/v1/builds/${BUILD_ID}" 2>/dev/null || echo '{}')
  BUILD_STATUS=$(echo "$STATUS_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "unknown")

  if [[ "$BUILD_STATUS" == "succeeded" || "$BUILD_STATUS" == "completed" ]]; then
    break
  elif [[ "$BUILD_STATUS" == "failed" ]]; then
    break
  fi
  sleep 3
done

if [[ "$BUILD_STATUS" == "succeeded" || "$BUILD_STATUS" == "completed" ]]; then
  record_result "build-status" "pass" "Build ${BUILD_ID} succeeded" "$T"
  timeline "Build ${BUILD_ID} succeeded"
else
  record_result "build-status" "fail" "Build status: ${BUILD_STATUS}" "$T"
  timeline "Build ${BUILD_ID} status: ${BUILD_STATUS}"
fi

# ---------------------------------------------------------------------------
# Step 7: Trigger operator reconciliation via POST /v1/reconcile
# ---------------------------------------------------------------------------
timeline "Triggering operator reconciliation"

T=$(current_ms)

# Image for the echo server — built as turbo-engine/echo-server:e2e in CI
# and loaded into kind. Uses the default pause image as fallback.
ECHO_IMAGE="${E2E_ECHO_IMAGE:-turbo-engine/echo-server:e2e}"

# Send a reconcile request with the environment and build info.
# Includes ingress routes so the gateway can forward traffic to the
# echo server and we can test the full request path.
RECONCILE_RESP=$(curl -s -w '\n%{http_code}' -X POST "http://localhost:${OPERATOR_PORT}/v1/reconcile" \
  -H "Content-Type: application/json" \
  -d "{
    \"spec\": {
      \"environmentId\": \"${ENV_ID}\",
      \"buildId\": \"${BUILD_ID}\",
      \"rootPackage\": \"k8s-e2e-test-pkg\",
      \"components\": [
        {
          \"packageName\": \"k8s-e2e-test-pkg\",
          \"packageVersion\": \"1.0.0\",
          \"kind\": \"GRAPHQL_SUBGRAPH\",
          \"artifactHash\": \"e2e-test-hash\",
          \"runtime\": {
            \"replicas\": 1,
            \"image\": \"${ECHO_IMAGE}\",
            \"resources\": {
              \"cpuRequest\": \"50m\",
              \"memoryRequest\": \"64Mi\"
            }
          }
        }
      ],
      \"ingress\": {
        \"host\": \"localhost\",
        \"routes\": [
          {
            \"path\": \"/api/e2e\",
            \"targetComponent\": \"k8s-e2e-test-pkg\",
            \"targetPort\": 8080
          }
        ]
      }
    }
  }" 2>/dev/null || echo -e '\n000')

RECONCILE_CODE=$(echo "$RECONCILE_RESP" | tail -1)

if [[ "$RECONCILE_CODE" == "200" ]]; then
  # Give the applier a moment to create resources.
  sleep 5

  # Now check status.
  OP_RESP=$(curl -s "http://localhost:${OPERATOR_PORT}/v1/status/${ENV_ID}" 2>/dev/null || echo '{}')
  RECONCILE_STATUS=$(echo "$OP_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('status',{}).get('phase','unknown') if isinstance(d.get('status'),dict) else d.get('phase','unknown'))" 2>/dev/null || echo "unknown")

  record_result "operator-reconcile" "pass" "Reconciliation triggered, phase=${RECONCILE_STATUS} (HTTP ${RECONCILE_CODE})" "$T"
  timeline "Operator reconciliation complete — phase=${RECONCILE_STATUS}"
else
  RECONCILE_BODY=$(echo "$RECONCILE_RESP" | head -n -1)
  record_result "operator-reconcile" "fail" "HTTP ${RECONCILE_CODE}: ${RECONCILE_BODY}" "$T"
  timeline "Operator reconciliation FAILED (HTTP ${RECONCILE_CODE})"
fi

# ---------------------------------------------------------------------------
# Step 8: Verify K8s resources created by operator
# ---------------------------------------------------------------------------
timeline "Verifying operator-created K8s resources"

T=$(current_ms)
RESOURCES_OK=true

# Check for Deployment
if kubectl -n "$NAMESPACE" get deployment "deploy-k8s-e2e-test-pkg" &>/dev/null; then
  info "  Found deployment/deploy-k8s-e2e-test-pkg"
else
  warn "  Missing deployment/deploy-k8s-e2e-test-pkg"
  RESOURCES_OK=false
fi

# Check for Service
if kubectl -n "$NAMESPACE" get service "svc-k8s-e2e-test-pkg" &>/dev/null; then
  info "  Found service/svc-k8s-e2e-test-pkg"
else
  warn "  Missing service/svc-k8s-e2e-test-pkg"
  RESOURCES_OK=false
fi

# Check for ConfigMap
if kubectl -n "$NAMESPACE" get configmap "cm-k8s-e2e-test-pkg" &>/dev/null; then
  info "  Found configmap/cm-k8s-e2e-test-pkg"
else
  warn "  Missing configmap/cm-k8s-e2e-test-pkg"
  RESOURCES_OK=false
fi

if $RESOURCES_OK; then
  record_result "verify-k8s-resources" "pass" "All expected resources created by operator" "$T"
  timeline "K8s resources verified (Deployment, Service, ConfigMap)"
else
  record_result "verify-k8s-resources" "fail" "Some resources missing" "$T"
  timeline "K8s resource verification FAILED"
fi

# ---------------------------------------------------------------------------
# Step 9: Verify labels on operator-created resources
# ---------------------------------------------------------------------------
T=$(current_ms)

LABELS_OK=true
if $RESOURCES_OK; then
  # Check labels on the deployment
  ENV_LABEL=$(kubectl -n "$NAMESPACE" get deployment "deploy-k8s-e2e-test-pkg" -o jsonpath='{.metadata.labels.turboengine\.io/environment}' 2>/dev/null || echo "")
  COMPONENT_LABEL=$(kubectl -n "$NAMESPACE" get deployment "deploy-k8s-e2e-test-pkg" -o jsonpath='{.metadata.labels.turboengine\.io/component}' 2>/dev/null || echo "")
  MANAGED_BY=$(kubectl -n "$NAMESPACE" get deployment "deploy-k8s-e2e-test-pkg" -o jsonpath='{.metadata.labels.app\.kubernetes\.io/managed-by}' 2>/dev/null || echo "")

  if [[ "$ENV_LABEL" == "$ENV_ID" ]]; then
    info "  Label turboengine.io/environment=${ENV_LABEL}"
  else
    warn "  Expected turboengine.io/environment=${ENV_ID}, got '${ENV_LABEL}'"
    LABELS_OK=false
  fi

  if [[ "$COMPONENT_LABEL" == "k8s-e2e-test-pkg" ]]; then
    info "  Label turboengine.io/component=${COMPONENT_LABEL}"
  else
    warn "  Expected turboengine.io/component=k8s-e2e-test-pkg, got '${COMPONENT_LABEL}'"
    LABELS_OK=false
  fi

  if [[ "$MANAGED_BY" == "turbo-engine-operator" ]]; then
    info "  Label app.kubernetes.io/managed-by=${MANAGED_BY}"
  else
    warn "  Expected app.kubernetes.io/managed-by=turbo-engine-operator, got '${MANAGED_BY}'"
    LABELS_OK=false
  fi
fi

if $LABELS_OK; then
  record_result "verify-labels" "pass" "Correct labels on operator-created resources" "$T"
else
  record_result "verify-labels" "fail" "Label mismatch on operator-created resources" "$T"
fi

# ---------------------------------------------------------------------------
# Step 10: Verify pod is running (echo server)
# ---------------------------------------------------------------------------
T=$(current_ms)

if $RESOURCES_OK; then
  if kubectl -n "$NAMESPACE" wait --for=condition=available "deployment/deploy-k8s-e2e-test-pkg" --timeout=60s &>/dev/null; then
    record_result "verify-pod-running" "pass" "API service pod is running" "$T"
    timeline "API service pod running"
  else
    record_result "verify-pod-running" "fail" "Pod did not become available within 60s" "$T"
    timeline "API service pod NOT running"
  fi
else
  record_result "verify-pod-running" "fail" "Skipped — resources not created" "$T"
fi

# ---------------------------------------------------------------------------
# Step 11: Verify echo server responds directly (port-forward to the service)
# ---------------------------------------------------------------------------
timeline "Testing echo server directly via port-forward"
T=$(current_ms)

ECHO_PORT=18090
if $RESOURCES_OK; then
  kubectl -n "$NAMESPACE" port-forward "svc/svc-k8s-e2e-test-pkg" "${ECHO_PORT}:8080" &>/dev/null &
  PF_PIDS+=($!)
  sleep 2

  ECHO_RESP=$(curl -s -w '\n%{http_code}' "http://localhost:${ECHO_PORT}/healthz" 2>/dev/null || echo -e '\n000')
  ECHO_CODE=$(echo "$ECHO_RESP" | tail -1)

  if [[ "$ECHO_CODE" == "200" ]]; then
    record_result "echo-server-direct" "pass" "Echo server responded (HTTP ${ECHO_CODE})" "$T"
    timeline "Echo server responding directly"
  else
    record_result "echo-server-direct" "fail" "Echo server HTTP ${ECHO_CODE}" "$T"
    timeline "Echo server direct test FAILED (HTTP ${ECHO_CODE})"
  fi
else
  record_result "echo-server-direct" "fail" "Skipped — resources not created" "$T"
fi

# ---------------------------------------------------------------------------
# Step 12: Verify gateway has routing config from operator
# ---------------------------------------------------------------------------
timeline "Checking gateway routing config"
T=$(current_ms)

# Port-forward gateway
GATEWAY_PORT=18080
kubectl -n "$NAMESPACE" port-forward svc/gateway "${GATEWAY_PORT}:8080" &>/dev/null &
PF_PIDS+=($!)
sleep 2

GW_HEALTH=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${GATEWAY_PORT}/healthz" 2>/dev/null || echo "000")

if [[ "$GW_HEALTH" == "200" ]]; then
  # Wait for the gateway to pick up routing config from the operator.
  # The gateway polls every 5 seconds (set in the config response).
  ROUTE_READY=false
  for i in $(seq 1 6); do
    # Send a request to the gateway on the configured path.
    GW_RESP=$(curl -s -w '\n%{http_code}' "http://localhost:${GATEWAY_PORT}/api/e2e/healthz" 2>/dev/null || echo -e '\n000')
    GW_CODE=$(echo "$GW_RESP" | tail -1)
    if [[ "$GW_CODE" == "200" ]]; then
      ROUTE_READY=true
      break
    fi
    sleep 5
  done

  if $ROUTE_READY; then
    record_result "gateway-routing" "pass" "Gateway routes /api/e2e → echo server (HTTP ${GW_CODE})" "$T"
    timeline "Gateway routing config active"
  else
    record_result "gateway-routing" "fail" "Gateway route not ready after 30s (HTTP ${GW_CODE})" "$T"
    timeline "Gateway routing FAILED"
  fi
else
  record_result "gateway-routing" "fail" "Gateway not healthy (HTTP ${GW_HEALTH})" "$T"
  timeline "Gateway health check FAILED"
fi

# ---------------------------------------------------------------------------
# Step 13: End-to-end traffic test — client → gateway → echo server
# ---------------------------------------------------------------------------
timeline "Testing end-to-end traffic through gateway"
T=$(current_ms)

if [[ "${ROUTE_READY:-false}" == "true" ]]; then
  # Send a request through the gateway and verify the echo response.
  E2E_RESP=$(curl -s "http://localhost:${GATEWAY_PORT}/api/e2e/hello?test=e2e" 2>/dev/null || echo '{}')

  # The echo server returns JSON with the request details.
  E2E_SERVICE=$(echo "$E2E_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('service',''))" 2>/dev/null || echo "")
  E2E_PATH=$(echo "$E2E_RESP" | python3 -c "import json,sys; print(json.load(sys.stdin).get('path',''))" 2>/dev/null || echo "")

  if [[ "$E2E_SERVICE" == "turbo-engine-echo" ]]; then
    record_result "e2e-traffic" "pass" "Request routed through gateway to echo server (path=${E2E_PATH})" "$T"
    timeline "End-to-end traffic test passed"
  else
    record_result "e2e-traffic" "fail" "Unexpected response: service=${E2E_SERVICE}" "$T"
    timeline "End-to-end traffic test FAILED (service=${E2E_SERVICE})"
    info "Response body: ${E2E_RESP}"
  fi
else
  record_result "e2e-traffic" "fail" "Skipped — gateway routing not ready" "$T"
  timeline "End-to-end traffic test SKIPPED"
fi

# ---------------------------------------------------------------------------
# Write results JSON
# ---------------------------------------------------------------------------
TOTAL=$((PASS_COUNT + FAIL_COUNT))

{
  printf '{\n'
  printf '  "total": %d,\n' "$TOTAL"
  printf '  "passed": %d,\n' "$PASS_COUNT"
  printf '  "failed": %d,\n' "$FAIL_COUNT"
  printf '  "tests": [\n'
  for i in "${!TESTS[@]}"; do
    if (( i > 0 )); then printf ',\n'; fi
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
if (( FAIL_COUNT > 0 )); then
  exit 1
fi
