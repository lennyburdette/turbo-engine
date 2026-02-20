package applier

import (
	"context"
	"log/slog"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/reconciler"
)

// NoopApplier logs actions without applying them.
// Used in dev mode when there is no Kubernetes cluster.
type NoopApplier struct {
	logger *slog.Logger
}

// NewNoopApplier creates a no-op applier that only logs.
func NewNoopApplier(logger *slog.Logger) *NoopApplier {
	return &NoopApplier{logger: logger.With("component", "noop-applier")}
}

// Apply logs each action but takes no real action.
func (a *NoopApplier) Apply(ctx context.Context, namespace, environmentID string, actions []reconciler.Action, spec model.APIGraphSpec) error {
	for _, action := range actions {
		a.logger.InfoContext(ctx, "would apply action (noop)",
			"environment_id", environmentID,
			"type", action.Type,
			"kind", action.ResourceKind,
			"name", action.ResourceName,
			"details", action.Details,
		)
	}
	return nil
}
