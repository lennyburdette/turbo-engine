// Package store defines the persistence interface for the Package Registry.
package store

import (
	"context"
	"errors"

	"github.com/lennyburdette/turbo-engine/services/registry/internal/model"
)

// Standard errors returned by Store implementations.
var (
	ErrNotFound      = errors.New("package not found")
	ErrAlreadyExists = errors.New("package version already exists")
)

// Store is the persistence interface for packages in the registry.
// Implementations must be safe for concurrent use.
type Store interface {
	// Publish stores a new package version. Returns ErrAlreadyExists if the
	// exact name+namespace+version combination already exists.
	Publish(ctx context.Context, pkg model.Package) (model.Package, error)

	// Get retrieves a single package by namespace, name, and version.
	// Returns ErrNotFound if no matching package exists.
	Get(ctx context.Context, namespace, name, version string) (model.Package, error)

	// List returns a page of packages matching the given filters.
	List(ctx context.Context, req model.ListPackagesRequest) (model.ListPackagesResponse, error)

	// Resolve returns the transitive dependency tree for the given package.
	// Returns ErrNotFound if the root package does not exist.
	Resolve(ctx context.Context, namespace, name, version string) ([]model.Package, error)

	// Yank soft-deletes a package version. Returns ErrNotFound if the package
	// does not exist.
	Yank(ctx context.Context, namespace, name, version string) error
}
