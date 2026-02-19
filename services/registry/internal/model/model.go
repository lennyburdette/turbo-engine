// Package model defines the domain types for the Package Registry service.
//
// TODO: Once protobuf generation is set up, replace these placeholder types
// with the generated Go structs from registry.proto. These types are designed
// to match the proto definitions and the OpenAPI spec at
// specs/openapi/registry.openapi.yaml.
package model

import "time"

// Package represents a versioned package in the registry.
type Package struct {
	ID             string            `json:"id"`
	Name           string            `json:"name"`
	Namespace      string            `json:"namespace"`
	Kind           string            `json:"kind"`
	Version        string            `json:"version"`
	Schema         string            `json:"schema"`
	UpstreamConfig *UpstreamConfig   `json:"upstreamConfig,omitempty"`
	Dependencies   []Dependency      `json:"dependencies,omitempty"`
	Metadata       map[string]string `json:"metadata,omitempty"`
	CreatedAt      time.Time         `json:"createdAt"`
	UpdatedAt      time.Time         `json:"updatedAt"`
	Yanked         bool              `json:"yanked"`
}

// Dependency describes a package dependency with a semver constraint.
type Dependency struct {
	PackageName       string `json:"packageName"`
	VersionConstraint string `json:"versionConstraint"`
}

// UpstreamConfig holds the upstream URL and headers for proxy/federation.
type UpstreamConfig struct {
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers,omitempty"`
}

// PublishRequest is the request body for publishing a package.
type PublishRequest struct {
	Package Package `json:"package"`
}

// ListPackagesRequest captures the query parameters for listing packages.
type ListPackagesRequest struct {
	Namespace  string `json:"namespace"`
	Kind       string `json:"kind"`
	NamePrefix string `json:"namePrefix"`
	PageSize   int    `json:"pageSize"`
	PageToken  string `json:"pageToken"`
}

// ListPackagesResponse is the response body for listing packages.
type ListPackagesResponse struct {
	Packages      []Package `json:"packages"`
	NextPageToken string    `json:"nextPageToken,omitempty"`
}

// ResolveDependenciesResponse is the response body for dependency resolution.
type ResolveDependenciesResponse struct {
	Packages []Package `json:"packages"`
}
