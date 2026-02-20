# Plan: Kubernetes E2E Testing in GitHub Actions

## Problem Statement

The existing E2E workflow (`.github/workflows/e2e.yml`) uses Docker Compose. It validates HTTP-level service communication but doesn't run in a real Kubernetes cluster. The operator currently runs in "dev mode" — it computes reconciliation actions and logs them but never calls the Kubernetes API. There is no test that proves the operator can spin up real K8s workloads driven by input packages.

Docker Compose will never be the complete system. The K8s E2E test is the authoritative integration test — it replaces, not supplements, the Docker Compose approach as the primary confidence signal.

**Goal:** A GitHub Actions workflow that deploys the full platform (control plane + telemetry) into a real K8s cluster, publishes packages, and verifies the operator creates the expected Kubernetes resources. All logs, traces, screenshots, and resource state are captured as artifacts for both autonomous agents and humans to consume.

## Lessons Learned from Docker Compose E2E

Getting Docker Compose E2E working in CI surfaced issues that apply directly:

1. **`.dockerignore` files are critical** — all services now have them
2. **Build images one-at-a-time** with `--progress=plain` (avoids OOM on GHA runners)
3. **Gateway Rust build needs system deps** — `pkg-config libssl-dev protobuf-compiler` in Dockerfile
4. **Verify images exist** before loading into kind
5. **Gateway starts with empty routing table** when `CONFIG_URL` is unset (required for K8s boot)
6. **PR comment upsert pattern** — marker comment + `gh api` for idempotent updates
7. **`permissions: { contents: read, pull-requests: write }`** required for PR comments
8. **`::warning` annotations** surface key diagnostics without downloading artifacts

## Architecture

```
┌─ GitHub Actions Runner ────────────────────────────────────────┐
│                                                                 │
│  1. Build Docker images (one-at-a-time, --progress=plain)       │
│  2. Create kind cluster                                         │
│  3. Load images into kind + verify                              │
│                                                                 │
│  ┌─ kind cluster (turbo-engine-e2e namespace) ───────────────┐  │
│  │                                                            │  │
│  │  Telemetry:                                                │  │
│  │  ┌──────────────────┐ ┌────────┐                           │  │
│  │  │  OTEL Collector  │→│ Jaeger │                           │  │
│  │  │     :4317        │ │ :16686 │                           │  │
│  │  └──────────────────┘ └────────┘                           │  │
│  │                                                            │  │
│  │  Control Plane:                                            │  │
│  │  ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌────────────┐   │  │
│  │  │ Registry │ │ Builder │ │ EnvManager │ │  Operator  │   │  │
│  │  │  :8081   │ │  :8082  │ │   :8083    │ │   :8084    │   │  │
│  │  └──────────┘ └─────────┘ └────────────┘ └──────┬─────┘   │  │
│  │                                                  │         │  │
│  │  API Services (created by operator):             │         │  │
│  │  ┌─────────────────┐ ┌──────────────────┐  ◄────┘         │  │
│  │  │ deploy-users    │ │ deploy-products  │ ...             │  │
│  │  │ svc-users       │ │ svc-products     │                 │  │
│  │  │ cm-users        │ │ cm-products      │                 │  │
│  │  └─────────────────┘ └──────────────────┘                 │  │
│  │                                                            │  │
│  │  UI:                                                       │  │
│  │  ┌─────────┐                                               │  │
│  │  │ Console │ (:3000)                                       │  │
│  │  └─────────┘                                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  4. Port-forward services                                       │
│  5. Run k8s-e2e-tests.sh                                        │
│  6. Capture traces, screenshots, logs → ci-report/              │
│  7. Generate REPORT.md                                          │
│  8. Upload artifacts + post PR comment                          │
└─────────────────────────────────────────────────────────────────┘
```

## Artifact Map

| Artifact | Path | Audience | Format |
|---|---|---|---|
| **REPORT.md** | `ci-report/REPORT.md` | Agent (primary), Human (deep dive) | Markdown |
| **Test results** | `ci-report/k8s-e2e-results.json` | Agent (machine parse) | JSON |
| **Operator actions** | `ci-report/k8s/operator-actions.json` | Agent (what was reconciled) | JSON |
| **Resource state** | `ci-report/k8s/resources.json` | Agent (full K8s state) | JSON |
| **Resource table** | `ci-report/k8s/resources.txt` | Human (quick glance) | Plain text |
| **Pod logs** | `ci-report/k8s/logs-*.txt` | Agent (error investigation) | Plain text |
| **K8s events** | `ci-report/k8s/events.txt` | Both | Plain text |
| **APIGraph CRs** | `ci-report/k8s/apigraphs.yaml` | Both | YAML |
| **Traces** | `ci-report/traces.json` | Agent (cross-service debugging) | JSON |
| **Screenshots** | `ci-report/screenshots/*.png` | Human (visual check) | PNG |
| **Timeline** | `ci-report/k8s/timeline.txt` | Both (what happened when) | Plain text |
| **PR comment** | (on PR) | Human (spot check) | Markdown |
| **Step summary** | (on workflow) | Human (spot check) | Markdown |

## Implementation Plan

### Phase 1: K8s manifests for all services + telemetry

**New files:**

