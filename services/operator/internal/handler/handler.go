// Package handler provides HTTP handlers for the operator service.
// These endpoints exist for development and CI usage — in production,
// the operator watches Kubernetes CRDs instead.
package handler

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/reconciler"
)

var tracer = otel.Tracer("operator/handler")

// Handler holds the HTTP handler dependencies.
type Handler struct {
	reconciler *reconciler.Reconciler
	logger     *slog.Logger
}

// New creates a new Handler.
func New(r *reconciler.Reconciler, logger *slog.Logger) *Handler {
	return &Handler{
		reconciler: r,
		logger:     logger.With("component", "handler"),
	}
}

// ReconcileRequest is the JSON body for POST /v1/reconcile.
type ReconcileRequest struct {
	Spec model.APIGraphSpec `json:"spec"`
}

// ReconcileResponse is the JSON response from POST /v1/reconcile.
type ReconcileResponse struct {
	Actions []reconciler.Action  `json:"actions"`
	Status  model.APIGraphStatus `json:"status"`
}

// StatusResponse is the JSON response from GET /v1/status/{environmentId}.
type StatusResponse struct {
	EnvironmentID string               `json:"environmentId"`
	Status        model.APIGraphStatus `json:"status"`
}

// AllStatusesResponse is the JSON response from GET /v1/status.
type AllStatusesResponse struct {
	Environments map[string]model.APIGraphStatus `json:"environments"`
}

// GatewayRoute mirrors the gateway's Route struct for JSON serialization.
type GatewayRoute struct {
	PathPrefix  string `json:"path_prefix"`
	UpstreamURL string `json:"upstream_url"`
	StripPrefix bool   `json:"strip_prefix"`
	TimeoutMs   int    `json:"timeout_ms,omitempty"`
}

// GatewayConfig mirrors the gateway's IngressConfig struct.
type GatewayConfig struct {
	Routing          GatewayRoutingTable `json:"routing"`
	PollIntervalSecs int                 `json:"poll_interval_secs"`
}

// GatewayRoutingTable mirrors the gateway's RoutingTable struct.
type GatewayRoutingTable struct {
	Routes []GatewayRoute `json:"routes"`
}

// RegisterRoutes registers all handler routes on the given mux.
// Uses Go 1.22+ method-and-pattern routing.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/reconcile", h.handleReconcile)
	mux.HandleFunc("GET /v1/status/{environmentId}", h.handleGetStatus)
	mux.HandleFunc("GET /v1/status", h.handleGetAllStatuses)
	mux.HandleFunc("GET /v1/gateway-config", h.handleGatewayConfig)
}

// handleReconcile triggers reconciliation for a given APIGraphSpec.
func (h *Handler) handleReconcile(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "handleReconcile")
	defer span.End()

	var req ReconcileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.ErrorContext(ctx, "failed to decode reconcile request", "error", err)
		h.writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.Spec.EnvironmentID == "" {
		h.writeError(w, http.StatusBadRequest, "spec.environmentId is required")
		return
	}

	if req.Spec.BuildID == "" {
		h.writeError(w, http.StatusBadRequest, "spec.buildId is required")
		return
	}

	span.SetAttributes(
		attribute.String("environment_id", req.Spec.EnvironmentID),
		attribute.String("build_id", req.Spec.BuildID),
	)

	h.logger.InfoContext(ctx, "reconcile request received",
		"environment_id", req.Spec.EnvironmentID,
		"build_id", req.Spec.BuildID,
	)

	actions, status, err := h.reconciler.Reconcile(ctx, req.Spec)
	if err != nil {
		h.logger.ErrorContext(ctx, "reconciliation failed",
			"environment_id", req.Spec.EnvironmentID,
			"error", err,
		)
		h.writeError(w, http.StatusInternalServerError, "reconciliation failed: "+err.Error())
		return
	}

	resp := ReconcileResponse{
		Actions: actions,
		Status:  status,
	}

	h.writeJSON(w, http.StatusOK, resp)
}

// handleGetStatus returns the status for a single environment.
func (h *Handler) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "handleGetStatus")
	defer span.End()

	environmentID := r.PathValue("environmentId")
	span.SetAttributes(attribute.String("environment_id", environmentID))

	h.logger.InfoContext(ctx, "status request",
		"environment_id", environmentID,
	)

	status, ok := h.reconciler.GetStatus(environmentID)
	if !ok {
		h.writeError(w, http.StatusNotFound, "environment not found: "+environmentID)
		return
	}

	resp := StatusResponse{
		EnvironmentID: environmentID,
		Status:        status,
	}

	h.writeJSON(w, http.StatusOK, resp)
}

// handleGetAllStatuses returns status for all tracked environments.
func (h *Handler) handleGetAllStatuses(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "handleGetAllStatuses")
	defer span.End()

	h.logger.InfoContext(ctx, "all statuses request")

	statuses := h.reconciler.GetAllStatuses()

	resp := AllStatusesResponse{
		Environments: statuses,
	}

	h.writeJSON(w, http.StatusOK, resp)
}

// handleGatewayConfig builds a gateway-compatible routing config from all
// reconciled environments' ingress specs. The gateway polls this endpoint
// to discover routes to operator-deployed services.
func (h *Handler) handleGatewayConfig(w http.ResponseWriter, r *http.Request) {
	ctx, span := tracer.Start(r.Context(), "handleGatewayConfig")
	defer span.End()

	specs := h.reconciler.GetAllSpecs()

	var routes []GatewayRoute
	for _, spec := range specs {
		for _, route := range spec.Ingress.Routes {
			// Map the target component to its K8s service DNS name.
			upstreamURL := fmt.Sprintf("http://svc-%s:%d", route.TargetComponent, route.TargetPort)

			routes = append(routes, GatewayRoute{
				PathPrefix:  route.Path,
				UpstreamURL: upstreamURL,
				StripPrefix: true,
				TimeoutMs:   30000,
			})
		}
	}

	h.logger.InfoContext(ctx, "gateway config request", "routes", len(routes))

	config := GatewayConfig{
		Routing:          GatewayRoutingTable{Routes: routes},
		PollIntervalSecs: 5,
	}

	h.writeJSON(w, http.StatusOK, config)
}

// writeJSON writes a JSON response.
func (h *Handler) writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		h.logger.Error("failed to write JSON response", "error", err)
	}
}

// ErrorResponse is a standard error response body.
type ErrorResponse struct {
	Error string `json:"error"`
}

// writeError writes a JSON error response.
func (h *Handler) writeError(w http.ResponseWriter, code int, message string) {
	h.writeJSON(w, code, ErrorResponse{Error: message})
}
