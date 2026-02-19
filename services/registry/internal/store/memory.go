package store

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/lennyburdette/turbo-engine/services/registry/internal/model"
)

// MemoryStore is an in-memory implementation of the Store interface.
// It is safe for concurrent use via sync.RWMutex and suitable for
// development, testing, and single-instance deployments.
type MemoryStore struct {
	mu       sync.RWMutex
	packages map[string]model.Package // keyed by compositeKey(namespace, name, version)
	counter  int64
}

// NewMemoryStore returns a ready-to-use in-memory store.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		packages: make(map[string]model.Package),
	}
}

// compositeKey produces a unique key for a package version.
func compositeKey(namespace, name, version string) string {
	return fmt.Sprintf("%s/%s@%s", namespace, name, version)
}

// Publish stores a new package version in memory.
func (m *MemoryStore) Publish(_ context.Context, pkg model.Package) (model.Package, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := compositeKey(pkg.Namespace, pkg.Name, pkg.Version)
	if _, exists := m.packages[key]; exists {
		return model.Package{}, ErrAlreadyExists
	}

	m.counter++
	now := time.Now().UTC()
	pkg.ID = fmt.Sprintf("pkg_%d", m.counter)
	pkg.CreatedAt = now
	pkg.UpdatedAt = now
	pkg.Yanked = false

	m.packages[key] = pkg
	return pkg, nil
}

// Get retrieves a single package version.
func (m *MemoryStore) Get(_ context.Context, namespace, name, version string) (model.Package, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	key := compositeKey(namespace, name, version)
	pkg, ok := m.packages[key]
	if !ok {
		return model.Package{}, ErrNotFound
	}
	return pkg, nil
}

// List returns a page of packages matching the given filters.
// Pagination is implemented using offset-based page tokens (the token is the
// stringified index into the sorted result set).
func (m *MemoryStore) List(_ context.Context, req model.ListPackagesRequest) (model.ListPackagesResponse, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Collect all matching packages.
	var matched []model.Package
	for _, pkg := range m.packages {
		if req.Namespace != "" && pkg.Namespace != req.Namespace {
			continue
		}
		if req.Kind != "" && pkg.Kind != req.Kind {
			continue
		}
		if req.NamePrefix != "" && !strings.HasPrefix(pkg.Name, req.NamePrefix) {
			continue
		}
		matched = append(matched, pkg)
	}

	// Deterministic ordering: by namespace, name, version.
	sort.Slice(matched, func(i, j int) bool {
		ki := compositeKey(matched[i].Namespace, matched[i].Name, matched[i].Version)
		kj := compositeKey(matched[j].Namespace, matched[j].Name, matched[j].Version)
		return ki < kj
	})

	// Parse page token as an integer offset.
	startIdx := 0
	if req.PageToken != "" {
		if _, err := fmt.Sscanf(req.PageToken, "%d", &startIdx); err != nil {
			startIdx = 0
		}
	}

	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}

	// Slice the result set.
	if startIdx > len(matched) {
		startIdx = len(matched)
	}
	end := startIdx + pageSize
	if end > len(matched) {
		end = len(matched)
	}

	page := matched[startIdx:end]

	var nextToken string
	if end < len(matched) {
		nextToken = fmt.Sprintf("%d", end)
	}

	return model.ListPackagesResponse{
		Packages:      page,
		NextPageToken: nextToken,
	}, nil
}

// Resolve returns the transitive dependency tree for a package version.
// It performs a breadth-first traversal of dependencies. Packages that cannot
// be found in the store are silently skipped (they may live in an external
// registry).
func (m *MemoryStore) Resolve(_ context.Context, namespace, name, version string) ([]model.Package, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	rootKey := compositeKey(namespace, name, version)
	root, ok := m.packages[rootKey]
	if !ok {
		return nil, ErrNotFound
	}

	visited := map[string]bool{rootKey: true}
	var resolved []model.Package

	// BFS queue seeded with the root's dependencies.
	queue := make([]model.Dependency, len(root.Dependencies))
	copy(queue, root.Dependencies)

	for len(queue) > 0 {
		dep := queue[0]
		queue = queue[1:]

		// For simplicity, treat versionConstraint as an exact version match.
		// A real implementation would use semver range resolution.
		depKey := compositeKey(namespace, dep.PackageName, dep.VersionConstraint)
		if visited[depKey] {
			continue
		}
		visited[depKey] = true

		pkg, exists := m.packages[depKey]
		if !exists {
			continue
		}
		resolved = append(resolved, pkg)
		queue = append(queue, pkg.Dependencies...)
	}

	return resolved, nil
}

// Yank soft-deletes a package version by setting its Yanked flag.
func (m *MemoryStore) Yank(_ context.Context, namespace, name, version string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := compositeKey(namespace, name, version)
	pkg, ok := m.packages[key]
	if !ok {
		return ErrNotFound
	}

	pkg.Yanked = true
	pkg.UpdatedAt = time.Now().UTC()
	m.packages[key] = pkg
	return nil
}
