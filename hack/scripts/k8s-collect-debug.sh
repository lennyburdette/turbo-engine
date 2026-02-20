#!/usr/bin/env bash
# k8s-collect-debug.sh — Collects debug artifacts from the K8s cluster.
# Designed to run with `if: always()` in CI so we always get diagnostics.
#
# Output:
#   ci-report/k8s/resources.json    — kubectl get all -o json
#   ci-report/k8s/resources.txt     — kubectl get all -o wide (human-readable)
#   ci-report/k8s/pod-descriptions.txt
#   ci-report/k8s/apigraphs.yaml
#   ci-report/k8s/logs-<service>.txt
#   ci-report/k8s/events.txt
#   ci-report/k8s/operator-actions.json
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
REPORT_DIR="${ROOT_DIR}/ci-report/k8s"
NAMESPACE="${K8S_NAMESPACE:-turbo-engine-e2e}"
LOG_TAIL=500

mkdir -p "${REPORT_DIR}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

info()  { printf "${CYAN}[INFO]${RESET}  %s\n" "$*"; }
ok()    { printf "${GREEN}[OK]${RESET}    %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${RESET}  %s\n" "$*"; }

# ---------------------------------------------------------------------------
# Resource state
# ---------------------------------------------------------------------------
info "Collecting resource state..."

kubectl get all -n "$NAMESPACE" -o wide > "${REPORT_DIR}/resources.txt" 2>&1 || true
kubectl get all -n "$NAMESPACE" -o json > "${REPORT_DIR}/resources.json" 2>&1 || true
ok "Resources → resources.txt / resources.json"

# ---------------------------------------------------------------------------
# Pod descriptions (includes events, restart reasons, image pull errors)
# ---------------------------------------------------------------------------
info "Collecting pod descriptions..."
kubectl describe pods -n "$NAMESPACE" > "${REPORT_DIR}/pod-descriptions.txt" 2>&1 || true
ok "Pod descriptions → pod-descriptions.txt"

# ---------------------------------------------------------------------------
# APIGraph CRDs
# ---------------------------------------------------------------------------
info "Collecting APIGraph CRs..."
kubectl get apigraphs -n "$NAMESPACE" -o yaml > "${REPORT_DIR}/apigraphs.yaml" 2>&1 || \
  echo "# No APIGraph resources found (CRD may not support listing in this mode)" > "${REPORT_DIR}/apigraphs.yaml"
ok "APIGraphs → apigraphs.yaml"

# ---------------------------------------------------------------------------
# Pod logs (per service)
# ---------------------------------------------------------------------------
info "Collecting pod logs..."

SERVICES=(registry builder envmanager turbo-engine-operator gateway console otel-collector jaeger)

for svc in "${SERVICES[@]}"; do
  LOG_FILE="${REPORT_DIR}/logs-${svc}.txt"

  # Try label-based selection first, then fall back to deployment name
  if kubectl -n "$NAMESPACE" logs "deployment/${svc}" --tail="$LOG_TAIL" --all-containers > "$LOG_FILE" 2>&1; then
    LINES=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
    ok "  ${svc}: ${LINES} lines"
  else
    echo "(no logs available — deployment may not exist)" > "$LOG_FILE"
    warn "  ${svc}: no logs"
  fi
done

# ---------------------------------------------------------------------------
# K8s events (sorted by time)
# ---------------------------------------------------------------------------
info "Collecting K8s events..."
kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' > "${REPORT_DIR}/events.txt" 2>&1 || true
ok "Events → events.txt"

# ---------------------------------------------------------------------------
# Operator actions (parsed from operator logs)
# ---------------------------------------------------------------------------
info "Extracting operator reconciliation actions..."

OPERATOR_LOG="${REPORT_DIR}/logs-turbo-engine-operator.txt"
ACTIONS_FILE="${REPORT_DIR}/operator-actions.json"

if [[ -f "$OPERATOR_LOG" ]]; then
  # Extract JSON log lines that contain reconciliation actions
  python3 -c "
import json, sys

actions = []
for line in open('${OPERATOR_LOG}'):
    line = line.strip()
    if not line:
        continue
    try:
        entry = json.loads(line)
    except (json.JSONDecodeError, ValueError):
        continue
    msg = entry.get('msg', '')
    # Only include entries that are actual resource actions (have an action field)
    # or reconciliation lifecycle events (request received, complete).
    action_val = entry.get('action', entry.get('type', ''))
    is_action = action_val in ('Create', 'Update', 'Delete')
    is_lifecycle = msg in ('reconcile request received', 'reconciliation complete',
                           'starting reconciliation')
    if is_action or is_lifecycle:
        actions.append({
            'time': entry.get('time', ''),
            'msg': msg,
            'environment_id': entry.get('environment_id', ''),
            'action': action_val if is_action else msg,
            'resource_kind': entry.get('resource_kind', entry.get('kind', '')),
            'resource_name': entry.get('resource_name', entry.get('name', '')),
            'details': entry.get('details', ''),
            'phase': entry.get('phase', ''),
        })

json.dump({'actions': actions, 'count': len(actions)}, sys.stdout, indent=2)
print()
" > "${ACTIONS_FILE}" 2>/dev/null || echo '{"actions":[],"count":0}' > "${ACTIONS_FILE}"

  ACTION_COUNT=$(python3 -c "import json; print(json.load(open('${ACTIONS_FILE}'))['count'])" 2>/dev/null || echo 0)
  ok "Operator actions: ${ACTION_COUNT} extracted → operator-actions.json"
else
  echo '{"actions":[],"count":0}' > "${ACTIONS_FILE}"
  warn "No operator logs found"
fi

# ---------------------------------------------------------------------------
# Emit GitHub Actions annotations
# ---------------------------------------------------------------------------
if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  info "Emitting GitHub Actions annotations..."

  # Pod status
  POD_STATUS=$(kubectl get pods -n "$NAMESPACE" -o wide 2>&1 | head -20)
  echo "::warning title=K8s Pod Status::${POD_STATUS//$'\n'/%0A}"

  # Warning events
  WARNING_EVENTS=$(kubectl get events -n "$NAMESPACE" --field-selector type=Warning 2>&1 | head -10)
  if [[ -n "$WARNING_EVENTS" && "$WARNING_EVENTS" != *"No resources found"* ]]; then
    echo "::warning title=K8s Warning Events::${WARNING_EVENTS//$'\n'/%0A}"
  fi

  # Errors from logs
  for svc in turbo-engine-operator registry builder envmanager; do
    LOG_FILE="${REPORT_DIR}/logs-${svc}.txt"
    if [[ -f "$LOG_FILE" ]]; then
      ERRORS=$(grep -i '"level":"ERROR"\|"level":"error"\|panic\|fatal' "$LOG_FILE" | tail -5)
      if [[ -n "$ERRORS" ]]; then
        echo "::warning title=${svc} errors::${ERRORS//$'\n'/%0A}"
      fi
    fi
  done
fi

echo ""
ok "Debug collection complete. Artifacts in: ${REPORT_DIR}/"
ls -la "${REPORT_DIR}/"
