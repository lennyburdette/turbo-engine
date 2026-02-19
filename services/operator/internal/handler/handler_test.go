package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/reconciler"
)

func setupTestHandler(t *testing.T) (*Handler, *http.ServeMux) {
	t.Helper()
	logger := slog.Default()
	r := reconciler.New(logger)
	h := New(r, logger)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	return h, mux
}

func reconcileSpec() model.APIGraphSpec {
	return model.APIGraphSpec{
		EnvironmentID: "env-test-1",
		BuildID:       "build-42",
		RootPackage:   "root-pkg",
		Components: []model.DeployedComponent{
			{
				PackageName:    "users-api",
				PackageVersion: "1.0.0",
				Kind:           model.PackageKindGraphQLSubgraph,
				ArtifactHash:   "abc123",
				Runtime: model.ComponentRuntime{
					Replicas: 2,
					Resources: model.ResourceRequirements{
						CPURequest:    "100m",
						MemoryRequest: "128Mi",
					},
					Env: map[string]string{
						"LOG_LEVEL": "info",
					},
				},
			},
		},
		Ingress: model.IngressSpec{
			Host: "api.example.com",
			Routes: []model.IngressRoute{
				{Path: "/graphql", TargetComponent: "gateway", TargetPort: 4000},
			},
			TLS: model.TLSConfig{AutoCert: true},
		},
	}
}

func TestHandleReconcile_Success(t *testing.T) {
	_, mux := setupTestHandler(t)

	spec := reconcileSpec()
	body, err := json.Marshal(ReconcileRequest{Spec: spec})
	if err != nil {
		t.Fatalf("failed to marshal request: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp ReconcileResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Actions) == 0 {
		t.Error("expected at least one action")
	}

	if resp.Status.Phase != model.PhaseRunning {
		t.Errorf("expected Running phase, got %s", resp.Status.Phase)
	}

	if resp.Status.PreviewURL != "https://api.example.com" {
		t.Errorf("expected preview URL https://api.example.com, got %s", resp.Status.PreviewURL)
	}
}

func TestHandleReconcile_InvalidJSON(t *testing.T) {
	_, mux := setupTestHandler(t)

	req := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader([]byte("not json")))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestHandleReconcile_MissingEnvironmentID(t *testing.T) {
	_, mux := setupTestHandler(t)

	spec := reconcileSpec()
	spec.EnvironmentID = ""
	body, _ := json.Marshal(ReconcileRequest{Spec: spec})

	req := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestHandleReconcile_MissingBuildID(t *testing.T) {
	_, mux := setupTestHandler(t)

	spec := reconcileSpec()
	spec.BuildID = ""
	body, _ := json.Marshal(ReconcileRequest{Spec: spec})

	req := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestHandleGetStatus_Found(t *testing.T) {
	h, mux := setupTestHandler(t)

	// First, reconcile to create state.
	spec := reconcileSpec()
	_, _, err := h.reconciler.Reconcile(context.Background(), spec)
	if err != nil {
		t.Fatalf("failed to reconcile: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/status/env-test-1", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp StatusResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.EnvironmentID != "env-test-1" {
		t.Errorf("expected environment ID env-test-1, got %s", resp.EnvironmentID)
	}

	if resp.Status.Phase != model.PhaseRunning {
		t.Errorf("expected Running phase, got %s", resp.Status.Phase)
	}
}

func TestHandleGetStatus_NotFound(t *testing.T) {
	_, mux := setupTestHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/status/nonexistent", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rec.Code)
	}
}

func TestHandleGetAllStatuses_Empty(t *testing.T) {
	_, mux := setupTestHandler(t)

	req := httptest.NewRequest(http.MethodGet, "/v1/status", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp AllStatusesResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Environments) != 0 {
		t.Errorf("expected 0 environments, got %d", len(resp.Environments))
	}
}

func TestHandleGetAllStatuses_WithData(t *testing.T) {
	h, mux := setupTestHandler(t)

	// Reconcile two environments.
	spec1 := reconcileSpec()
	spec2 := reconcileSpec()
	spec2.EnvironmentID = "env-test-2"
	spec2.BuildID = "build-43"

	_, _, err := h.reconciler.Reconcile(context.Background(), spec1)
	if err != nil {
		t.Fatalf("failed to reconcile: %v", err)
	}
	_, _, err = h.reconciler.Reconcile(context.Background(), spec2)
	if err != nil {
		t.Fatalf("failed to reconcile: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/v1/status", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp AllStatusesResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Environments) != 2 {
		t.Errorf("expected 2 environments, got %d", len(resp.Environments))
	}
}

func TestHandleReconcile_Idempotent(t *testing.T) {
	_, mux := setupTestHandler(t)

	spec := reconcileSpec()
	body, _ := json.Marshal(ReconcileRequest{Spec: spec})

	// First request — creates resources.
	req1 := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader(body))
	req1.Header.Set("Content-Type", "application/json")
	rec1 := httptest.NewRecorder()
	mux.ServeHTTP(rec1, req1)

	var resp1 ReconcileResponse
	json.NewDecoder(rec1.Body).Decode(&resp1)
	firstActionCount := len(resp1.Actions)

	// Second request with same spec — should have no actions.
	req2 := httptest.NewRequest(http.MethodPost, "/v1/reconcile", bytes.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	mux.ServeHTTP(rec2, req2)

	var resp2 ReconcileResponse
	json.NewDecoder(rec2.Body).Decode(&resp2)

	if firstActionCount == 0 {
		t.Error("first reconcile should have created actions")
	}

	if len(resp2.Actions) != 0 {
		t.Errorf("second reconcile should have 0 actions (idempotent), got %d", len(resp2.Actions))
	}
}