- `infra/k8s/base/registry-deployment.yaml` — Deployment + Service (port 8081)
- `infra/k8s/base/builder-deployment.yaml` — Deployment + Service (port 8082), `REGISTRY_URL=http://registry:8081`
- `infra/k8s/base/envmanager-deployment.yaml` — Deployment + Service (port 8083), `REGISTRY_URL`, `BUILDER_URL`
- `infra/k8s/base/gateway-deployment.yaml` — Deployment + Service (port 8080), no `CONFIG_URL`
- `infra/k8s/base/console-deployment.yaml` — Deployment + Service (port 3000), `VITE_*` env vars
- `infra/k8s/base/otel-collector.yaml` — Deployment + Service + ConfigMap (ports 4317, 4318)
- `infra/k8s/base/jaeger.yaml` — Deployment + Service (port 16686), in-memory storage

**Updated files:**

- `infra/k8s/base/kustomization.yaml` — add all new resources
- `infra/k8s/base/operator-deployment.yaml` — add `BUILDER_URL=http://builder:8082`

All control plane services follow the operator pattern: Deployment with `/healthz` probes, Service with ClusterIP. OTEL env vars point to `http://otel-collector:4317`.

### Phase 2: K8s applier in the operator

The operator computes actions but only logs them. We need a real K8s applier.

**New files:**

- `services/operator/internal/applier/applier.go` — `Applier` interface + K8s implementation using `client-go`
- `services/operator/internal/applier/noop.go` — No-op implementation (dev mode)
- `services/operator/internal/applier/applier_test.go` — Tests with `fake.NewSimpleClientset()`

**Updated files:**

- `services/operator/cmd/operator/main.go` — `OPERATOR_MODE` env var (`dev`|`k8s`)
- `services/operator/internal/reconciler/reconciler.go` — accept `Applier` interface
- `services/operator/go.mod` — add `k8s.io/client-go`, `k8s.io/apimachinery`, `k8s.io/api`

Created resources get labels `turboengine.io/environment`, `turboengine.io/component`, `app.kubernetes.io/managed-by=turbo-engine-operator`. Container image is `registry.k8s.io/pause:3.9` (stub).

### Phase 3: CI kustomize overlay

**New file:** `infra/k8s/overlays/ci/kustomization.yaml`

- Namespace: `turbo-engine-e2e`
- `imagePullPolicy: Never` (images pre-loaded into kind)
- Image tags: `turbo-engine/<service>:e2e`
- Operator: `OPERATOR_MODE=k8s`, `POLL_INTERVAL=5s`, `LOG_LEVEL=debug`
- All services: `LOG_LEVEL=debug`
- Reduced resources (50m/200m CPU, 64Mi/256Mi memory)

### Phase 4: E2E test script + debug collector + report generator

**New files:**

- `hack/scripts/k8s-e2e-tests.sh` — Main test harness:
  1. Wait for control plane rollout
  2. Port-forward registry, builder, envmanager, operator, jaeger, console
  3. Publish package → create environment → trigger build
  4. Wait for operator reconciliation (poll `/v1/status`)
  5. Verify K8s resources exist (`kubectl get deployment/svc/cm`)
  6. Verify pod running (`kubectl wait --for=condition=available`)
  7. Test update flow (publish v2, verify deployment updated)
  8. Write `k8s-e2e-results.json` + `timeline.txt`

- `hack/scripts/k8s-collect-debug.sh` — Debug data collector (always runs):
  - `kubectl get all -o json` → `resources.json` + `resources.txt`
  - `kubectl describe pods` → `pod-descriptions.txt`
  - `kubectl get apigraphs -o yaml` → `apigraphs.yaml`
  - `kubectl logs` per pod → `logs-<service>.txt`
  - `kubectl get events --sort-by=.lastTimestamp` → `events.txt`
  - Operator log parsing → `operator-actions.json`
  - Emit `::warning` annotations for key diagnostics

- `hack/scripts/k8s-dump-report.sh` — Generates `ci-report/REPORT.md`:
  1. Timeline (waterfall of what happened when)
  2. Pod status table
  3. Test results table
  4. Operator reconciliation actions
  5. APIGraph CR status
  6. Trace summary (from Jaeger API)
  7. Screenshot list
  8. Per-service logs (last 200 lines)
  9. Extracted errors/warnings

- `hack/claude/k8s-investigate.sh` — Interactive version for agent use:
  - Pod health, recent errors, operator status, APIGraph state
  - Structured text to stdout (same format as existing `investigate.sh`)

### Phase 5: GitHub Actions workflow

**New file:** `.github/workflows/k8s-e2e.yml`

See workflow in the Architecture section. Key steps:
- Build images one-at-a-time
- Create kind cluster via `helm/kind-action@v1`
- Load images, deploy with kustomize
- Run tests, capture traces/screenshots/debug
- Generate REPORT.md
- Upload artifacts (14 day retention)
- Post PR comment with upsert pattern

### Phase 6: Taskfile integration

**Updated:** `Taskfile.yml` — add `k8s:e2e`, `k8s:e2e:cleanup`, `k8s:investigate` tasks

## Key Design Decisions

1. **K8s-only, not dual** — Docker Compose E2E remains for fast iteration but the K8s test is the confidence signal
2. **Telemetry in-cluster** — OTEL collector + Jaeger deployed in kind; traces captured via API
3. **`REPORT.md` is the primary agent interface** — single file with the complete story
4. **Stub containers** — `registry.k8s.io/pause:3.9` for operator-created API services
5. **Port-forwarding** — no NodePort/Ingress complexity in kind
6. **`imagePullPolicy: Never`** — critical for kind pre-loaded images
7. **`OPERATOR_MODE` env var** — `dev` (default, noop) vs `k8s` (real client-go)
