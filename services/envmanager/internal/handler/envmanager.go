// Package handler provides HTTP handlers for the Environment Manager REST API.
package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/orchestrator"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

// Handler holds the HTTP handler dependencies.
type Handler struct {
	orch   *orchestrator.Orchestrator
	logger *slog.Logger
}

// New creates a new Handler.
func New(orch *orchestrator.Orchestrator, logger *slog.Logger) *Handler {
	return &Handler{orch: orch, logger: logger}
}

// RegisterRoutes registers all environment manager routes on the given mux.
// Uses Go 1.22+ method-aware routing patterns.
func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/environments", h.CreateEnvironment)
	mux.HandleFunc("GET /v1/environments", h.ListEnvironments)
	mux.HandleFunc("GET /v1/environments/{id}", h.GetEnvironment)
	mux.HandleFunc("DELETE /v1/environments/{id}", h.DeleteEnvironment)
	mux.HandleFunc("POST /v1/environments/{id}/overrides", h.ApplyOverrides)
	mux.HandleFunc("POST /v1/environments/{id}/promote", h.Promote)
}

// CreateEnvironment handles POST /v1/environments.
func (h *Handler) CreateEnvironment(w http.ResponseWriter, r *http.Request) {
	var req model.CreateEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, r, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.Name == "" || req.BaseRootPackage == "" {
		h.writeError(w, r, http.StatusBadRequest, "name and baseRootPackage are required")
		return
	}

	env, err := h.orch.CreateEnvironment(r.Context(), req)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "create environment failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to create environment")
		return
	}

	h.writeJSON(w, r, http.StatusCreated, env)
}

// ListEnvironments handles GET /v1/environments.
func (h *Handler) ListEnvironments(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	pageSize := 0
	if ps := query.Get("page_size"); ps != "" {
		var err error
		pageSize, err = strconv.Atoi(ps)
		if err != nil || pageSize < 0 {
			h.writeError(w, r, http.StatusBadRequest, "invalid page_size")
			return
		}
	}

	filter := store.ListFilter{
		Branch:    query.Get("branch"),
		CreatedBy: query.Get("created_by"),
		PageSize:  pageSize,
		PageToken: query.Get("page_token"),
	}

	result, err := h.orch.ListEnvironments(r.Context(), filter)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "list environments failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to list environments")
		return
	}

	resp := model.ListEnvironmentsResponse{
		Environments:  result.Environments,
		NextPageToken: result.NextPageToken,
	}
	// Ensure non-nil environments slice for JSON serialization.
	if resp.Environments == nil {
		resp.Environments = []model.Environment{}
	}

	h.writeJSON(w, r, http.StatusOK, resp)
}

// GetEnvironment handles GET /v1/environments/{id}.
func (h *Handler) GetEnvironment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.writeError(w, r, http.StatusBadRequest, "environment ID is required")
		return
	}

	env, err := h.orch.GetEnvironment(r.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, r, http.StatusNotFound, "environment not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "get environment failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to get environment")
		return
	}

	h.writeJSON(w, r, http.StatusOK, env)
}

// DeleteEnvironment handles DELETE /v1/environments/{id}.
func (h *Handler) DeleteEnvironment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.writeError(w, r, http.StatusBadRequest, "environment ID is required")
		return
	}

	err := h.orch.DeleteEnvironment(r.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, r, http.StatusNotFound, "environment not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "delete environment failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to delete environment")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ApplyOverrides handles POST /v1/environments/{id}/overrides.
func (h *Handler) ApplyOverrides(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.writeError(w, r, http.StatusBadRequest, "environment ID is required")
		return
	}

	var req model.ApplyOverridesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, r, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	env, err := h.orch.ApplyOverrides(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, r, http.StatusNotFound, "environment not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "apply overrides failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to apply overrides")
		return
	}

	h.writeJSON(w, r, http.StatusOK, env)
}

// Promote handles POST /v1/environments/{id}/promote.
func (h *Handler) Promote(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		h.writeError(w, r, http.StatusBadRequest, "environment ID is required")
		return
	}

	resp, err := h.orch.Promote(r.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, r, http.StatusNotFound, "environment not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "promote failed", slog.String("error", err.Error()))
		h.writeError(w, r, http.StatusInternalServerError, "failed to promote")
		return
	}

	h.writeJSON(w, r, http.StatusOK, resp)
}

// errorResponse is the standard error response body.
type errorResponse struct {
	Error string `json:"error"`
}

func (h *Handler) writeJSON(w http.ResponseWriter, _ *http.Request, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		h.logger.Error("failed to encode JSON response", slog.String("error", err.Error()))
	}
}

func (h *Handler) writeError(w http.ResponseWriter, r *http.Request, status int, msg string) {
	h.writeJSON(w, r, status, errorResponse{Error: msg})
}
