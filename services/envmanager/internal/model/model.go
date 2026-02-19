// Package model defines the core domain types for the Environment Manager service.
package model

import "time"

// EnvironmentStatus represents the lifecycle state of an environment.
type EnvironmentStatus string

const (
	StatusCreating EnvironmentStatus = "creating"
	StatusReady    EnvironmentStatus = "ready"
	StatusBuilding EnvironmentStatus = "building"
	StatusFailed   EnvironmentStatus = "failed"
	StatusDeleting EnvironmentStatus = "deleting"
)

// Environment represents an isolated fork of a base dependency tree
// used for testing proposed changes (like Netlify preview deploys).
type Environment struct {
	ID              string            `json:"id"`
	Name            string            `json:"name"`
	BaseRootPackage string            `json:"baseRootPackage"`
	BaseRootVersion string            `json:"baseRootVersion,omitempty"`
	Branch          string            `json:"branch,omitempty"`
	CreatedBy       string            `json:"createdBy,omitempty"`
	Status          EnvironmentStatus `json:"status"`
	Overrides       []PackageOverride `json:"overrides,omitempty"`
	CurrentBuildID  string            `json:"currentBuildId,omitempty"`
	PreviewURL      string            `json:"previewUrl,omitempty"`
	CreatedAt       time.Time         `json:"createdAt"`
	UpdatedAt       time.Time         `json:"updatedAt"`
}

// PackageOverride specifies a package-level override within an environment.
// For example, "use my modified schema for the users subgraph."
type PackageOverride struct {
	PackageName string `json:"packageName"`
	Schema      string `json:"schema,omitempty"`
}

// CreateEnvironmentRequest is the request body for creating a new environment.
type CreateEnvironmentRequest struct {
	Name            string            `json:"name"`
	BaseRootPackage string            `json:"baseRootPackage"`
	BaseRootVersion string            `json:"baseRootVersion,omitempty"`
	Branch          string            `json:"branch,omitempty"`
	CreatedBy       string            `json:"createdBy,omitempty"`
	Overrides       []PackageOverride `json:"overrides,omitempty"`
}

// ApplyOverridesRequest is the request body for applying overrides to an environment.
type ApplyOverridesRequest struct {
	Overrides    []PackageOverride `json:"overrides"`
	TriggerBuild bool              `json:"triggerBuild"`
}

// ListEnvironmentsResponse is the response for listing environments.
type ListEnvironmentsResponse struct {
	Environments  []Environment `json:"environments"`
	NextPageToken string        `json:"nextPageToken,omitempty"`
}

// PromotedPackage represents a package that was promoted from an environment to the base.
type PromotedPackage struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// PromoteResponse is the response for promoting environment overrides to the base.
type PromoteResponse struct {
	PromotedPackages []PromotedPackage `json:"promotedPackages"`
}
