package store

import (
	"context"
	"testing"
	"time"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
)

func newTestBuild() *model.Build {
	return &model.Build{
		ID:            "build-1",
		EnvironmentID: "env-1",
		Status:        model.BuildStatusPending,
		Artifacts:     []model.Artifact{},
		CreatedAt:     time.Now().UTC(),
	}
}

func TestCreateAndGetBuild(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	created, err := s.CreateBuild(ctx, b)
	if err != nil {
		t.Fatalf("CreateBuild: %v", err)
	}
	if created.ID != b.ID {
		t.Fatalf("expected ID %q, got %q", b.ID, created.ID)
	}

	got, err := s.GetBuild(ctx, b.ID)
	if err != nil {
		t.Fatalf("GetBuild: %v", err)
	}
	if got.ID != b.ID {
		t.Fatalf("expected ID %q, got %q", b.ID, got.ID)
	}
	if got.Status != model.BuildStatusPending {
		t.Fatalf("expected status %q, got %q", model.BuildStatusPending, got.Status)
	}
}

func TestGetBuildNotFound(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	_, err := s.GetBuild(ctx, "nonexistent")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestUpdateBuild(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	_, _ = s.CreateBuild(ctx, b)

	b.Status = model.BuildStatusRunning
	updated, err := s.UpdateBuild(ctx, b)
	if err != nil {
		t.Fatalf("UpdateBuild: %v", err)
	}
	if updated.Status != model.BuildStatusRunning {
		t.Fatalf("expected status %q, got %q", model.BuildStatusRunning, updated.Status)
	}

	got, _ := s.GetBuild(ctx, b.ID)
	if got.Status != model.BuildStatusRunning {
		t.Fatalf("persisted status should be %q, got %q", model.BuildStatusRunning, got.Status)
	}
}

func TestUpdateBuildNotFound(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	_, err := s.UpdateBuild(ctx, b)
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestAppendAndGetLogs(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	_, _ = s.CreateBuild(ctx, b)

	entry := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "starting build",
		Step:      "resolve",
	}
	if err := s.AppendLog(ctx, b.ID, entry); err != nil {
		t.Fatalf("AppendLog: %v", err)
	}

	logs, err := s.GetLogs(ctx, b.ID)
	if err != nil {
		t.Fatalf("GetLogs: %v", err)
	}
	if len(logs) != 1 {
		t.Fatalf("expected 1 log entry, got %d", len(logs))
	}
	if logs[0].Message != "starting build" {
		t.Fatalf("unexpected message: %q", logs[0].Message)
	}
}

func TestAppendLogNotFound(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	entry := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "hello",
		Step:      "resolve",
	}
	err := s.AppendLog(ctx, "nonexistent", entry)
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestGetLogsNotFound(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	_, err := s.GetLogs(ctx, "nonexistent")
	if err != ErrNotFound {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

func TestSubscribeLogs_LiveBuild(t *testing.T) {
	s := NewMemoryStore()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	b := newTestBuild()
	b.Status = model.BuildStatusRunning
	_, _ = s.CreateBuild(ctx, b)

	// Append a log entry before subscribing.
	entry1 := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "pre-subscribe entry",
		Step:      "resolve",
	}
	_ = s.AppendLog(ctx, b.ID, entry1)

	ch, err := s.SubscribeLogs(ctx, b.ID)
	if err != nil {
		t.Fatalf("SubscribeLogs: %v", err)
	}

	// Should receive the existing entry first.
	select {
	case got := <-ch:
		if got.Message != "pre-subscribe entry" {
			t.Fatalf("expected pre-subscribe entry, got %q", got.Message)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for existing log entry")
	}

	// Append a new entry and verify it arrives.
	entry2 := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "post-subscribe entry",
		Step:      "compose",
	}
	_ = s.AppendLog(ctx, b.ID, entry2)

	select {
	case got := <-ch:
		if got.Message != "post-subscribe entry" {
			t.Fatalf("expected post-subscribe entry, got %q", got.Message)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for new log entry")
	}

	// Complete the build; channel should close.
	b.Status = model.BuildStatusSucceeded
	_, _ = s.UpdateBuild(ctx, b)

	select {
	case _, ok := <-ch:
		if ok {
			t.Fatal("expected channel to be closed")
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for channel close")
	}
}

func TestSubscribeLogs_CompletedBuild(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	b.Status = model.BuildStatusSucceeded
	_, _ = s.CreateBuild(ctx, b)

	entry := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     "info",
		Message:   "done",
		Step:      "bundle",
	}
	_ = s.AppendLog(ctx, b.ID, entry)

	ch, err := s.SubscribeLogs(ctx, b.ID)
	if err != nil {
		t.Fatalf("SubscribeLogs: %v", err)
	}

	// Should receive existing entry then close.
	got := <-ch
	if got.Message != "done" {
		t.Fatalf("expected 'done', got %q", got.Message)
	}

	_, ok := <-ch
	if ok {
		t.Fatal("expected channel to be closed for completed build")
	}
}

func TestCreateBuildIsolation(t *testing.T) {
	s := NewMemoryStore()
	ctx := context.Background()

	b := newTestBuild()
	b.Artifacts = []model.Artifact{{ID: "art-1", Kind: "router-config", ContentHash: "abc"}}
	_, _ = s.CreateBuild(ctx, b)

	// Mutate the original — should not affect stored copy.
	b.Artifacts[0].Kind = "mutated"

	got, _ := s.GetBuild(ctx, b.ID)
	if got.Artifacts[0].Kind != "router-config" {
		t.Fatalf("store mutation leaked: got kind %q", got.Artifacts[0].Kind)
	}
}
