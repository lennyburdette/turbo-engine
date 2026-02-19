// Package store defines the persistence interface for environments.
package store

import (
	"context"
	"errors"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
)

// Common errors returned by Store implementations.
var (
	ErrNotFound      = errors.New("environment not found")
	ErrAlreadyExists = errors.New("environment already exists")
)

// ListFilter holds optional filters for listing environments.
type ListFilter struct {
	Branch    string
	CreatedBy string
	PageSize  int
	PageToken string
}

// ListResult holds the result of a list operation, including pagination.
type ListResult struct {
	Environments  []model.Environment
	NextPageToken string
}

// Store is the persistence interface for environment CRUD operations.
type Store interface {
	// Create persists a new environment. Returns ErrAlreadyExists if the ID is taken.
	Create(ctx context.Context, env model.Environment) (model.Environment, error)

	// Get retrieves an environment by ID. Returns ErrNotFound if it does not exist.
	Get(ctx context.Context, id string) (model.Environment, error)

	// List returns environments matching the given filter.
	List(ctx context.Context, filter ListFilter) (ListResult, error)

	// Update replaces an existing environment. Returns ErrNotFound if it does not exist.
	Update(ctx context.Context, env model.Environment) (model.Environment, error)

	// Delete removes an environment by ID. Returns ErrNotFound if it does not exist.
	Delete(ctx context.Context, id string) error
}
