// docker-bake.hcl — Centralized Docker image build definitions.
//
// All CI workflows (Build, E2E, K8s E2E) use this file via `docker buildx bake`
// so image definitions, tags, and cache config live in one place.
//
// Usage:
//   docker buildx bake                       # build all platform images
//   docker buildx bake k8s-e2e               # build all + E2E test fixtures
//   TAG=e2e docker buildx bake k8s-e2e       # custom tag (default: latest)
//   CACHE=gha docker buildx bake             # enable GitHub Actions cache (CI only)

variable "TAG" {
  default = "latest"
}

// Set to "gha" in CI to enable GitHub Actions layer cache.
// Leave empty for local builds (no remote cache).
variable "CACHE" {
  default = ""
}

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

group "default" {
  targets = ["registry", "builder", "operator", "envmanager", "gateway", "console", "explorer"]
}

group "k8s-e2e" {
  targets = ["registry", "builder", "operator", "envmanager", "gateway", "console", "explorer", "petstore-mock", "orchestrator"]
}

group "e2e-fixtures" {
  targets = ["petstore-mock", "orchestrator"]
}

group "go-services" {
  targets = ["registry", "builder", "operator", "envmanager"]
}

// ---------------------------------------------------------------------------
// Go services
// ---------------------------------------------------------------------------

target "registry" {
  context    = "services/registry"
  tags       = ["turbo-engine/registry:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=registry"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=registry"] : []
}

target "builder" {
  context    = "services/builder"
  tags       = ["turbo-engine/builder:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=builder"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=builder"] : []
}

target "operator" {
  context    = "services/operator"
  tags       = ["turbo-engine/operator:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=operator"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=operator"] : []
}

target "envmanager" {
  context    = "services/envmanager"
  tags       = ["turbo-engine/envmanager:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=envmanager"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=envmanager"] : []
}

// ---------------------------------------------------------------------------
// Rust gateway
// ---------------------------------------------------------------------------

target "gateway" {
  context    = "services/gateway"
  tags       = ["turbo-engine/gateway:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=gateway"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=gateway"] : []
}

// ---------------------------------------------------------------------------
// Frontend
// ---------------------------------------------------------------------------

target "console" {
  context    = "ui/console"
  tags       = ["turbo-engine/console:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=console"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=console"] : []
}

target "explorer" {
  context    = "ui/explorer"
  tags       = ["turbo-engine/explorer:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=explorer"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=explorer"] : []
}

// ---------------------------------------------------------------------------
// E2E test fixtures
// ---------------------------------------------------------------------------

target "petstore-mock" {
  context    = "hack/e2e/petstore-mock"
  tags       = ["turbo-engine/petstore-mock:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=petstore-mock"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=petstore-mock"] : []
}

target "orchestrator" {
  context    = "hack/e2e/orchestrator"
  tags       = ["turbo-engine/orchestrator:${TAG}"]
  cache-from = CACHE != "" ? ["type=${CACHE},scope=orchestrator"] : []
  cache-to   = CACHE != "" ? ["type=${CACHE},mode=max,scope=orchestrator"] : []
}
