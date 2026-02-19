// Package store defines the persistence interface for builds and their logs.
package store

import (
	"context"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
)

// Store is the persistence interface for the Builder service.
type Store interface {
	// CreateBuild persists a new build and returns it.
	CreateBuild(ctx context.Context, build *model.Build) (*model.Build, error)

	// GetBuild retrieves a build by its ID. Returns ErrNotFound if the build
	// does not exist.
	GetBuild(ctx context.Context, id string) (*model.Build, error)

	// UpdateBuild replaces the stored build with the provided one.
	UpdateBuild(ctx context.Context, build *model.Build) (*model.Build, error)

	// AppendLog adds a log entry to the build identified by buildID.
	AppendLog(ctx context.Context, buildID string, entry model.BuildLogEntry) error

	// GetLogs returns all log entries for a build, ordered chronologically.
	GetLogs(ctx context.Context, buildID string) ([]model.BuildLogEntry, error)

	// SubscribeLogs returns a channel that receives new log entries in real-time
	// for the specified build. The channel is closed when the build completes or
	// the context is cancelled.
	SubscribeLogs(ctx context.Context, buildID string) (<-chan model.BuildLogEntry, error)
}
