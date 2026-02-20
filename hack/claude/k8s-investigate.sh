#!/usr/bin/env bash
# k8s-investigate.sh — Quick summary of the Turbo Engine K8s cluster state.
# Designed for Claude Code interactive sessions.
#
# Usage:
#   ./hack/claude/k8s-investigate.sh [namespace]
set -euo pipefail

NAMESPACE="${1:-turbo-engine-e2e}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

section() { printf "\n${BOLD}${CYAN}=== %s ===${RESET}\n\n" "$*"; }
info()    { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()      { printf "${GREEN}  [OK]${RESET}    %-22s %s\n" "$1" "$2"; }
down()    { printf "${RED}  [DOWN]${RESET}  %-22s %s\n" "$1" "$2"; }

# ---------------------------------------------------------------------------
# Section 1: Pod Status
# ---------------------------------------------------------------------------
section "POD STATUS (namespace: ${NAMESPACE})"

kubectl get pods -n "$NAMESPACE" -o wide 2>/dev/null || echo "(no pods found or kubectl not configured)"

# ---------------------------------------------------------------------------
# Section 2: Deployment Status
# ---------------------------------------------------------------------------
section "DEPLOYMENT STATUS"

HEALTHY=0
TOTAL=0

for deploy in $(kubectl get deployments -n "$NAMESPACE" -o name 2>/dev/null); do
  TOTAL=$((TOTAL + 1))
  name="${deploy#deployment.apps/}"
  ready=$(kubectl get "$deploy" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  desired=$(kubectl get "$deploy" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "?")

  if [[ "$ready" == "$desired" && "$ready" != "0" ]]; then
    ok "$name" "(${ready}/${desired} ready)"
    HEALTHY=$((HEALTHY + 1))
  else
    down "$name" "(${ready:-0}/${desired} ready)"
  fi
done

echo ""
if (( TOTAL == 0 )); then
  printf "${YELLOW}No deployments found in namespace ${NAMESPACE}.${RESET}\n"
elif (( HEALTHY == TOTAL )); then
  printf "${GREEN}All %d deployments healthy.${RESET}\n" "$TOTAL"
else
  printf "${YELLOW}%d/%d deployments healthy.${RESET}\n" "$HEALTHY" "$TOTAL"
fi

# ---------------------------------------------------------------------------
# Section 3: Operator Status (via port-forward or direct)
# ---------------------------------------------------------------------------
section "OPERATOR STATUS"

OPERATOR_URL="${OPERATOR_URL:-http://localhost:18084}"
op_resp=$(curl -s "${OPERATOR_URL}/v1/status" 2>/dev/null || echo "")

if [[ -n "$op_resp" ]]; then
  echo "$op_resp" | python3 -m json.tool 2>/dev/null || echo "$op_resp"
else
  echo "(Operator not reachable at ${OPERATOR_URL})"
  echo "If running in K8s, set up port-forward first:"
  echo "  kubectl -n ${NAMESPACE} port-forward svc/turbo-engine-operator 18084:8084"
fi

# ---------------------------------------------------------------------------
# Section 4: Operator-created resources
# ---------------------------------------------------------------------------
section "OPERATOR-MANAGED RESOURCES"

kubectl get deployments,services,configmaps -n "$NAMESPACE" \
  -l 'app.kubernetes.io/managed-by=turbo-engine-operator' \
  -o wide 2>/dev/null || echo "(no operator-managed resources found)"

# ---------------------------------------------------------------------------
# Section 5: Recent Errors
# ---------------------------------------------------------------------------
section "RECENT ERRORS (from operator logs)"

OPERATOR_DEPLOY="turbo-engine-operator"
errors=$(kubectl logs "deployment/${OPERATOR_DEPLOY}" -n "$NAMESPACE" --tail=100 2>/dev/null \
  | grep -iE '(error|panic|fatal)' \
  | tail -10 || true)

if [[ -n "$errors" ]]; then
  printf "${RED}%s${RESET}\n" "$errors"
else
  printf "${GREEN}No errors found in recent operator logs.${RESET}\n"
fi

# ---------------------------------------------------------------------------
# Section 6: K8s Events (warnings only)
# ---------------------------------------------------------------------------
section "WARNING EVENTS"

warnings=$(kubectl get events -n "$NAMESPACE" --field-selector type=Warning --sort-by='.lastTimestamp' 2>/dev/null | tail -10 || true)

if [[ -n "$warnings" && "$warnings" != *"No resources found"* ]]; then
  echo "$warnings"
else
  printf "${GREEN}No warning events.${RESET}\n"
fi

# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------
section "RECOMMENDATIONS"

if (( HEALTHY == TOTAL && TOTAL > 0 )); then
  echo "All services healthy. You can run the E2E tests:"
  echo "  ./hack/scripts/k8s-e2e-tests.sh"
elif (( TOTAL == 0 )); then
  echo "No deployments found. Deploy the platform first:"
  echo "  kubectl apply -k infra/k8s/overlays/ci"
  echo "  kubectl -n ${NAMESPACE} rollout status deployment --timeout=120s"
else
  echo "Some services are unhealthy. Check pod descriptions:"
  echo "  kubectl describe pods -n ${NAMESPACE}"
  echo ""
  echo "Check events:"
  echo "  kubectl get events -n ${NAMESPACE} --sort-by=.lastTimestamp"
fi

echo ""
