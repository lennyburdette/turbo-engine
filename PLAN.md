# Plan: Kubernetes E2E Testing in GitHub Actions

## Problem Statement

The existing E2E workflow (`.github/workflows/e2e.yml`) uses Docker Compose. It validates that services talk to each other over HTTP but never runs in a real Kubernetes cluster. The operator currently runs in "dev mode" — it computes reconciliation actions (Create Deployment, Create Service, etc.) and logs them, but never calls the Kubernetes API. There is no test that proves the operator can actually spin up API service workloads driven by input packages inside a real cluster.

**Goal:** A GitHub Actions workflow that deploys the full platform into a real K8s cluster, publishes example packages, and verifies that the operator creates the expected Kubernetes resources (Deployments, Services, ConfigMaps) for both the control plane and the API services derived from those packages.

## Lessons Learned from Docker Compose E2E (PRs #1, #2)

Getting the Docker Compose E2E to build and run in CI was non-trivial. The following hard-won lessons **must** inform the K8s E2E design:

### Build issues encountered & resolved

1. **`.dockerignore` files were missing** — Every service now has a `.dockerignore` (registry, builder, operator, envmanager, gateway, console, explorer). Without them, Docker contexts included `target/`, `.git`, etc., causing slow or broken builds. The K8s workflow must use these same Dockerfiles.

2. **Gateway Rust build needs system deps** — The gateway Dockerfile now uses `rust:1.93-slim` and installs `pkg-config libssl-dev protobuf-compiler` at build time. The Build workflow also needed `sudo apt-get install -y pkg-config libssl-dev` for the native Rust build step. Kind images must be built from the same Dockerfiles (not native binaries).

3. **Build images one-at-a-time, not in parallel** — The E2E workflow builds each compose service individually with `--progress=plain` rather than using `docker compose build` (which can OOM on GitHub runners). The K8s workflow should do the same.

4. **Verify images exist before starting** — The E2E workflow has a "Verify images" step that lists `docker images` and `docker compose config --images`. This catches tag mismatches before containers fail to start. The K8s workflow should verify images are loaded into kind.

5. **Pull infra images separately** — `docker compose pull --ignore-buildable` pulls third-party images (otel-collector, jaeger, prometheus) without trying to pull the locally-built ones. Kind doesn't need these infra images (no observability stack in CI).

### Service code fixes

6. **Registry Dockerfile rework** — Changed from `golang:1.23-alpine` builder with workdir `/app` to workdir `/src` and explicit `GOARCH=amd64`. Added `HEALTHCHECK` directive in the Dockerfile itself. The K8s liveness/readiness probes should use the same `/healthz` endpoint.

7. **Gateway graceful startup** — The gateway now starts with an empty routing table if `CONFIG_URL` is unset (instead of failing). This is critical for K8s: the gateway pod must pass health checks even before config is loaded.

8. **EnvManager/Registry service fixes** — Minor `main.go` fixes to ensure clean startup. These are already on main.

### CI/debugging patterns established

9. **Structured diagnostics on failure** — The E2E workflow captures container status, port connectivity, and per-service logs into `ci-report/diagnostics.txt` and emits `::warning` annotations. The K8s workflow should replicate this with `kubectl` equivalents.

10. **PR comment bot** — E2E results are posted as a PR comment using `gh pr comment` with an upsert pattern (marker comment `<!-- turbo-engine-e2e-bot -->`). The K8s workflow should post its own comment (separate marker: `<!-- turbo-engine-k8s-e2e-bot -->`).

11. **`turbo-gh` debugging tool** — `hack/claude/turbo-gh` provides `runs`, `jobs`, `logs`, `annotations`, `status`, `watch` commands for querying GitHub Actions API. Useful for iterating on CI without the web UI.

12. **Permissions block required** — The E2E workflow needs `permissions: { contents: read, pull-requests: write }` for the PR comment step. The K8s workflow needs the same.

## Current State

