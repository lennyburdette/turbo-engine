package handler_test

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/handler"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/orchestrator"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

// handlerTestBuilder implements orchestrator.BuilderClient for handler tests.
type handlerTestBuilder struct{}

func (b *handlerTestBuilder) TriggerBuild(_ context.Context, _ model.Environment) (string, error) {
	return "build-test", nil
}

// handlerTestOperator implements orchestrator.OperatorClient for handler tests.
type handlerTestOperator struct{}

func (o *handlerTestOperator) Deploy(_ context.Context, _ model.Environment, _ string) (string, error) {
	return "https://preview.test/env", nil
}

func (o *handlerTestOperator) Teardown(_ context.Context, _ string) error {
	return nil
}

func newTestHandler() (*handler.Handler, *http.ServeMux) {
	s := store.NewMemoryStore()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	b := &handlerTestBuilder{}
	o := &handlerTestOperator{}
	orch := orchestrator.New(s, b, o, logger)
	h := handler.New(orch, logger)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	return h, mux
}

func TestCreateEnvironment_Handler(t *testing.T) {
	_, mux := newTestHandler()

	body := `{"name":"test-env","baseRootPackage":"root-pkg","createdBy":"alice"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var env model.Environment
	if err := json.NewDecoder(w.Body).Decode(&env); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if env.Name != "test-env" {
		t.Fatalf("expected name test-env, got %s", env.Name)
	}
	if env.Status != model.StatusReady {
		t.Fatalf("expected status ready, got %s", env.Status)
	}
}

func TestCreateEnvironment_MissingFields(t *testing.T) {
	_, mux := newTestHandler()

	body := `{"name":"test-env"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestCreateEnvironment_InvalidJSON(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", w.Code, w.Body.String())
	}
}

func TestListEnvironments_Empty(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/environments", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp model.ListEnvironmentsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(resp.Environments) != 0 {
		t.Fatalf("expected 0 environments, got %d", len(resp.Environments))
	}
}

func TestGetEnvironment_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/environments/nonexistent", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestGetEnvironment_Found(t *testing.T) {
	_, mux := newTestHandler()

	// Create an environment first.
	body := `{"name":"test-env","baseRootPackage":"root-pkg"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	var created model.Environment
	if err := json.NewDecoder(createW.Body).Decode(&created); err != nil {
		t.Fatalf("decode create response: %v", err)
	}

	// Get it.
	getReq := httptest.NewRequest(http.MethodGet, "/v1/environments/"+created.ID, nil)
	getW := httptest.NewRecorder()
	mux.ServeHTTP(getW, getReq)

	if getW.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", getW.Code, getW.Body.String())
	}

	var got model.Environment
	if err := json.NewDecoder(getW.Body).Decode(&got); err != nil {
		t.Fatalf("decode get response: %v", err)
	}
	if got.ID != created.ID {
		t.Fatalf("expected ID %s, got %s", created.ID, got.ID)
	}
}

func TestDeleteEnvironment_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodDelete, "/v1/environments/nonexistent", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestDeleteEnvironment_Success(t *testing.T) {
	_, mux := newTestHandler()

	// Create.
	body := `{"name":"to-delete","baseRootPackage":"root-pkg"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	var created model.Environment
	if err := json.NewDecoder(createW.Body).Decode(&created); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// Delete.
	delReq := httptest.NewRequest(http.MethodDelete, "/v1/environments/"+created.ID, nil)
	delW := httptest.NewRecorder()
	mux.ServeHTTP(delW, delReq)

	if delW.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", delW.Code, delW.Body.String())
	}

	// Verify gone.
	getReq := httptest.NewRequest(http.MethodGet, "/v1/environments/"+created.ID, nil)
	getW := httptest.NewRecorder()
	mux.ServeHTTP(getW, getReq)

	if getW.Code != http.StatusNotFound {
		t.Fatalf("expected 404 after delete, got %d", getW.Code)
	}
}

