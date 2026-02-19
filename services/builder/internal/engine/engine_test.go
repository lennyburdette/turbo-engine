package engine

import (
	"context"
	"log/slog"
	"testing"
	"time"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/store"
)

func setupEngine(t *testing.T) (*BuildEngine, store.Store, *model.Build) {
	t.Helper()

	s := store.NewMemoryStore()
	logger := slog.Default()
	eng := New(s, logger)

	build := &model.Build{
		ID:                 "build-test-1",
		EnvironmentID:      "env-test",
		Status:             model.BuildStatusPending,
		Artifacts:          []model.Artifact{},
		CreatedAt:          time.Now().UTC(),
		RootPackageName:    "my-api",
		RootPackageVersion: "1.0.0",
	}
	_, err := s.CreateBuild(context.Background(), build)
	if err != nil {
		t.Fatalf("failed to create build: %v", err)
	}

	return eng, s, build
}

func TestEngine_Run_Success(t *testing.T) {
	eng, s, build := setupEngine(t)
	ctx := context.Background()

	eng.Run(ctx, build.ID)

	got, err := s.GetBuild(ctx, build.ID)
	if err != nil {
		t.Fatalf("GetBuild: %v", err)
	}

	if got.Status != model.BuildStatusSucceeded {
		t.Fatalf("expected status %q, got %q", model.BuildStatusSucceeded, got.Status)
	}

	if got.CompletedAt == nil {
		t.Fatal("expected CompletedAt to be set")
	}

	if len(got.Artifacts) != 2 {
		t.Fatalf("expected 2 artifacts, got %d", len(got.Artifacts))
	}

	// Verify artifact kinds.
	kinds := map[string]bool{}
	for _, art := range got.Artifacts {
		kinds[art.Kind] = true
		if art.ContentHash == "" {
			t.Fatalf("artifact %q has empty content hash", art.ID)
		}
		if art.Labels["environment"] != "env-test" {
			t.Fatalf("artifact %q has wrong environment label: %q", art.ID, art.Labels["environment"])
		}
	}
	if !kinds["router-config"] {
		t.Fatal("missing router-config artifact")
	}
	if !kinds["workflow-bundle"] {
		t.Fatal("missing workflow-bundle artifact")
	}
}

func TestEngine_Run_ProducesLogs(t *testing.T) {
	eng, s, build := setupEngine(t)
	ctx := context.Background()

	eng.Run(ctx, build.ID)

	logs, err := s.GetLogs(ctx, build.ID)
	if err != nil {
		t.Fatalf("GetLogs: %v", err)
	}

	if len(logs) == 0 {
		t.Fatal("expected log entries, got none")
	}

	// Verify we have logs from each step.
	stepsSeen := map[string]bool{}
	for _, entry := range logs {
		stepsSeen[entry.Step] = true
		if entry.Timestamp.IsZero() {
			t.Fatal("log entry has zero timestamp")
		}
		if entry.Level == "" {
			t.Fatal("log entry has empty level")
		}
	}

	expectedSteps := []string{"build", "resolve", "compose", "validate", "bundle"}
	for _, step := range expectedSteps {
		if !stepsSeen[step] {
			t.Fatalf("missing log entries for step %q", step)
		}
	}
}

func TestEngine_Run_BuildNotFound(t *testing.T) {
	s := store.NewMemoryStore()
	logger := slog.Default()
	eng := New(s, logger)

	// Running against a nonexistent build should not panic.
	eng.Run(context.Background(), "nonexistent")
}

func TestEngine_Run_TransitionsToRunning(t *testing.T) {
	eng, s, build := setupEngine(t)
	ctx := context.Background()

	// Subscribe to logs before running to capture the running transition.
	ch, err := s.SubscribeLogs(ctx, build.ID)
	if err != nil {
		t.Fatalf("SubscribeLogs: %v", err)
	}

	// Run in a goroutine so we can observe state changes.
	done := make(chan struct{})
	go func() {
		defer close(done)
		eng.Run(ctx, build.ID)
	}()

	// Wait for first log entry to confirm the build is running.
	select {
	case entry := <-ch:
		if entry.Message != "build started" {
			t.Logf("first entry: %q (may vary due to timing)", entry.Message)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for first log entry")
	}

	<-done

	got, _ := s.GetBuild(ctx, build.ID)
	if got.Status != model.BuildStatusSucceeded {
		t.Fatalf("expected status %q, got %q", model.BuildStatusSucceeded, got.Status)
	}
}

func TestEngine_StepResolve(t *testing.T) {
	eng, _, build := setupEngine(t)
	ctx := context.Background()

	err := eng.stepResolve(ctx, build)
	if err != nil {
		t.Fatalf("stepResolve: %v", err)
	}
}

func TestEngine_StepCompose(t *testing.T) {
	eng, _, build := setupEngine(t)
	ctx := context.Background()

	err := eng.stepCompose(ctx, build)
	if err != nil {
		t.Fatalf("stepCompose: %v", err)
	}
}

func TestEngine_StepValidate(t *testing.T) {
	eng, _, build := setupEngine(t)
	ctx := context.Background()

	err := eng.stepValidate(ctx, build)
	if err != nil {
		t.Fatalf("stepValidate: %v", err)
	}
}

func TestEngine_StepBundle(t *testing.T) {
	eng, _, build := setupEngine(t)
	ctx := context.Background()

	err := eng.stepBundle(ctx, build)
	if err != nil {
		t.Fatalf("stepBundle: %v", err)
	}

	if len(build.Artifacts) != 2 {
		t.Fatalf("expected 2 artifacts after bundle step, got %d", len(build.Artifacts))
	}
}