| What exists | What's missing |
|---|---|
| Working Docker Compose E2E with PR comments (`.github/workflows/e2e.yml`) | K8s-specific E2E workflow |
| APIGraph CRD (`infra/k8s/base/apigraph-crd.yaml`) | K8s manifests for registry, builder, envmanager, gateway |
| Operator K8s deployment + RBAC (`infra/k8s/base/operator-deployment.yaml`) | Operator code to actually call `client-go` to create resources |
| Docker images that build successfully in CI (all `.dockerignore` files, Dockerfile fixes) | Loading those images into a kind cluster |
| Smoke test script with JSON output (`hack/scripts/run-smoke-tests.sh`) | Test script that verifies K8s resources exist after reconciliation |
| Dev kustomize overlay (`infra/k8s/overlays/dev/`) | CI kustomize overlay tuned for kind |
| PR comment bot pattern + `turbo-gh` debugging tool | K8s-specific debug collection script |

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
│  │  Control Plane (static K8s manifests):                     │  │
│  │  ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌────────────┐   │  │
│  │  │ Registry │ │ Builder │ │ EnvManager │ │  Operator  │   │  │
│  │  │  :8081   │ │  :8082  │ │   :8083    │ │   :8084    │   │  │
│  │  └──────────┘ └─────────┘ └────────────┘ └────────────┘   │  │
│  │                                                            │  │
│  │  API Services (created by operator after reconciliation):  │  │
│  │  ┌─────────────────┐ ┌──────────────────┐                 │  │
│  │  │ deploy-users    │ │ deploy-products  │ ...             │  │
│  │  │ svc-users       │ │ svc-products     │                 │  │
│  │  │ cm-users        │ │ cm-products      │                 │  │
│  │  └─────────────────┘ └──────────────────┘                 │  │
│  │                                                            │  │
│  │  APIGraph CRD instances (created by test harness)          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│  4. Port-forward control plane services                         │
│  5. Run k8s-e2e-tests.sh (publish, build, verify resources)    │
│  6. Collect logs, resource dumps, events → ci-report/k8s/      │
│  7. Upload artifacts + post PR comment                          │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: K8s manifests for all control plane services

**Files to create:**

- `infra/k8s/base/registry-deployment.yaml` — Deployment + Service for registry (port 8081)
  - Uses `turbo-engine/registry:latest` image (overridden by kustomize in CI)
  - Health check: `wget --spider http://localhost:8081/healthz` (matches Dockerfile HEALTHCHECK)
  - Env: `PORT=8081`, `LOG_LEVEL=info`, `LOG_FORMAT=json`

- `infra/k8s/base/builder-deployment.yaml` — Deployment + Service for builder (port 8082)
  - Env: `REGISTRY_URL=http://registry:8081` (K8s Service DNS)

- `infra/k8s/base/envmanager-deployment.yaml` — Deployment + Service for envmanager (port 8083)
  - Env: `REGISTRY_URL=http://registry:8081`, `BUILDER_URL=http://builder:8082`

- `infra/k8s/base/gateway-deployment.yaml` — Deployment + Service for gateway (port 8080)
  - No `CONFIG_URL` needed — gateway starts with empty routing table (confirmed working in main)
  - Env: `PORT=8080`, `RUST_LOG=info`

Each manifest follows the pattern established in `operator-deployment.yaml`: Deployment with liveness/readiness probes on `/healthz`, Service with ClusterIP. No ServiceAccounts or RBAC needed for these (only the operator needs cluster-level permissions).

**Files to update:**

- `infra/k8s/base/kustomization.yaml` — Add the four new resource files
- `infra/k8s/base/operator-deployment.yaml` — Add `BUILDER_URL=http://builder:8082` env var so the operator can poll the builder inside the cluster

### Phase 2: Add K8s applier to the operator

The operator currently computes actions and logs them (`applyActions` at `reconciler.go:286` just calls `logger.InfoContext`). We need a real K8s applier so that when reconciliation says "Create Deployment deploy-users", it actually calls `client-go` to create a Deployment object in the cluster.

**Files to create:**

