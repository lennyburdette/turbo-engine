// Package model defines the core domain types for the Builder service.
package model

import (
	"time"
)

// BuildStatus represents the current state of a build.
type BuildStatus string

const (
	BuildStatusPending   BuildStatus = "pending"
	BuildStatusRunning   BuildStatus = "running"
	BuildStatusSucceeded BuildStatus = "succeeded"
	BuildStatusFailed    BuildStatus = "failed"
)

// Build represents a single build execution that turns a resolved dependency
// tree into deployable artifacts.
type Build struct {
	ID            string      `json:"id"`
	EnvironmentID string      `json:"environmentId"`
	Status        BuildStatus `json:"status"`
	Artifacts     []Artifact  `json:"artifacts"`
	ErrorMessage  string      `json:"errorMessage,omitempty"`
	CreatedAt     time.Time   `json:"createdAt"`
	CompletedAt   *time.Time  `json:"completedAt,omitempty"`

	// Input fields (from the create request).
	RootPackageName    string `json:"rootPackageName,omitempty"`
	RootPackageVersion string `json:"rootPackageVersion,omitempty"`
}

// Artifact represents a deployable artifact produced by a build.
type Artifact struct {
	ID          string            `json:"id"`
	Kind        string            `json:"kind"`
	ContentHash string            `json:"contentHash"`
	Labels      map[string]string `json:"labels,omitempty"`
}

// BuildLogEntry represents a single log line emitted during a build step.
type BuildLogEntry struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	Step      string    `json:"step"`
}

// CreateBuildRequest is the payload for POST /v1/builds.
type CreateBuildRequest struct {
	EnvironmentID      string `json:"environmentId"`
	RootPackageName    string `json:"rootPackageName"`
	RootPackageVersion string `json:"rootPackageVersion"`
}
