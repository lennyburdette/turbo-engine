// Package orchestrator implements the fork workflow:
// create env -> apply overrides -> call builder -> call operator -> provide preview URL.
package orchestrator

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/model"
	"github.com/lennyburdette/turbo-engine/services/envmanager/internal/store"
)

var tracer = otel.Tracer("envmanager/orchestrator")

// BuilderClient is the interface for triggering builds.
// In production this calls the Builder service; in tests it is mocked.
type BuilderClient interface {
	// TriggerBuild starts a build for the given environment and returns a build ID.
	TriggerBuild(ctx context.Context, env model.Environment) (buildID string, err error)
}

// OperatorClient is the interface for deploying built artifacts.
// In production this calls the Operator service; in tests it is mocked.
type OperatorClient interface {
	// Deploy deploys the given build and returns a preview URL.
	Deploy(ctx context.Context, env model.Environment, buildID string) (previewURL string, err error)

	// Teardown removes deployed resources for an environment.
	Teardown(ctx context.Context, envID string) error
}

// Orchestrator coordinates the fork workflow using a store, builder, and operator.
type Orchestrator struct {
	store    store.Store
	builder  BuilderClient
	operator OperatorClient
	logger   *slog.Logger
}

// New creates a new Orchestrator.
func New(s store.Store, b BuilderClient, o OperatorClient, logger *slog.Logger) *Orchestrator {
	return &Orchestrator{
		store:    s,
		builder:  b,
		operator: o,
		logger:   logger,
	}
}

// generateID produces a random hex ID.
func generateID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(fmt.Sprintf("failed to generate random ID: %v", err))
	}
	return hex.EncodeToString(b)
}

// CreateEnvironment creates a new environment and persists it.
// If overrides are provided and triggerBuild is implicit, it also triggers a build.
func (o *Orchestrator) CreateEnvironment(ctx context.Context, req model.CreateEnvironmentRequest) (model.Environment, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.CreateEnvironment",
		trace.WithAttributes(attribute.String("env.name", req.Name)))
	defer span.End()

	now := time.Now().UTC()
	env := model.Environment{
		ID:              generateID(),
		Name:            req.Name,
		BaseRootPackage: req.BaseRootPackage,
		BaseRootVersion: req.BaseRootVersion,
		Branch:          req.Branch,
		CreatedBy:       req.CreatedBy,
		Status:          model.StatusCreating,
		Overrides:       req.Overrides,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	created, err := o.store.Create(ctx, env)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, fmt.Errorf("create environment: %w", err)
	}

	o.logger.InfoContext(ctx, "environment created",
		slog.String("id", created.ID),
		slog.String("name", created.Name))

	// If overrides were provided at creation time, kick off a build.
	if len(req.Overrides) > 0 {
		built, err := o.buildAndDeploy(ctx, created)
		if err != nil {
			o.logger.ErrorContext(ctx, "initial build failed",
				slog.String("id", created.ID),
				slog.String("error", err.Error()))
			// Mark as failed but still return the environment.
			created.Status = model.StatusFailed
			created.UpdatedAt = time.Now().UTC()
			if _, updateErr := o.store.Update(ctx, created); updateErr != nil {
				o.logger.ErrorContext(ctx, "failed to update status after build failure",
					slog.String("error", updateErr.Error()))
			}
			return created, nil
		}
		return built, nil
	}

	// No overrides yet; mark as ready.
	created.Status = model.StatusReady
	created.UpdatedAt = time.Now().UTC()
	created, err = o.store.Update(ctx, created)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, fmt.Errorf("update environment status: %w", err)
	}

	return created, nil
}

// GetEnvironment retrieves an environment by ID.
func (o *Orchestrator) GetEnvironment(ctx context.Context, id string) (model.Environment, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.GetEnvironment",
		trace.WithAttributes(attribute.String("env.id", id)))
	defer span.End()

	env, err := o.store.Get(ctx, id)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, err
	}
	return env, nil
}

// ListEnvironments lists environments with optional filtering.
func (o *Orchestrator) ListEnvironments(ctx context.Context, filter store.ListFilter) (store.ListResult, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.ListEnvironments")
	defer span.End()

	return o.store.List(ctx, filter)
}

// DeleteEnvironment tears down and deletes an environment.
func (o *Orchestrator) DeleteEnvironment(ctx context.Context, id string) error {
	ctx, span := tracer.Start(ctx, "Orchestrator.DeleteEnvironment",
		trace.WithAttributes(attribute.String("env.id", id)))
	defer span.End()

	env, err := o.store.Get(ctx, id)
	if err != nil {
		span.RecordError(err)
		return err
	}

	// Mark as deleting.
	env.Status = model.StatusDeleting
	env.UpdatedAt = time.Now().UTC()
	if _, err := o.store.Update(ctx, env); err != nil {
		span.RecordError(err)
		return fmt.Errorf("update environment status: %w", err)
	}

	// Teardown deployed resources.
	if err := o.operator.Teardown(ctx, id); err != nil {
		o.logger.ErrorContext(ctx, "teardown failed",
			slog.String("id", id),
			slog.String("error", err.Error()))
		span.RecordError(err)
		// Continue with deletion even if teardown fails.
	}

	if err := o.store.Delete(ctx, id); err != nil {
		span.RecordError(err)
		return fmt.Errorf("delete environment: %w", err)
	}

	o.logger.InfoContext(ctx, "environment deleted", slog.String("id", id))
	return nil
}