- `services/operator/internal/applier/applier.go` — Interface + K8s implementation
  ```go
  type Applier interface {
      Apply(ctx context.Context, environmentID string, actions []reconciler.Action, spec model.APIGraphSpec) error
  }
  ```
  The K8s implementation uses `client-go` typed clients to create/update/delete Deployments, Services, ConfigMaps based on the action list. Each created resource gets:
  - Labels: `turboengine.io/environment`, `turboengine.io/component`, `app.kubernetes.io/managed-by=turbo-engine-operator`
  - Container image: `registry.k8s.io/pause:3.9` (placeholder — the artifact hash isn't a real image)
  - ConfigMap with the component's env vars
  - Service with ClusterIP pointing at the Deployment's pod selector

- `services/operator/internal/applier/noop.go` — No-op implementation (current log-only behavior, for dev mode)
- `services/operator/internal/applier/applier_test.go` — Unit tests using `fake.NewSimpleClientset()`

**Files to update:**

- `services/operator/cmd/operator/main.go` — Add `OPERATOR_MODE` env var (read via existing `getEnv` helper). When `k8s`, create a real K8s applier using `rest.InClusterConfig()`. When `dev` (default), use the noop applier. Pass the applier to the reconciler.
- `services/operator/internal/reconciler/reconciler.go` — Accept an `Applier` interface in `New()`, call `applier.Apply()` after computing actions instead of the current `applyActions` log-only method. Keep `applyActions` logging as a trace/debug concern.
- `services/operator/go.mod` — Add `k8s.io/client-go`, `k8s.io/apimachinery`, `k8s.io/api` dependencies.

### Phase 3: Kustomize overlay for CI / kind

**Files to create:**

- `infra/k8s/overlays/ci/kustomization.yaml` — CI-specific overlay:
  - Namespace: `turbo-engine-e2e`
  - Reduced resource limits (same as dev overlay: 50m/200m CPU, 64Mi/256Mi memory)
  - Operator gets: `OPERATOR_MODE=k8s`, `POLL_INTERVAL=5s`, `LOG_LEVEL=debug`
  - All other services get: `LOG_LEVEL=debug`
  - Image names overridden to `turbo-engine/<service>:e2e` tags (what we load into kind)
  - `imagePullPolicy: Never` on all containers (images are pre-loaded into kind, not pulled from a registry)
  - OTEL endpoint set to a dummy value or removed (no collector in CI)

### Phase 4: E2E test script for Kubernetes

**Files to create:**

- `hack/scripts/k8s-e2e-tests.sh` — The main test harness. Uses the same `record_result` JSON pattern as `run-smoke-tests.sh` for consistency. Steps:

  1. **Wait for control plane pods** — `kubectl rollout status deployment` for registry, builder, envmanager, operator (timeout 120s)
  2. **Port-forward services** — Start background port-forwards for registry (8081), builder (8082), envmanager (8083), operator (8084). Trap EXIT to clean up.
  3. **Run publish flow** — Same HTTP calls as the existing smoke tests: publish `smoke-test-pkg` to registry, create environment via envmanager, trigger build via builder
  4. **Wait for operator reconciliation** — Poll the operator's `/v1/status` endpoint until the environment shows phase=Running (or timeout at 120s). The operator polls the builder every 5s in CI, so this should converge quickly.
  5. **Verify K8s resources exist** — Use `kubectl get` to check that the operator actually created:
     - `kubectl get deployment deploy-smoke-test-pkg -n turbo-engine-e2e`
     - `kubectl get service svc-smoke-test-pkg -n turbo-engine-e2e`
     - `kubectl get configmap cm-smoke-test-pkg -n turbo-engine-e2e`
     Verify labels include `turboengine.io/environment` and `turboengine.io/component`.
  6. **Verify pod is running** — `kubectl wait --for=condition=available deployment/deploy-smoke-test-pkg --timeout=60s`
  7. **Test update flow** — Publish a v2 of the package with a different schema (changes artifact hash), trigger a new build, wait for reconciliation, verify the Deployment was updated (check annotation or generation).
  8. **Write JSON results** — Output to `ci-report/k8s-e2e-results.json` in the same format as `smoke-results.json`

- `hack/scripts/k8s-collect-debug.sh` — Debug data collector (run with `if: always()`):
  - `kubectl get all -n turbo-engine-e2e -o wide` → `ci-report/k8s/resources.txt`
  - `kubectl describe pods -n turbo-engine-e2e` → `ci-report/k8s/pod-descriptions.txt`
  - `kubectl get apigraphs -n turbo-engine-e2e -o yaml` → `ci-report/k8s/apigraphs.yaml`
  - `kubectl logs -n turbo-engine-e2e -l app.kubernetes.io/name=<svc> --tail=500` for each service → `ci-report/k8s/logs-<service>.txt`
  - `kubectl get events -n turbo-engine-e2e --sort-by=.lastTimestamp` → `ci-report/k8s/events.txt`
  - Port connectivity check (same pattern as Docker Compose diagnostics from e2e.yml)
  - Emit `::warning` annotations for key diagnostics (same pattern as existing E2E workflow)

### Phase 5: GitHub Actions workflow

**Files to create:**

- `.github/workflows/k8s-e2e.yml`:

```yaml
name: K8s E2E

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: k8s-e2e-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  k8s-e2e:
    name: Kubernetes end-to-end tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      # Build images one-at-a-time with progress output (lesson from PR #1)
      - name: Build Go service images
        run: |
          docker build --progress=plain -t turbo-engine/registry:e2e services/registry
          docker build --progress=plain -t turbo-engine/builder:e2e services/builder
          docker build --progress=plain -t turbo-engine/operator:e2e services/operator
          docker build --progress=plain -t turbo-engine/envmanager:e2e services/envmanager

      - name: Build gateway image
        run: docker build --progress=plain -t turbo-engine/gateway:e2e services/gateway

      # Verify images before proceeding (lesson from PR #1)
      - name: Verify images
        run: |
          IMAGES=$(docker images 'turbo-engine/*' --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}")
          echo "$IMAGES"
          echo "::warning title=Docker Images::${IMAGES//$'\n'/%0A}"
          for svc in registry builder operator envmanager gateway; do
            docker image inspect "turbo-engine/${svc}:e2e" > /dev/null 2>&1 || {
              echo "::error::Missing image turbo-engine/${svc}:e2e"
              exit 1
            }
          done

      # Create kind cluster
      - name: Create kind cluster
        uses: helm/kind-action@v1
        with:
          cluster_name: turbo-engine-e2e

      # Load images into kind
      - name: Load images into kind
        run: |
          for svc in registry builder envmanager operator gateway; do
            echo "Loading turbo-engine/${svc}:e2e..."
            kind load docker-image "turbo-engine/${svc}:e2e" --name turbo-engine-e2e
          done

      # Deploy CRD + control plane
      - name: Deploy platform to kind
        run: |
          kubectl create namespace turbo-engine-e2e || true
          kubectl apply -k infra/k8s/overlays/ci
          echo "Waiting for deployments to roll out..."
          kubectl -n turbo-engine-e2e rollout status deployment --timeout=180s

      # Diagnostics if deployment fails (mirrors Docker Compose pattern)
      - name: Deployment diagnostics
        if: failure()
        run: |
          DIAG_FILE="${GITHUB_WORKSPACE}/ci-report/k8s-diagnostics.txt"
          mkdir -p "${GITHUB_WORKSPACE}/ci-report/k8s"

          echo "=== POD STATUS ===" | tee "$DIAG_FILE"
          kubectl get pods -n turbo-engine-e2e -o wide 2>&1 | tee -a "$DIAG_FILE"
          echo "" | tee -a "$DIAG_FILE"

          echo "=== EVENTS ===" | tee -a "$DIAG_FILE"
          kubectl get events -n turbo-engine-e2e --sort-by=.lastTimestamp 2>&1 | tee -a "$DIAG_FILE"
          echo "" | tee -a "$DIAG_FILE"

          echo "=== DESCRIBE FAILING PODS ===" | tee -a "$DIAG_FILE"
          kubectl describe pods -n turbo-engine-e2e 2>&1 | tee -a "$DIAG_FILE"

          # Emit key diagnostics as annotations
          POD_STATUS=$(kubectl get pods -n turbo-engine-e2e -o wide 2>&1 | head -15)
          echo "::warning title=K8s Pod Status::${POD_STATUS//$'\n'/%0A}"

      # Run e2e tests
      - name: Run K8s E2E tests
        run: ./hack/scripts/k8s-e2e-tests.sh

      # Always collect debug info
      - name: Collect debug info
        if: always()
        run: ./hack/scripts/k8s-collect-debug.sh

      # Upload artifacts
      - name: Upload debug artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: k8s-e2e-report
          path: ci-report/
          retention-days: 14

      # Build summary + PR comment (same pattern as Docker Compose E2E)
      - name: Build K8s E2E summary
        id: summary
        if: always()
        run: |
          SUMMARY_FILE=$(mktemp)

          if [ -f ci-report/k8s-e2e-results.json ]; then
            total=$(grep -o '"total":\s*[0-9]*' ci-report/k8s-e2e-results.json | grep -o '[0-9]*' || echo "?")
            passed=$(grep -o '"passed":\s*[0-9]*' ci-report/k8s-e2e-results.json | grep -o '[0-9]*' || echo "?")
            failed=$(grep -o '"failed":\s*[0-9]*' ci-report/k8s-e2e-results.json | grep -o '[0-9]*' || echo "?")

            if [ "$failed" = "0" ]; then
              echo "### K8s E2E Tests: All ${total} passed" >> "$SUMMARY_FILE"
            else
              echo "### K8s E2E Tests: ${failed} failed (${passed}/${total} passed)" >> "$SUMMARY_FILE"
            fi

            echo "" >> "$SUMMARY_FILE"
            echo "| Test | Status | Detail | Duration |" >> "$SUMMARY_FILE"
            echo "|------|--------|--------|----------|" >> "$SUMMARY_FILE"

            while IFS= read -r line; do
              name=$(echo "$line" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
              status=$(echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
              detail=$(echo "$line" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4)
              duration=$(echo "$line" | grep -o '"duration_ms":[0-9]*' | cut -d: -f2)
              if [ -n "$name" ]; then
                icon="PASS"
                [ "$status" = "fail" ] && icon="FAIL"
                echo "| \`${name}\` | ${icon} | ${detail} | ${duration:-0}ms |" >> "$SUMMARY_FILE"
              fi
            done < <(grep -o '{[^}]*}' ci-report/k8s-e2e-results.json | grep '"name"')
          else
            echo "### K8s E2E Tests: No results" >> "$SUMMARY_FILE"
            echo "Tests may not have run. Check deployment diagnostics." >> "$SUMMARY_FILE"
          fi

          # K8s resource state
          if [ -f ci-report/k8s/resources.txt ]; then
            echo "" >> "$SUMMARY_FILE"
            echo "<details><summary>K8s resource state</summary>" >> "$SUMMARY_FILE"
            echo "" >> "$SUMMARY_FILE"
            echo '```' >> "$SUMMARY_FILE"
            cat ci-report/k8s/resources.txt >> "$SUMMARY_FILE"
            echo '```' >> "$SUMMARY_FILE"
            echo "</details>" >> "$SUMMARY_FILE"
          fi

          echo "" >> "$SUMMARY_FILE"
          echo "Full debug output in the [**k8s-e2e-report** artifact](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})." >> "$SUMMARY_FILE"

          cat "$SUMMARY_FILE" >> "$GITHUB_STEP_SUMMARY"
          echo "file=${SUMMARY_FILE}" >> "$GITHUB_OUTPUT"

      - name: Comment on PR
        if: always() && github.event_name == 'pull_request'
        env:
          GH_TOKEN: ${{ github.token }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          REPO: ${{ github.repository }}
        run: |
          SUMMARY_FILE="${{ steps.summary.outputs.file }}"
          if [ ! -f "$SUMMARY_FILE" ]; then exit 0; fi

          MARKER="<!-- turbo-engine-k8s-e2e-bot -->"
          {
            echo "$MARKER"
            cat "$SUMMARY_FILE"
            echo ""
            echo "---"
            echo "*Posted by the K8s E2E workflow — [view run](${RUN_URL})*"
          } > /tmp/pr-comment-body.txt

          EXISTING_COMMENT_ID=$(gh api \
            "repos/${REPO}/issues/${PR_NUMBER}/comments" \
            --paginate --jq ".[] | select(.body | startswith(\"${MARKER}\")) | .id" \
            | head -1 || true)

          if [ -n "$EXISTING_COMMENT_ID" ]; then
            gh api "repos/${REPO}/issues/comments/${EXISTING_COMMENT_ID}" \
              -X PATCH -F body=@/tmp/pr-comment-body.txt
          else
            gh pr comment "$PR_NUMBER" --body-file /tmp/pr-comment-body.txt
          fi

      # Teardown
      - name: Delete kind cluster
        if: always()
        run: kind delete cluster --name turbo-engine-e2e
```

### Phase 6: Taskfile integration

**Files to update:**

- `Taskfile.yml` — Add tasks:
  ```yaml
  k8s:e2e:
    desc: Run K8s E2E tests locally (requires kind and kubectl)
    cmds:
      - kind create cluster --name turbo-engine-e2e || true
      - |
        for svc in registry builder envmanager operator gateway; do
          docker build --progress=plain -t turbo-engine/${svc}:e2e services/${svc} &&
          kind load docker-image turbo-engine/${svc}:e2e --name turbo-engine-e2e
        done
      - kubectl create namespace turbo-engine-e2e || true
      - kubectl apply -k infra/k8s/overlays/ci
      - kubectl -n turbo-engine-e2e rollout status deployment --timeout=180s
      - hack/scripts/k8s-e2e-tests.sh
      - hack/scripts/k8s-collect-debug.sh

  k8s:e2e:cleanup:
    desc: Tear down the kind cluster used for e2e tests
    cmds:
      - kind delete cluster --name turbo-engine-e2e
  ```

## Debugging & Observability

The following outputs are available from every run:

| Artifact | Path | Contents |
|---|---|---|
| Test results JSON | `ci-report/k8s-e2e-results.json` | Pass/fail for each test step with durations |
| All resources | `ci-report/k8s/resources.txt` | `kubectl get all -o wide` |
| Pod descriptions | `ci-report/k8s/pod-descriptions.txt` | `kubectl describe pods` (shows events, restart reasons, image pull errors) |
| APIGraph CRs | `ci-report/k8s/apigraphs.yaml` | Full YAML of all APIGraph custom resources |
| Control plane logs | `ci-report/k8s/logs-<service>.txt` | Last 500 lines per service pod |
| K8s events | `ci-report/k8s/events.txt` | Cluster events sorted by time |
| Operator actions log | `ci-report/k8s/logs-operator.txt` | Shows every reconciliation action + K8s API calls |
| Deployment diagnostics | `ci-report/k8s-diagnostics.txt` | Captured on failure: pod status, events, describe output |

All artifacts are uploaded to GitHub Actions and retained for 14 days. The step summary and PR comment include a pass/fail table plus a collapsible K8s resource state dump. The `turbo-gh` tool (`hack/claude/turbo-gh`) can query run status, job details, and annotations from the CLI.

## Execution Order

1. **Phase 1** — K8s manifests for control plane services (new YAML files)
2. **Phase 2** — K8s applier in the operator (Go code changes + new deps)
3. **Phase 3** — CI kustomize overlay
4. **Phase 4** — E2E test script + debug collector
5. **Phase 5** — GitHub Actions workflow
6. **Phase 6** — Taskfile integration for local runs

Phases 1 and 2 can be developed in parallel. Phase 3 depends on Phase 1. Phases 4-5 depend on all prior phases.

## Key Design Decisions

1. **kind over k3s/minikube** — kind is the standard for GitHub Actions K8s testing. It's fast, well-supported, and the `helm/kind-action` action handles setup/teardown. No Docker-in-Docker complexity.

2. **Build from existing Dockerfiles** — Use the same `services/*/Dockerfile` files that the Docker Compose E2E uses. These are already proven to build in CI (PR #1 fixed all the build issues). Just tag as `:e2e` instead of `:latest` and load into kind.

3. **Stub containers for API services** — The operator creates Deployments for API services (subgraphs, REST APIs, etc.), but these aren't real running services. We use `registry.k8s.io/pause:3.9` as the container image. The test verifies the *resources exist with correct metadata*, not that they serve traffic. This is intentional: the operator's job is resource lifecycle, not application behavior.

4. **Port-forwarding over NodePort/Ingress** — For the test harness to talk to control plane services inside kind, we use `kubectl port-forward`. This avoids needing to configure NodePorts or an ingress controller in the kind cluster.

5. **Separate workflow file** — The K8s E2E test is in `.github/workflows/k8s-e2e.yml`, separate from the Docker Compose `e2e.yml`. Both serve different purposes: Docker Compose E2E is faster and tests the HTTP/service-mesh flow; K8s E2E tests real cluster resource lifecycle. Both post separate PR comments with distinct markers.

6. **`OPERATOR_MODE` env var** — Switches between `dev` (noop applier, current behavior) and `k8s` (real client-go applier). Default is `dev` so all existing Docker Compose and local dev workflows are unchanged.

7. **`imagePullPolicy: Never`** — Critical for kind. Images are pre-loaded via `kind load docker-image`, so pods must not try to pull from a registry. The CI kustomize overlay patches this on all containers.

8. **No observability stack in K8s** — Unlike Docker Compose (which runs otel-collector + jaeger + prometheus), the K8s E2E skips observability infrastructure. This reduces complexity and startup time. Operator debug logs captured via `kubectl logs` are sufficient for CI debugging.
