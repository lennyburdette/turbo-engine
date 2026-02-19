package orchestrator_test

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/orchestrator"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

// --- Mock Builder ---

type mockBuilder struct {
	buildID string
	err     error
	called  int
}

func (m *mockBuilder) TriggerBuild(_ context.Context, _ model.Environment) (string, error) {
	m.called++
	return m.buildID, m.err
}

// --- Mock Operator ---

type mockOperator struct {
	previewURL  string
	deployErr   error
	teardownErr error
	deployCalls int
	teardownIDs []string
}

func (m *mockOperator) Deploy(_ context.Context, _ model.Environment, _ string) (string, error) {
	m.deployCalls++
	return m.previewURL, m.deployErr
}

func (m *mockOperator) Teardown(_ context.Context, envID string) error {
	m.teardownIDs = append(m.teardownIDs, envID)
	return m.teardownErr
}

// --- Helpers ---

func newTestOrchestrator(b orchestrator.BuilderClient, o orchestrator.OperatorClient) (*orchestrator.Orchestrator, store.Store) {
	s := store.NewMemoryStore()
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
	return orchestrator.New(s, b, o, logger), s
}

// --- Tests ---

func TestCreateEnvironment_NoOverrides(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	env, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
		CreatedBy:       "alice",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.ID == "" {
		t.Fatal("expected non-empty ID")
	}
	if env.Status != model.StatusReady {
		t.Fatalf("expected status ready, got %s", env.Status)
	}
	if b.called != 0 {
		t.Fatalf("expected builder not called, but called %d times", b.called)
	}
}

func TestCreateEnvironment_WithOverrides_BuildAndDeploy(t *testing.T) {
	b := &mockBuilder{buildID: "build-123"}
	o := &mockOperator{previewURL: "https://preview.example.com/env-1"}
	orch, _ := newTestOrchestrator(b, o)

	env, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
		Overrides: []model.PackageOverride{
			{PackageName: "users-subgraph", Schema: "type User { id: ID! }"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.Status != model.StatusReady {
		t.Fatalf("expected status ready, got %s", env.Status)
	}
	if env.CurrentBuildID != "build-123" {
		t.Fatalf("expected buildId build-123, got %s", env.CurrentBuildID)
	}
	if env.PreviewURL != "https://preview.example.com/env-1" {
		t.Fatalf("expected previewUrl, got %s", env.PreviewURL)
	}
	if b.called != 1 {
		t.Fatalf("expected builder called once, got %d", b.called)
	}
	if o.deployCalls != 1 {
		t.Fatalf("expected operator deploy called once, got %d", o.deployCalls)
	}
}

func TestCreateEnvironment_BuildFailure(t *testing.T) {
	b := &mockBuilder{err: errors.New("build failed")}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	env, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
		Overrides: []model.PackageOverride{
			{PackageName: "users-subgraph"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if env.Status != model.StatusFailed {
		t.Fatalf("expected status failed, got %s", env.Status)
	}
}

func TestGetEnvironment(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	created, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	got, err := orch.GetEnvironment(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.ID != created.ID {
		t.Fatalf("expected ID %s, got %s", created.ID, got.ID)
	}
}

func TestGetEnvironment_NotFound(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	_, err := orch.GetEnvironment(context.Background(), "nonexistent")
	if !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestDeleteEnvironment(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	created, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	err = orch.DeleteEnvironment(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(o.teardownIDs) != 1 || o.teardownIDs[0] != created.ID {
		t.Fatalf("expected teardown called with env ID %s, got %v", created.ID, o.teardownIDs)
	}

	_, err = orch.GetEnvironment(context.Background(), created.ID)
	if !errors.Is(err, store.ErrNotFound) {
		t.Fatalf("expected ErrNotFound after delete, got %v", err)
	}
}

func TestApplyOverrides_WithBuild(t *testing.T) {
	b := &mockBuilder{buildID: "build-456"}
	o := &mockOperator{previewURL: "https://preview.example.com/env-1"}
	orch, _ := newTestOrchestrator(b, o)

	created, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	updated, err := orch.ApplyOverrides(context.Background(), created.ID, model.ApplyOverridesRequest{
		Overrides: []model.PackageOverride{
			{PackageName: "users-subgraph", Schema: "type User { id: ID! name: String! }"},
		},
		TriggerBuild: true,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Status != model.StatusReady {
		t.Fatalf("expected status ready, got %s", updated.Status)
	}
	if updated.CurrentBuildID != "build-456" {
		t.Fatalf("expected buildId build-456, got %s", updated.CurrentBuildID)
	}
	if len(updated.Overrides) != 1 {
		t.Fatalf("expected 1 override, got %d", len(updated.Overrides))
	}
}

func TestApplyOverrides_WithoutBuild(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	created, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	updated, err := orch.ApplyOverrides(context.Background(), created.ID, model.ApplyOverridesRequest{
		Overrides: []model.PackageOverride{
			{PackageName: "users-subgraph"},
		},
		TriggerBuild: false,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Status != model.StatusReady {
		t.Fatalf("expected status ready, got %s", updated.Status)
	}
	if b.called != 0 {
		t.Fatalf("expected builder not called, got %d", b.called)
	}
}

func TestPromote(t *testing.T) {
	b := &mockBuilder{buildID: "build-789"}
	o := &mockOperator{previewURL: "https://preview.example.com"}
	orch, _ := newTestOrchestrator(b, o)

	created, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
		Name:            "test-env",
		BaseRootPackage: "root-pkg",
		BaseRootVersion: "1.0.0",
		Overrides: []model.PackageOverride{
			{PackageName: "users-subgraph", Schema: "type User { id: ID! }"},
			{PackageName: "products-subgraph", Schema: "type Product { id: ID! }"},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	resp, err := orch.Promote(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.PromotedPackages) != 2 {
		t.Fatalf("expected 2 promoted packages, got %d", len(resp.PromotedPackages))
	}
	if resp.PromotedPackages[0].Name != "users-subgraph" {
		t.Fatalf("expected first promoted package users-subgraph, got %s", resp.PromotedPackages[0].Name)
	}

	// Verify overrides are cleared after promotion.
	env, err := orch.GetEnvironment(context.Background(), created.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(env.Overrides) != 0 {
		t.Fatalf("expected overrides cleared after promote, got %d", len(env.Overrides))
	}
}

func TestListEnvironments(t *testing.T) {
	b := &mockBuilder{}
	o := &mockOperator{}
	orch, _ := newTestOrchestrator(b, o)

	for i := 0; i < 3; i++ {
		_, err := orch.CreateEnvironment(context.Background(), model.CreateEnvironmentRequest{
			Name:            "env-" + string(rune('a'+i)),
			BaseRootPackage: "root-pkg",
			Branch:          "main",
		})
		if err != nil {
			t.Fatalf("unexpected error creating env: %v", err)
		}
	}

	result, err := orch.ListEnvironments(context.Background(), store.ListFilter{Branch: "main"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Environments) != 3 {
		t.Fatalf("expected 3, got %d", len(result.Environments))
	}
}
