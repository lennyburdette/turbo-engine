// Package handler implements the HTTP handlers for the Package Registry service.
//
// TODO: Once protobuf generation is set up, replace this plain REST/JSON
// handler with a Connect service handler using connectrpc.com/connect.
// The routes below mirror the OpenAPI spec at specs/openapi/registry.openapi.yaml
// and will be superseded by the Connect-generated handler mux.
package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/lennyburdette/turbo-engine/services/registry/internal/model"
	"github.com/lennyburdette/turbo-engine/services/registry/internal/store"
)

var tracer = otel.Tracer("registry-handler")

// RegistryHandler implements the REST/JSON API for the Package Registry.
type RegistryHandler struct {
	store  store.Store
	logger *slog.Logger
}

// New creates a new RegistryHandler and returns an http.Handler with all
// routes registered using Go 1.22+ enhanced routing patterns.
func New(s store.Store, logger *slog.Logger) http.Handler {
	h := &RegistryHandler{
		store:  s,
		logger: logger,
	}

	mux := http.NewServeMux()

	// Routes matching the OpenAPI spec at specs/openapi/registry.openapi.yaml.
	mux.HandleFunc("GET /v1/packages", h.ListPackages)
	mux.HandleFunc("POST /v1/packages", h.PublishPackage)
	mux.HandleFunc("GET /v1/packages/{name}/versions/{version}", h.GetPackage)
	mux.HandleFunc("DELETE /v1/packages/{name}/versions/{version}", h.YankPackage)
	mux.HandleFunc("GET /v1/packages/{name}/versions/{version}/dependencies", h.ResolveDependencies)

	return mux
}

// ListPackages handles GET /v1/packages.
func (h *RegistryHandler) ListPackages(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "ListPackages")
	defer span.End()

	q := r.URL.Query()
	pageSize, _ := strconv.Atoi(q.Get("page_size"))

	req := model.ListPackagesRequest{
		Namespace:  q.Get("namespace"),
		Kind:       q.Get("kind"),
		NamePrefix: q.Get("name_prefix"),
		PageSize:   pageSize,
		PageToken:  q.Get("page_token"),
	}

	span.SetAttributes(
		attribute.String("namespace", req.Namespace),
		attribute.String("kind", req.Kind),
		attribute.String("name_prefix", req.NamePrefix),
	)

	resp, err := h.store.List(ctx, req)
	if err != nil {
		h.serverError(w, span, "list packages", err)
		return
	}

	h.logger.InfoContext(ctx, "listed packages", "count", len(resp.Packages))
	writeJSON(w, http.StatusOK, resp)
}

// PublishPackage handles POST /v1/packages.
func (h *RegistryHandler) PublishPackage(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "PublishPackage")
	defer span.End()

	var req model.PublishRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "invalid request body")
		writeJSON(w, http.StatusBadRequest, errorBody("invalid request body: "+err.Error()))
		return
	}

	pkg := req.Package
	span.SetAttributes(
		attribute.String("package.name", pkg.Name),
		attribute.String("package.namespace", pkg.Namespace),
		attribute.String("package.version", pkg.Version),
	)

	if pkg.Name == "" || pkg.Version == "" {
		span.SetStatus(codes.Error, "name and version are required")
		writeJSON(w, http.StatusBadRequest, errorBody("name and version are required"))
		return
	}

	published, err := h.store.Publish(ctx, pkg)
	if err != nil {
		if errors.Is(err, store.ErrAlreadyExists) {
			span.SetStatus(codes.Error, "already exists")
			writeJSON(w, http.StatusConflict, errorBody("package version already exists"))
			return
		}
		h.serverError(w, span, "publish package", err)
		return
	}

	h.logger.InfoContext(ctx, "published package",
		"id", published.ID,
		"name", published.Name,
		"version", published.Version,
	)
	writeJSON(w, http.StatusCreated, published)
}

// GetPackage handles GET /v1/packages/{name}/versions/{version}.
func (h *RegistryHandler) GetPackage(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "GetPackage")
	defer span.End()

	name := r.PathValue("name")
	version := r.PathValue("version")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	span.SetAttributes(
		attribute.String("package.name", name),
		attribute.String("package.version", version),
		attribute.String("package.namespace", namespace),
	)

	pkg, err := h.store.Get(ctx, namespace, name, version)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, errorBody("package not found"))
			return
		}
		h.serverError(w, span, "get package", err)
		return
	}

	h.logger.InfoContext(ctx, "fetched package", "id", pkg.ID, "name", pkg.Name)
	writeJSON(w, http.StatusOK, pkg)
}

// YankPackage handles DELETE /v1/packages/{name}/versions/{version}.
func (h *RegistryHandler) YankPackage(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "YankPackage")
	defer span.End()

	name := r.PathValue("name")
	version := r.PathValue("version")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	span.SetAttributes(
		attribute.String("package.name", name),
		attribute.String("package.version", version),
		attribute.String("package.namespace", namespace),
	)

	err := h.store.Yank(ctx, namespace, name, version)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, errorBody("package not found"))
			return
		}
		h.serverError(w, span, "yank package", err)
		return
	}

	h.logger.InfoContext(ctx, "yanked package", "name", name, "version", version)
	w.WriteHeader(http.StatusNoContent)
}

// ResolveDependencies handles GET /v1/packages/{name}/versions/{version}/dependencies.
func (h *RegistryHandler) ResolveDependencies(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "ResolveDependencies")
	defer span.End()

	name := r.PathValue("name")
	version := r.PathValue("version")
	namespace := r.URL.Query().Get("namespace")
	if namespace == "" {
		namespace = "default"
	}

	span.SetAttributes(
		attribute.String("package.name", name),
		attribute.String("package.version", version),
		attribute.String("package.namespace", namespace),
	)

	pkgs, err := h.store.Resolve(ctx, namespace, name, version)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, errorBody("package not found"))
			return
		}
		h.serverError(w, span, "resolve dependencies", err)
		return
	}

	h.logger.InfoContext(ctx, "resolved dependencies", "name", name, "count", len(pkgs))
	writeJSON(w, http.StatusOK, model.ResolveDependenciesResponse{Packages: pkgs})
}

// --- helpers ----------------------------------------------------------------

func (h *RegistryHandler) serverError(w http.ResponseWriter, span trace.Span, action string, err error) {
	span.RecordError(err)
	span.SetStatus(codes.Error, err.Error())
	h.logger.Error("internal error", "action", action, "error", err)
	writeJSON(w, http.StatusInternalServerError, errorBody("internal server error"))
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

type apiError struct {
	Error string `json:"error"`
}

func errorBody(msg string) apiError {
	return apiError{Error: msg}
}
