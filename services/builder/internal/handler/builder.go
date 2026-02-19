// Package handler implements the HTTP handlers for the Builder REST API.
package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/engine"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/store"
)

// BuilderHandler holds the dependencies for the builder HTTP handlers.
type BuilderHandler struct {
	store  store.Store
	engine *engine.BuildEngine
	logger *slog.Logger
	nextID func() string
}

// New creates a new BuilderHandler.
func New(s store.Store, eng *engine.BuildEngine, logger *slog.Logger, idFunc func() string) *BuilderHandler {
	return &BuilderHandler{
		store:  s,
		engine: eng,
		logger: logger,
		nextID: idFunc,
	}
}

// RegisterRoutes registers the builder API routes on the given mux using
// Go 1.22+ method+pattern routing.
func (h *BuilderHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /v1/builds", h.CreateBuild)
	mux.HandleFunc("GET /v1/builds/{buildId}", h.GetBuild)
	mux.HandleFunc("GET /v1/builds/{buildId}/logs", h.StreamBuildLogs)
}

// CreateBuild handles POST /v1/builds.
func (h *BuilderHandler) CreateBuild(w http.ResponseWriter, r *http.Request) {
	var req model.CreateBuildRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.EnvironmentID == "" {
		h.writeError(w, http.StatusBadRequest, "environmentId is required")
		return
	}

	build := &model.Build{
		ID:                 h.nextID(),
		EnvironmentID:      req.EnvironmentID,
		Status:             model.BuildStatusPending,
		Artifacts:          []model.Artifact{},
		CreatedAt:          time.Now().UTC(),
		RootPackageName:    req.RootPackageName,
		RootPackageVersion: req.RootPackageVersion,
	}

	created, err := h.store.CreateBuild(r.Context(), build)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "failed to create build", "error", err)
		h.writeError(w, http.StatusInternalServerError, "failed to create build")
		return
	}

	h.logger.InfoContext(r.Context(), "build created",
		"build_id", created.ID,
		"environment_id", created.EnvironmentID,
	)

	// Start the build pipeline asynchronously.
	go h.engine.Run(r.Context(), created.ID)

	h.writeJSON(w, http.StatusCreated, created)
}

// GetBuild handles GET /v1/builds/{buildId}.
func (h *BuilderHandler) GetBuild(w http.ResponseWriter, r *http.Request) {
	buildID := r.PathValue("buildId")
	if buildID == "" {
		h.writeError(w, http.StatusBadRequest, "buildId is required")
		return
	}

	build, err := h.store.GetBuild(r.Context(), buildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, http.StatusNotFound, "build not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "failed to get build", "error", err)
		h.writeError(w, http.StatusInternalServerError, "failed to get build")
		return
	}

	h.writeJSON(w, http.StatusOK, build)
}

// StreamBuildLogs handles GET /v1/builds/{buildId}/logs using Server-Sent Events.
func (h *BuilderHandler) StreamBuildLogs(w http.ResponseWriter, r *http.Request) {
	buildID := r.PathValue("buildId")
	if buildID == "" {
		h.writeError(w, http.StatusBadRequest, "buildId is required")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		h.writeError(w, http.StatusInternalServerError, "streaming not supported")
		return
	}

	ch, err := h.store.SubscribeLogs(r.Context(), buildID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			h.writeError(w, http.StatusNotFound, "build not found")
			return
		}
		h.logger.ErrorContext(r.Context(), "failed to subscribe to logs", "error", err)
		h.writeError(w, http.StatusInternalServerError, "failed to subscribe to logs")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	for {
		select {
		case entry, ok := <-ch:
			if !ok {
				// Channel closed — build finished.
				fmt.Fprintf(w, "event: done\ndata: {}\n\n")
				flusher.Flush()
				return
			}

			data, err := json.Marshal(entry)
			if err != nil {
				h.logger.ErrorContext(r.Context(), "failed to marshal log entry", "error", err)
				continue
			}

			fmt.Fprintf(w, "event: log\ndata: %s\n\n", data)
			flusher.Flush()

		case <-r.Context().Done():
			return
		}
	}
}

// writeJSON writes a JSON response with the given status code.
func (h *BuilderHandler) writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		h.logger.Error("failed to write JSON response", "error", err)
	}
}

// apiError is the JSON error response format.
type apiError struct {
	Error string `json:"error"`
}

// writeError writes a JSON error response.
func (h *BuilderHandler) writeError(w http.ResponseWriter, status int, message string) {
	h.writeJSON(w, status, apiError{Error: message})
}
