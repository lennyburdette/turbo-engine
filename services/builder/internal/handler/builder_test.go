package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/engine"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/store"
)

func newTestHandler() (*BuilderHandler, *http.ServeMux) {
	s := store.NewMemoryStore()
	logger := slog.Default()
	eng := engine.New(s, logger)

	var counter atomic.Int64
	idFunc := func() string {
		return fmt.Sprintf("build-%d", counter.Add(1))
	}

	h := New(s, eng, logger, idFunc)
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	return h, mux
}

func TestCreateBuild(t *testing.T) {
	_, mux := newTestHandler()

	body := `{"environmentId": "env-1", "rootPackageName": "my-api", "rootPackageVersion": "1.0.0"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/builds", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", resp.StatusCode)
	}

	var build model.Build
	if err := json.NewDecoder(resp.Body).Decode(&build); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if build.ID == "" {
		t.Fatal("expected non-empty build ID")
	}
	if build.EnvironmentID != "env-1" {
		t.Fatalf("expected environmentId %q, got %q", "env-1", build.EnvironmentID)
	}
	if build.Status != model.BuildStatusPending {
		t.Fatalf("expected status %q, got %q", model.BuildStatusPending, build.Status)
	}
}

func TestCreateBuild_MissingEnvironmentID(t *testing.T) {
	_, mux := newTestHandler()

	body := `{"rootPackageName": "my-api"}`
	req := httptest.NewRequest(http.MethodPost, "/v1/builds", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.StatusCode)
	}
}

func TestCreateBuild_InvalidJSON(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodPost, "/v1/builds", strings.NewReader("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	mux.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", resp.StatusCode)
	}
}

func TestGetBuild(t *testing.T) {
	_, mux := newTestHandler()

	// Create a build first.
	body := `{"environmentId": "env-1", "rootPackageName": "my-api", "rootPackageVersion": "1.0.0"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/builds", strings.NewReader(body))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	var created model.Build
	_ = json.NewDecoder(createW.Result().Body).Decode(&created)

	// Give the async build a moment to complete.
	time.Sleep(100 * time.Millisecond)

	// Now get it.
	getReq := httptest.NewRequest(http.MethodGet, "/v1/builds/"+created.ID, nil)
	getW := httptest.NewRecorder()
	mux.ServeHTTP(getW, getReq)

	resp := getW.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var build model.Build
	if err := json.NewDecoder(resp.Body).Decode(&build); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if build.ID != created.ID {
		t.Fatalf("expected ID %q, got %q", created.ID, build.ID)
	}
}

func TestGetBuild_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/builds/nonexistent", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.StatusCode)
	}
}

func TestStreamBuildLogs(t *testing.T) {
	h, mux := newTestHandler()

	// Create a build directly in the store so we can control its lifecycle.
	build := &model.Build{
		ID:                 "build-sse-1",
		EnvironmentID:      "env-1",
		Status:             model.BuildStatusRunning,
		Artifacts:          []model.Artifact{},
		CreatedAt:          time.Now().UTC(),
		RootPackageName:    "my-api",
		RootPackageVersion: "1.0.0",
	}
	_, _ = h.store.CreateBuild(context.Background(), build)

	// Append a log entry.
	_ = h.store.AppendLog(context.Background(), build.ID, model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "hello from test",
		Step:      "resolve",
	})

	// Start SSE request with a timeout context.
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	req := httptest.NewRequest(http.MethodGet, "/v1/builds/build-sse-1/logs", nil)
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	// Run the handler in a goroutine since it blocks.
	done := make(chan struct{})
	go func() {
		defer close(done)
		mux.ServeHTTP(w, req)
	}()

	// Complete the build to trigger channel close.
	time.Sleep(50 * time.Millisecond)
	build.Status = model.BuildStatusSucceeded
	_, _ = h.store.UpdateBuild(context.Background(), build)

	// Wait for handler to finish.
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for SSE handler to complete")
	}

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType != "text/event-stream" {
		t.Fatalf("expected Content-Type %q, got %q", "text/event-stream", contentType)
	}

	bodyBytes, _ := io.ReadAll(resp.Body)
	bodyStr := string(bodyBytes)

	if !strings.Contains(bodyStr, "event: log") {
		t.Fatal("expected SSE body to contain 'event: log'")
	}
	if !strings.Contains(bodyStr, "hello from test") {
		t.Fatal("expected SSE body to contain log message")
	}
	if !strings.Contains(bodyStr, "event: done") {
		t.Fatal("expected SSE body to contain 'event: done'")
	}
}

func TestStreamBuildLogs_NotFound(t *testing.T) {
	_, mux := newTestHandler()

	req := httptest.NewRequest(http.MethodGet, "/v1/builds/nonexistent/logs", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", resp.StatusCode)
	}
}

func TestCreateBuild_FullLifecycle(t *testing.T) {
	_, mux := newTestHandler()

	// Create a build.
	body := `{"environmentId": "env-lifecycle", "rootPackageName": "test-pkg", "rootPackageVersion": "2.0.0"}`
	createReq := httptest.NewRequest(http.MethodPost, "/v1/builds", bytes.NewBufferString(body))
	createReq.Header.Set("Content-Type", "application/json")
	createW := httptest.NewRecorder()
	mux.ServeHTTP(createW, createReq)

	if createW.Result().StatusCode != http.StatusCreated {
		t.Fatalf("expected status 201, got %d", createW.Result().StatusCode)
	}

	var created model.Build
	_ = json.NewDecoder(createW.Result().Body).Decode(&created)

	// Wait for the async build to complete.
	var build model.Build
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		getReq := httptest.NewRequest(http.MethodGet, "/v1/builds/"+created.ID, nil)
		getW := httptest.NewRecorder()
		mux.ServeHTTP(getW, getReq)

		_ = json.NewDecoder(getW.Result().Body).Decode(&build)
		if build.Status == model.BuildStatusSucceeded || build.Status == model.BuildStatusFailed {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}

	if build.Status != model.BuildStatusSucceeded {
		t.Fatalf("expected build to succeed, got status %q (error: %s)", build.Status, build.ErrorMessage)
	}

	if len(build.Artifacts) < 1 {
		t.Fatal("expected at least one artifact")
	}
}