// ApplyOverrides applies package overrides to an environment and optionally triggers a build.
func (o *Orchestrator) ApplyOverrides(ctx context.Context, id string, req model.ApplyOverridesRequest) (model.Environment, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.ApplyOverrides",
		trace.WithAttributes(attribute.String("env.id", id)))
	defer span.End()

	env, err := o.store.Get(ctx, id)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, err
	}

	env.Overrides = req.Overrides
	env.UpdatedAt = time.Now().UTC()

	env, err = o.store.Update(ctx, env)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, fmt.Errorf("update overrides: %w", err)
	}

	o.logger.InfoContext(ctx, "overrides applied",
		slog.String("id", id),
		slog.Int("overrideCount", len(req.Overrides)))

	if req.TriggerBuild {
		built, err := o.buildAndDeploy(ctx, env)
		if err != nil {
			o.logger.ErrorContext(ctx, "build after override failed",
				slog.String("id", id),
				slog.String("error", err.Error()))
			env.Status = model.StatusFailed
			env.UpdatedAt = time.Now().UTC()
			if _, updateErr := o.store.Update(ctx, env); updateErr != nil {
				o.logger.ErrorContext(ctx, "failed to update status after build failure",
					slog.String("error", updateErr.Error()))
			}
			return env, nil
		}
		return built, nil
	}

	return env, nil
}

// Promote promotes overrides from a fork environment back to the base.
// Returns the list of promoted packages.
func (o *Orchestrator) Promote(ctx context.Context, id string) (model.PromoteResponse, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.Promote",
		trace.WithAttributes(attribute.String("env.id", id)))
	defer span.End()

	env, err := o.store.Get(ctx, id)
	if err != nil {
		span.RecordError(err)
		return model.PromoteResponse{}, err
	}

	// Build the promote response from current overrides.
	promoted := make([]model.PromotedPackage, 0, len(env.Overrides))
	for _, override := range env.Overrides {
		promoted = append(promoted, model.PromotedPackage{
			Name:    override.PackageName,
			Version: env.BaseRootVersion,
		})
	}

	// Clear overrides after promotion.
	env.Overrides = nil
	env.UpdatedAt = time.Now().UTC()
	if _, err := o.store.Update(ctx, env); err != nil {
		span.RecordError(err)
		return model.PromoteResponse{}, fmt.Errorf("clear overrides after promote: %w", err)
	}

	o.logger.InfoContext(ctx, "environment promoted",
		slog.String("id", id),
		slog.Int("promotedCount", len(promoted)))

	return model.PromoteResponse{PromotedPackages: promoted}, nil
}

// buildAndDeploy triggers a build and then deploys the result.
func (o *Orchestrator) buildAndDeploy(ctx context.Context, env model.Environment) (model.Environment, error) {
	ctx, span := tracer.Start(ctx, "Orchestrator.buildAndDeploy",
		trace.WithAttributes(attribute.String("env.id", env.ID)))
	defer span.End()

	// Mark as building.
	env.Status = model.StatusBuilding
	env.UpdatedAt = time.Now().UTC()
	env, err := o.store.Update(ctx, env)
	if err != nil {
		return model.Environment{}, fmt.Errorf("update status to building: %w", err)
	}

	// Call the builder.
	buildID, err := o.builder.TriggerBuild(ctx, env)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, fmt.Errorf("trigger build: %w", err)
	}

	env.CurrentBuildID = buildID
	env.UpdatedAt = time.Now().UTC()
	env, err = o.store.Update(ctx, env)
	if err != nil {
		return model.Environment{}, fmt.Errorf("update build ID: %w", err)
	}

	// Call the operator to deploy.
	previewURL, err := o.operator.Deploy(ctx, env, buildID)
	if err != nil {
		span.RecordError(err)
		return model.Environment{}, fmt.Errorf("deploy: %w", err)
	}

	// Mark as ready with preview URL.
	env.Status = model.StatusReady
	env.PreviewURL = previewURL
	env.UpdatedAt = time.Now().UTC()
	env, err = o.store.Update(ctx, env)
	if err != nil {
		return model.Environment{}, fmt.Errorf("update after deploy: %w", err)
	}

	o.logger.InfoContext(ctx, "build and deploy complete",
		slog.String("id", env.ID),
		slog.String("buildId", buildID),
		slog.String("previewUrl", previewURL))

	return env, nil
}