func TestApplyOverrides_Handler(t *testing.T) {
	_, mux := newTestHandler()

	// Create.
	createBody := `{"name":"override-env","baseRootPackage":"root-pkg"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	var created model.Environment
	if err := json.NewDecoder(createW.Body).Decode(&created); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// Apply overrides.
	overrideBody := `{"overrides":[{"packageName":"users","schema":"type User { id: ID! }"}],"triggerBuild":false}`
	overrideReq := httptest.NewRequest(http.MethodPost, "/v1/environments/"+created.ID+"/overrides", bytes.NewBufferString(overrideBody))
	overrideReq.Header.Set("Content-Type", "application/json")
	overrideW := httptest.NewRecorder()
	mux.ServeHTTP(overrideW, overrideReq)

	if overrideW.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", overrideW.Code, overrideW.Body.String())
	}

	var updated model.Environment
	if err := json.NewDecoder(overrideW.Body).Decode(&updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(updated.Overrides) != 1 {
		t.Fatalf("expected 1 override, got %d", len(updated.Overrides))
	}
}

func TestApplyOverrides_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	body := `{"overrides":[{"packageName":"x"}]}`
	req := httptest.NewRequest(http.MethodPost, "/v1/environments/nonexistent/overrides", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestPromote_Handler(t *testing.T) {
	_, mux := newTestHandler()

	// Create with overrides (no triggerBuild by default, so they stay as-is).
	createBody := `{"name":"promote-env","baseRootPackage":"root-pkg","baseRootVersion":"1.0.0"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBufferString(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	var created model.Environment
	if err := json.NewDecoder(createW.Body).Decode(&created); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// Apply overrides without triggering a build.
	overrideBody := `{"overrides":[{"packageName":"users","schema":"type User { id: ID! }"}],"triggerBuild":false}`
	overrideReq := httptest.NewRequest(http.MethodPost, "/v1/environments/"+created.ID+"/overrides", bytes.NewBufferString(overrideBody))
	overrideReq.Header.Set("Content-Type", "application/json")
	overrideW := httptest.NewRecorder()
	mux.ServeHTTP(overrideW, overrideReq)

	if overrideW.Code != http.StatusOK {
		t.Fatalf("apply overrides: expected 200, got %d", overrideW.Code)
	}

	// Promote.
	promoteReq := httptest.NewRequest(http.MethodPost, "/v1/environments/"+created.ID+"/promote", nil)
	promoteW := httptest.NewRecorder()
	mux.ServeHTTP(promoteW, promoteReq)

	if promoteW.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", promoteW.Code, promoteW.Body.String())
	}

	var resp model.PromoteResponse
	if err := json.NewDecoder(promoteW.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.PromotedPackages) != 1 {
		t.Fatalf("expected 1 promoted package, got %d", len(resp.PromotedPackages))
	}
	if resp.PromotedPackages[0].Name != "users" {
		t.Fatalf("expected promoted package name 'users', got %s", resp.PromotedPackages[0].Name)
	}
}

func TestPromote_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/environments/nonexistent/promote", nil)
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", w.Code, w.Body.String())
	}
}

func TestListEnvironments_WithFilters(t *testing.T) {
	_, mux := newTestHandler()

	// Create two environments with different branches.
	for _, branch := range []string{"main", "feature"} {
		body, _ := json.Marshal(model.CreateEnvironmentRequest{
			Name:            "env-" + branch,
			BaseRootPackage: "root-pkg",
			Branch:          branch,
		})
		req := httptest.NewRequest(http.MethodPost, "/v1/environments", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != http.StatusCreated {
			t.Fatalf("create env-%s: expected 201, got %d", branch, w.Code)
		}
	}

	// List with branch filter.
	req := httptest.NewRequest(http.MethodGet, "/v1/environments?branch=main", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp model.ListEnvironmentsResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Environments) != 1 {
		t.Fatalf("expected 1 environment, got %d", len(resp.Environments))
	}
	if resp.Environments[0].Branch != "main" {
		t.Fatalf("expected branch main, got %s", resp.Environments[0].Branch)
	}
}
