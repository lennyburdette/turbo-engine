package store

import (
	"context"
	"errors"
	"sync"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
)

// ErrNotFound is returned when a requested build does not exist.
var ErrNotFound = errors.New("build not found")

// subscriber is a channel-based listener for new log entries.
type subscriber struct {
	ch     chan model.BuildLogEntry
	cancel context.CancelFunc
}

// MemoryStore is a thread-safe in-memory implementation of Store.
type MemoryStore struct {
	mu          sync.RWMutex
	builds      map[string]*model.Build
	logs        map[string][]model.BuildLogEntry
	subscribers map[string][]*subscriber
}

// NewMemoryStore returns a new MemoryStore.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		builds:      make(map[string]*model.Build),
		logs:        make(map[string][]model.BuildLogEntry),
		subscribers: make(map[string][]*subscriber),
	}
}

// CreateBuild stores a new build.
func (m *MemoryStore) CreateBuild(_ context.Context, build *model.Build) (*model.Build, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	copied := *build
	copied.Artifacts = make([]model.Artifact, len(build.Artifacts))
	copy(copied.Artifacts, build.Artifacts)
	m.builds[build.ID] = &copied
	m.logs[build.ID] = nil

	ret := copied
	ret.Artifacts = make([]model.Artifact, len(copied.Artifacts))
	copy(ret.Artifacts, copied.Artifacts)
	return &ret, nil
}

// GetBuild retrieves a build by ID.
func (m *MemoryStore) GetBuild(_ context.Context, id string) (*model.Build, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	b, ok := m.builds[id]
	if !ok {
		return nil, ErrNotFound
	}
	copied := *b
	// Deep-copy artifacts slice so the caller cannot mutate store state.
	copied.Artifacts = make([]model.Artifact, len(b.Artifacts))
	copy(copied.Artifacts, b.Artifacts)
	return &copied, nil
}

// UpdateBuild replaces the stored build.
func (m *MemoryStore) UpdateBuild(_ context.Context, build *model.Build) (*model.Build, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.builds[build.ID]; !ok {
		return nil, ErrNotFound
	}
	copied := *build
	copied.Artifacts = make([]model.Artifact, len(build.Artifacts))
	copy(copied.Artifacts, build.Artifacts)
	m.builds[build.ID] = &copied

	// If the build is terminal, close all subscriber channels.
	if build.Status == model.BuildStatusSucceeded || build.Status == model.BuildStatusFailed {
		m.closeSubscribers(build.ID)
	}

	ret := copied
	return &ret, nil
}

// AppendLog adds a log entry and fans it out to subscribers.
func (m *MemoryStore) AppendLog(_ context.Context, buildID string, entry model.BuildLogEntry) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.builds[buildID]; !ok {
		return ErrNotFound
	}

	m.logs[buildID] = append(m.logs[buildID], entry)

	// Fan out to subscribers.
	for _, sub := range m.subscribers[buildID] {
		select {
		case sub.ch <- entry:
		default:
			// Drop if subscriber is slow; prevents blocking the build.
		}
	}

	return nil
}

// GetLogs returns all log entries for a build.
func (m *MemoryStore) GetLogs(_ context.Context, buildID string) ([]model.BuildLogEntry, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if _, ok := m.builds[buildID]; !ok {
		return nil, ErrNotFound
	}

	entries := m.logs[buildID]
	out := make([]model.BuildLogEntry, len(entries))
	copy(out, entries)
	return out, nil
}

// SubscribeLogs returns a channel that receives new log entries as they are
// appended. The channel is closed when the build reaches a terminal state or
// when the provided context is cancelled.
func (m *MemoryStore) SubscribeLogs(ctx context.Context, buildID string) (<-chan model.BuildLogEntry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	b, ok := m.builds[buildID]
	if !ok {
		return nil, ErrNotFound
	}

	ch := make(chan model.BuildLogEntry, 64)

	// If the build is already terminal, return existing logs and close immediately.
	if b.Status == model.BuildStatusSucceeded || b.Status == model.BuildStatusFailed {
		go func() {
			for _, entry := range m.logs[buildID] {
				ch <- entry
			}
			close(ch)
		}()
		return ch, nil
	}

	// Send existing logs first.
	existing := m.logs[buildID]
	for _, entry := range existing {
		ch <- entry
	}

	subCtx, cancel := context.WithCancel(ctx)
	sub := &subscriber{ch: ch, cancel: cancel}
	m.subscribers[buildID] = append(m.subscribers[buildID], sub)

	// When the caller's context is done, remove the subscriber.
	go func() {
		<-subCtx.Done()
		m.mu.Lock()
		defer m.mu.Unlock()
		m.removeSubscriber(buildID, sub)
	}()

	return ch, nil
}

// closeSubscribers closes all subscriber channels for a build.
// Must be called with m.mu held.
func (m *MemoryStore) closeSubscribers(buildID string) {
	for _, sub := range m.subscribers[buildID] {
		sub.cancel()
		close(sub.ch)
	}
	delete(m.subscribers, buildID)
}

// removeSubscriber removes a single subscriber from the list.
// Must be called with m.mu held.
func (m *MemoryStore) removeSubscriber(buildID string, target *subscriber) {
	subs := m.subscribers[buildID]
	for i, sub := range subs {
		if sub == target {
			m.subscribers[buildID] = append(subs[:i], subs[i+1:]...)
			return
		}
	}
}
