package store

import (
	"context"
	"sort"
	"sync"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
)

// MemoryStore is a thread-safe in-memory implementation of Store.
// Suitable for development and testing.
type MemoryStore struct {
	mu   sync.RWMutex
	envs map[string]model.Environment
	// order preserves insertion order for deterministic listing.
	order []string
}

// NewMemoryStore creates a new empty in-memory store.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		envs: make(map[string]model.Environment),
	}
}

func (m *MemoryStore) Create(_ context.Context, env model.Environment) (model.Environment, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.envs[env.ID]; exists {
		return model.Environment{}, ErrAlreadyExists
	}

	m.envs[env.ID] = env
	m.order = append(m.order, env.ID)
	return env, nil
}

func (m *MemoryStore) Get(_ context.Context, id string) (model.Environment, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	env, ok := m.envs[id]
	if !ok {
		return model.Environment{}, ErrNotFound
	}
	return env, nil
}

func (m *MemoryStore) List(_ context.Context, filter ListFilter) (ListResult, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Collect all environments in insertion order.
	all := make([]model.Environment, 0, len(m.order))
	for _, id := range m.order {
		env := m.envs[id]
		if filter.Branch != "" && env.Branch != filter.Branch {
			continue
		}
		if filter.CreatedBy != "" && env.CreatedBy != filter.CreatedBy {
			continue
		}
		all = append(all, env)
	}

	// Sort by creation time descending (newest first).
	sort.Slice(all, func(i, j int) bool {
		return all[i].CreatedAt.After(all[j].CreatedAt)
	})

	// Apply pagination.
	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}

	startIdx := 0
	if filter.PageToken != "" {
		for i, e := range all {
			if e.ID == filter.PageToken {
				startIdx = i + 1
				break
			}
		}
	}

	end := startIdx + pageSize
	if end > len(all) {
		end = len(all)
	}

	page := all[startIdx:end]

	var nextToken string
	if end < len(all) {
		nextToken = page[len(page)-1].ID
	}

	return ListResult{
		Environments:  page,
		NextPageToken: nextToken,
	}, nil
}

func (m *MemoryStore) Update(_ context.Context, env model.Environment) (model.Environment, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.envs[env.ID]; !ok {
		return model.Environment{}, ErrNotFound
	}

	m.envs[env.ID] = env
	return env, nil
}

func (m *MemoryStore) Delete(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.envs[id]; !ok {
		return ErrNotFound
	}

	delete(m.envs, id)
	// Remove from order slice.
	for i, oid := range m.order {
		if oid == id {
			m.order = append(m.order[:i], m.order[i+1:]...)
			break
		}
	}
	return nil
}
