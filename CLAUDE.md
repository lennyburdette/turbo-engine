# Turbo Engine — API Management Platform

## What This Is

A platform for managing APIs end-to-end: upstream services (GraphQL subgraphs, OpenAPI REST APIs), downstream clients (operation collections, Postman collections), orchestration (supergraphs, workflows), and networking (ingress/egress). Packages describe each component; a registry stores them; a builder composes them into artifacts; a Kubernetes operator deploys them; a gateway routes traffic.

Developers can "fork" a dependency tree into an isolated environment (like Netlify preview deploys), test proposed changes, then promote back to the base.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer Interfaces                     │
│  CLI (tools/cli)  │  Console UI (ui/console)  │  Explorer   │
└──────┬────────────┴──────────┬────────────────┴──────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐
│  Registry   │  │   Builder   │  │   Environment Manager    │
│  :8081      │──│   :8082     │──│   :8083                  │
│  (Go)       │  │  (Go)       │  │  (Go)                    │
└─────────────┘  └──────┬──────┘  └──────────┬───────────────┘
                        │                     │
                        ▼                     ▼
              ┌─────────────────┐  ┌─────────────────┐
              │    Operator     │  │     Gateway      │
              │    :8084 (Go)   │  │    :8080 (Rust)  │
              └─────────────────┘  └─────────────────┘
```

## Monorepo Layout

```
specs/                    — Contract-first API definitions (protobuf, OpenAPI, JSON Schema)
  protobuf/               — Domain model and service definitions (source of truth)
  openapi/                — REST transcoding specs for browser/CLI clients
  jsonschema/             — Package manifest schema (what developers author)

services/
  registry/               — Package Registry (Go, :8081)
  builder/                — Build pipeline (Go, :8082)
  envmanager/             — Fork/environment manager (Go, :8083)
  operator/               — K8s operator / reconciler (Go, :8084)
  gateway/                — API gateway / reverse proxy (Rust, :8080)

tools/
  cli/                    — `turbo-engine` CLI (TypeScript)
  sdk-ts/                 — TypeScript SDK (future)
  sdk-go/                 — Go SDK (future)

ui/
  console/                — Management console (React, :3000)
  explorer/               — Mobile exploration UI (React, :3001)

infra/
  docker/                 — Docker Compose for local dev + observability
  k8s/                    — Kubernetes manifests (CRDs, operator deployment)
  ci/                     — CI pipeline configs (future)
  observability/          — Dashboards, alerts (future)

examples/
  petstore/               — REST API example (OpenAPI)
  federation/             — GraphQL federation example (3 subgraphs)

hack/
  scripts/                — CI harness scripts (smoke tests, trace capture, screenshots)
  claude/                 — Scripts designed for Claude Code to run
```

## How to Build and Test

Prerequisites: Go 1.23+, Rust 1.83+, Node 20+, pnpm 9+, Docker, [Task](https://taskfile.dev).

```sh
# Build everything
task build

# Test everything
task test

# Lint everything
task lint
```

### Per-component commands

Each component has its own Taskfile. Use `task <component>:<task>`:

```sh
task registry:test        # Go tests for the registry
task builder:test         # Go tests for the builder
task operator:test        # Go tests for the operator
task envmanager:test      # Go tests for the environment manager
task gateway:test         # Rust tests for the gateway
task cli:test             # TypeScript tests for the CLI
task console:test         # React tests for the console UI
task explorer:test        # React tests for the explorer UI
```

### Go services

```sh
cd services/registry && go test -race ./...
cd services/builder && go test -race ./...
cd services/operator && go test -race ./...
cd services/envmanager && go test -race ./...
```

The Go workspace (`go.work`) links all four services so cross-module development works.

### Rust gateway

```sh
cd services/gateway && cargo test --all-targets
```

### TypeScript (CLI + UIs)

```sh
pnpm install              # from repo root
pnpm -r test              # test all JS/TS packages
pnpm -r build             # build all JS/TS packages
pnpm -r typecheck         # type-check all JS/TS packages
```

## Running the Full Platform Locally

```sh
task dev:up               # starts all services + observability in Docker Compose
task dev:logs             # tail all service logs
task dev:down             # stop everything
```

Services are available at:
- Registry: http://localhost:8081
- Builder: http://localhost:8082
- Environment Manager: http://localhost:8083
- Operator: http://localhost:8084
- Gateway: http://localhost:8080
- Console UI: http://localhost:3000
- Explorer UI: http://localhost:3001
- Jaeger (traces): http://localhost:16686
- Prometheus: http://localhost:9090

## Contract-First Development

**All inter-service boundaries are defined in static specs before code is written.** This is non-negotiable.

- **Protobuf** (`specs/protobuf/turboengine/v1/`) defines the domain model and service interfaces
- **OpenAPI** (`specs/openapi/`) defines the REST transcoding for each service
- **JSON Schema** (`specs/jsonschema/`) defines developer-facing file formats

When modifying an API:
1. Edit the spec first (protobuf or OpenAPI)
2. Run `task generate` to regenerate code
3. Update the service implementation to match
4. Update tests

The spec files are the **source of truth**. If code disagrees with specs, the code is wrong.

## Key Design Decisions

### Package model
A `Package` is the fundamental unit. It has a `kind` (graphql-subgraph, openapi-service, graphql-operations, postman-collection, graphql-supergraph, workflow-engine, ingress, egress), a schema payload, optional upstream networking config, and a list of dependencies on other packages.

### Dependency resolution
The registry resolves dependency trees via BFS traversal. Version constraints use semver ranges. The resolved tree is a topologically sorted list of packages.

### Build pipeline
The builder takes a resolved dependency tree and runs a pipeline: resolve -> compose -> validate -> bundle. Each step produces log entries streamed via SSE. The output is a set of artifacts (router configs, workflow bundles, etc.).

### Environment forking
The environment manager creates isolated "forks" of a dependency tree. Overrides replace specific packages in the tree. Each fork gets its own build and deployment. Preview URLs are generated for each environment.

### Operator reconciliation
The operator watches APIGraph CRDs (or receives specs via HTTP in dev mode). It computes the diff between desired and actual state and applies changes (create/update/delete Deployments, Services, ConfigMaps, Ingresses). In dev mode, the "cluster state" is in-memory.

## For Claude Code: Autonomous Development Guide

### Quick investigation

```sh
# Get a summary of platform state (health, errors, traces)
hack/claude/investigate.sh

