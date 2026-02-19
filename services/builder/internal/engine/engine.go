// Package engine orchestrates build pipelines. A build consists of sequential
// steps: resolve, compose, validate, and bundle. Each step emits structured
// log entries and may produce artifacts.
package engine

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log/slog"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/lennyburdette/turbo-engine/services/builder/internal/model"
	"github.com/lennyburdette/turbo-engine/services/builder/internal/store"
)

var tracer = otel.Tracer("builder/engine")

// BuildEngine runs the build pipeline for a given build ID.
type BuildEngine struct {
	store  store.Store
	logger *slog.Logger
}

// New returns a new BuildEngine.
func New(s store.Store, logger *slog.Logger) *BuildEngine {
	return &BuildEngine{
		store:  s,
		logger: logger,
	}
}

// Run executes the full build pipeline. It transitions the build through
// statuses (pending -> running -> succeeded/failed) and appends log entries
// for each step.
func (e *BuildEngine) Run(ctx context.Context, buildID string) {
	ctx, span := tracer.Start(ctx, "BuildEngine.Run",
		trace.WithAttributes(attribute.String("build.id", buildID)),
	)
	defer span.End()

	logger := e.logger.With("build_id", buildID)

	build, err := e.store.GetBuild(ctx, buildID)
	if err != nil {
		logger.ErrorContext(ctx, "failed to get build", "error", err)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return
	}

	// Transition to running.
	build.Status = model.BuildStatusRunning
	if _, err := e.store.UpdateBuild(ctx, build); err != nil {
		logger.ErrorContext(ctx, "failed to update build to running", "error", err)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return
	}

	e.log(ctx, buildID, "info", "build", "build started")

	// Execute each step in order.
	steps := []struct {
		name string
		fn   func(ctx context.Context, build *model.Build) error
	}{
		{"resolve", e.stepResolve},
		{"compose", e.stepCompose},
		{"validate", e.stepValidate},
		{"bundle", e.stepBundle},
	}

	for _, step := range steps {
		stepCtx, stepSpan := tracer.Start(ctx, "step."+step.name,
			trace.WithAttributes(
				attribute.String("build.id", buildID),
				attribute.String("step", step.name),
			),
		)

		e.log(stepCtx, buildID, "info", step.name, fmt.Sprintf("step %q started", step.name))

		if err := step.fn(stepCtx, build); err != nil {
			e.log(stepCtx, buildID, "error", step.name, fmt.Sprintf("step %q failed: %s", step.name, err))
			logger.ErrorContext(stepCtx, "step failed", "step", step.name, "error", err)

			build.Status = model.BuildStatusFailed
			build.ErrorMessage = fmt.Sprintf("step %q: %s", step.name, err)
			now := time.Now().UTC()
			build.CompletedAt = &now
			if _, updateErr := e.store.UpdateBuild(stepCtx, build); updateErr != nil {
				logger.ErrorContext(stepCtx, "failed to update build after step failure", "error", updateErr)
			}

			stepSpan.RecordError(err)
			stepSpan.SetStatus(codes.Error, err.Error())
			stepSpan.End()
			span.SetStatus(codes.Error, "build failed at step: "+step.name)
			return
		}

		e.log(stepCtx, buildID, "info", step.name, fmt.Sprintf("step %q completed", step.name))
		stepSpan.End()
	}

	// All steps succeeded.
	build.Status = model.BuildStatusSucceeded
	now := time.Now().UTC()
	build.CompletedAt = &now
	if _, err := e.store.UpdateBuild(ctx, build); err != nil {
		logger.ErrorContext(ctx, "failed to update build to succeeded", "error", err)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return
	}

	e.log(ctx, buildID, "info", "build", "build succeeded")
	logger.InfoContext(ctx, "build completed successfully")
}

