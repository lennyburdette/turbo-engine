package store_test

import (
	"context"
	"testing"
	"time"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

func newEnv(id, name string) model.Environment {
	now := time.Now()
	return model.Environment{
		ID:              id,
		Name:            name,
		BaseRootPackage: "root-pkg",
		Status:          model.StatusCreating,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
}

func TestMemoryStore_CreateAndGet(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	env := newEnv("env-1", "test-env")
	created, err := s.Create(ctx, env)
	if err != nil {
		t.Fatalf("Create: unexpected error: %v", err)
	}
	if created.ID != "env-1" {
		t.Fatalf("Create: expected ID env-1, got %s", created.ID)
	}

	got, err := s.Get(ctx, "env-1")
	if err != nil {
		t.Fatalf("Get: unexpected error: %v", err)
	}
	if got.Name != "test-env" {
		t.Fatalf("Get: expected name test-env, got %s", got.Name)
	}
}

func TestMemoryStore_CreateDuplicate(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	env := newEnv("env-1", "test-env")
	if _, err := s.Create(ctx, env); err != nil {
		t.Fatalf("Create: unexpected error: %v", err)
	}

	_, err := s.Create(ctx, env)
	if err != store.ErrAlreadyExists {
		t.Fatalf("Create duplicate: expected ErrAlreadyExists, got %v", err)
	}
}

func TestMemoryStore_GetNotFound(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	_, err := s.Get(ctx, "nonexistent")
	if err != store.ErrNotFound {
		t.Fatalf("Get: expected ErrNotFound, got %v", err)
	}
}

func TestMemoryStore_Update(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	env := newEnv("env-1", "test-env")
	if _, err := s.Create(ctx, env); err != nil {
		t.Fatalf("Create: unexpected error: %v", err)
	}

	env.Status = model.StatusReady
	env.PreviewURL = "https://preview.example.com/env-1"
	updated, err := s.Update(ctx, env)
	if err != nil {
		t.Fatalf("Update: unexpected error: %v", err)
	}
	if updated.Status != model.StatusReady {
		t.Fatalf("Update: expected status ready, got %s", updated.Status)
	}
	if updated.PreviewURL != "https://preview.example.com/env-1" {
		t.Fatalf("Update: expected previewUrl, got %s", updated.PreviewURL)
	}
}

func TestMemoryStore_UpdateNotFound(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	env := newEnv("nonexistent", "nope")
	_, err := s.Update(ctx, env)
	if err != store.ErrNotFound {
		t.Fatalf("Update: expected ErrNotFound, got %v", err)
	}
}

func TestMemoryStore_Delete(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	env := newEnv("env-1", "test-env")
	if _, err := s.Create(ctx, env); err != nil {
		t.Fatalf("Create: unexpected error: %v", err)
	}

	if err := s.Delete(ctx, "env-1"); err != nil {
		t.Fatalf("Delete: unexpected error: %v", err)
	}

	_, err := s.Get(ctx, "env-1")
	if err != store.ErrNotFound {
		t.Fatalf("Get after delete: expected ErrNotFound, got %v", err)
	}
}

func TestMemoryStore_DeleteNotFound(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	err := s.Delete(ctx, "nonexistent")
	if err != store.ErrNotFound {
		t.Fatalf("Delete: expected ErrNotFound, got %v", err)
	}
}

func TestMemoryStore_List(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	now := time.Now()
	for i := 0; i < 5; i++ {
		env := model.Environment{
			ID:              "env-" + string(rune('a'+i)),
			Name:            "env-" + string(rune('a'+i)),
			BaseRootPackage: "root-pkg",
			Branch:          "main",
			CreatedBy:       "alice",
			Status:          model.StatusReady,
			CreatedAt:       now.Add(time.Duration(i) * time.Second),
			UpdatedAt:       now.Add(time.Duration(i) * time.Second),
		}
		if i >= 3 {
			env.Branch = "feature"
			env.CreatedBy = "bob"
		}
		if _, err := s.Create(ctx, env); err != nil {
			t.Fatalf("Create: unexpected error: %v", err)
		}
	}

	// List all.
	result, err := s.List(ctx, store.ListFilter{})
	if err != nil {
		t.Fatalf("List: unexpected error: %v", err)
	}
	if len(result.Environments) != 5 {
		t.Fatalf("List all: expected 5, got %d", len(result.Environments))
	}

	// Filter by branch.
	result, err = s.List(ctx, store.ListFilter{Branch: "main"})
	if err != nil {
		t.Fatalf("List by branch: unexpected error: %v", err)
	}
	if len(result.Environments) != 3 {
		t.Fatalf("List by branch: expected 3, got %d", len(result.Environments))
	}

	// Filter by created_by.
	result, err = s.List(ctx, store.ListFilter{CreatedBy: "bob"})
	if err != nil {
		t.Fatalf("List by createdBy: unexpected error: %v", err)
	}
	if len(result.Environments) != 2 {
		t.Fatalf("List by createdBy: expected 2, got %d", len(result.Environments))
	}
}

func TestMemoryStore_ListPagination(t *testing.T) {
	ctx := context.Background()
	s := store.NewMemoryStore()

	now := time.Now()
	for i := 0; i < 5; i++ {
		env := model.Environment{
			ID:              "env-" + string(rune('a'+i)),
			Name:            "env-" + string(rune('a'+i)),
			BaseRootPackage: "root-pkg",
			Status:          model.StatusReady,
			CreatedAt:       now.Add(time.Duration(i) * time.Second),
			UpdatedAt:       now.Add(time.Duration(i) * time.Second),
		}
		if _, err := s.Create(ctx, env); err != nil {
			t.Fatalf("Create: unexpected error: %v", err)
		}
	}

	// Page 1: size 2.
	result, err := s.List(ctx, store.ListFilter{PageSize: 2})
	if err != nil {
		t.Fatalf("List page 1: unexpected error: %v", err)
	}
	if len(result.Environments) != 2 {
		t.Fatalf("List page 1: expected 2, got %d", len(result.Environments))
	}
	if result.NextPageToken == "" {
		t.Fatal("List page 1: expected next page token")
	}

	// Page 2.
	result, err = s.List(ctx, store.ListFilter{PageSize: 2, PageToken: result.NextPageToken})
	if err != nil {
		t.Fatalf("List page 2: unexpected error: %v", err)
	}
	if len(result.Environments) != 2 {
		t.Fatalf("List page 2: expected 2, got %d", len(result.Environments))
	}

	// Page 3 (last page, only 1 remaining).
	result, err = s.List(ctx, store.ListFilter{PageSize: 2, PageToken: result.NextPageToken})
	if err != nil {
		t.Fatalf("List page 3: unexpected error: %v", err)
	}
	if len(result.Environments) != 1 {
		t.Fatalf("List page 3: expected 1, got %d", len(result.Environments))
	}
	if result.NextPageToken != "" {
		t.Fatalf("List page 3: expected empty next page token, got %s", result.NextPageToken)
	}
}