# Full feedback loop: start platform, test, capture everything
hack/claude/run-and-report.sh
```

After running `run-and-report.sh`, read `ci-report/REPORT.md` for the full picture.

### Development workflow

1. **Understand the change** — Read the relevant spec (protobuf/OpenAPI) first
2. **Make the change** — Edit code, following existing patterns in the component
3. **Test the component** — Run `task <component>:test`
4. **Test the system** — Run `hack/claude/run-and-report.sh`
5. **Read the report** — Check `ci-report/REPORT.md` for issues
6. **Iterate** — Fix any failures, re-run

### Debugging cross-component issues

1. Start the platform: `task dev:up`
2. Wait for health: `hack/scripts/wait-for-healthy.sh`
3. Run the smoke tests: `hack/scripts/run-smoke-tests.sh`
4. If something fails, check traces: `hack/scripts/capture-traces.sh` then read `ci-report/traces.json`
5. Check service logs: `docker compose -f infra/docker/docker-compose.yml logs <service-name>`

### Testing a specific service in isolation

Each Go service has a complete in-memory store, so it can run standalone:

```sh
cd services/registry && go run ./cmd/registry
# In another terminal:
curl http://localhost:8081/healthz
curl -X POST http://localhost:8081/v1/packages -d '{"package":{"name":"test","kind":"openapi-service","version":"1.0.0"}}'
```

### Component ownership and boundaries

| Component    | Language   | Port | Spec                    | Owner concern           |
|-------------|------------|------|-------------------------|-------------------------|
| Registry    | Go         | 8081 | registry.proto/.openapi | Package storage/query   |
| Builder     | Go         | 8082 | builder.proto/.openapi  | Artifact production     |
| EnvManager  | Go         | 8083 | environment.proto/.oa   | Fork lifecycle          |
| Operator    | Go         | 8084 | operator.proto          | K8s reconciliation      |
| Gateway     | Rust       | 8080 | (config-driven)         | Traffic routing         |
| CLI         | TypeScript | —    | (uses OpenAPI clients)  | Developer UX            |
| Console     | React      | 3000 | (uses OpenAPI clients)  | Management UI           |
| Explorer    | React      | 3001 | (uses OpenAPI clients)  | Mobile exploration      |

### Publishing an example system

```sh
# Start the platform
task dev:up
hack/scripts/wait-for-healthy.sh

# Publish the federation example
cd examples/federation
for pkg in packages/*/; do
  turbo-engine publish --dir "$pkg"
done
turbo-engine publish .  # publish the root supergraph
```

### Common patterns

**Adding a new API endpoint:**
1. Add to the protobuf service definition in `specs/protobuf/`
2. Add to the OpenAPI spec in `specs/openapi/`
3. Add a handler method in `internal/handler/`
4. Add a store method if persistence is needed in `internal/store/`
5. Add tests for both handler and store
6. Update the CLI if the endpoint should be user-facing

**Adding a new package kind:**
1. Add to `PackageKind` enum in `specs/protobuf/turboengine/v1/package.proto`
2. Add to `kind` enum in `specs/jsonschema/package-manifest.schema.json`
3. Add handling in the builder's compose/validate/bundle steps
4. Add an example in `examples/`

**Adding a new service:**
1. Create `services/<name>/` following the existing pattern (go.mod, Taskfile, cmd/, internal/)
2. Add to `go.work`
3. Add to `infra/docker/docker-compose.yml`
4. Add to `hack/scripts/wait-for-healthy.sh`
5. Add Taskfile include in root `Taskfile.yml`