// log appends a log entry to the store.
func (e *BuildEngine) log(ctx context.Context, buildID, level, step, message string) {
	entry := model.BuildLogEntry{
		Timestamp: time.Now().UTC(),
		Level:     level,
		Message:   message,
		Step:      step,
	}
	if err := e.store.AppendLog(ctx, buildID, entry); err != nil {
		e.logger.ErrorContext(ctx, "failed to append log",
			"build_id", buildID,
			"error", err,
		)
	}
}

// stepResolve simulates resolving the dependency tree from the registry.
func (e *BuildEngine) stepResolve(ctx context.Context, build *model.Build) error {
	_, span := tracer.Start(ctx, "resolve.execute")
	defer span.End()

	span.SetAttributes(
		attribute.String("root_package_name", build.RootPackageName),
		attribute.String("root_package_version", build.RootPackageVersion),
	)

	e.log(ctx, build.ID, "info", "resolve",
		fmt.Sprintf("resolving dependency tree for %s@%s", build.RootPackageName, build.RootPackageVersion))

	// In a real implementation this would call the Registry service to fetch
	// the full dependency graph. For now, we simulate a successful resolution.
	e.log(ctx, build.ID, "info", "resolve", "dependency tree resolved: 1 root package, 0 transitive dependencies")

	return nil
}

// stepCompose simulates composing subgraph schemas for GraphQL supergraphs.
func (e *BuildEngine) stepCompose(ctx context.Context, build *model.Build) error {
	_, span := tracer.Start(ctx, "compose.execute")
	defer span.End()

	e.log(ctx, build.ID, "info", "compose", "composing subgraph schemas into supergraph SDL")

	// In a real implementation this would invoke a composition engine
	// (e.g., Apollo Federation composition) to merge subgraph schemas.
	e.log(ctx, build.ID, "info", "compose", "composition complete: supergraph schema produced")

	return nil
}

// stepValidate simulates validating all schemas.
func (e *BuildEngine) stepValidate(ctx context.Context, build *model.Build) error {
	_, span := tracer.Start(ctx, "validate.execute")
	defer span.End()

	e.log(ctx, build.ID, "info", "validate", "validating schemas against API management rules")

	// In a real implementation this would run schema linting, breaking-change
	// detection, and contract validation.
	e.log(ctx, build.ID, "info", "validate", "all schemas valid: 0 errors, 0 warnings")

	return nil
}

// stepBundle produces deployable artifacts.
func (e *BuildEngine) stepBundle(ctx context.Context, build *model.Build) error {
	_, span := tracer.Start(ctx, "bundle.execute")
	defer span.End()

	e.log(ctx, build.ID, "info", "bundle", "bundling deployable artifacts")

	// Produce a router config artifact.
	routerConfig := fmt.Sprintf("router-config:%s:%s:%s",
		build.EnvironmentID, build.RootPackageName, build.RootPackageVersion)
	routerHash := fmt.Sprintf("%x", sha256.Sum256([]byte(routerConfig)))

	build.Artifacts = append(build.Artifacts, model.Artifact{
		ID:          fmt.Sprintf("art-%s-router", build.ID),
		Kind:        "router-config",
		ContentHash: routerHash[:16],
		Labels: map[string]string{
			"environment": build.EnvironmentID,
			"package":     build.RootPackageName,
			"version":     build.RootPackageVersion,
		},
	})

	// Produce a workflow bundle artifact.
	workflowBundle := fmt.Sprintf("workflow-bundle:%s:%s:%s",
		build.EnvironmentID, build.RootPackageName, build.RootPackageVersion)
	workflowHash := fmt.Sprintf("%x", sha256.Sum256([]byte(workflowBundle)))

	build.Artifacts = append(build.Artifacts, model.Artifact{
		ID:          fmt.Sprintf("art-%s-workflow", build.ID),
		Kind:        "workflow-bundle",
		ContentHash: workflowHash[:16],
		Labels: map[string]string{
			"environment": build.EnvironmentID,
			"package":     build.RootPackageName,
			"version":     build.RootPackageVersion,
		},
	})

	e.log(ctx, build.ID, "info", "bundle", fmt.Sprintf("produced %d artifacts", len(build.Artifacts)))

	return nil
}
