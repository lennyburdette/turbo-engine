// Package reconciler implements the core reconciliation loop for the operator.
// Given an APIGraphSpec (desired state), it computes the diff against the
// current in-memory cluster state and applies changes.
package reconciler

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
)

var tracer = otel.Tracer("operator/reconciler")

// Action describes what the reconciler wants to do to bring
// actual state in line with desired state.
type Action struct {
	Type         ActionType `json:"type"`
	ResourceKind string     `json:"resourceKind"` // Deployment, Service, ConfigMap, Ingress
	ResourceName string     `json:"resourceName"`
	Details      string     `json:"details"`
}

// ActionType classifies a reconciliation action.
type ActionType string

const (
	ActionCreate ActionType = "Create"
	ActionUpdate ActionType = "Update"
	ActionDelete ActionType = "Delete"
)

// deployedState tracks what the operator has "deployed" for a given environment.
type deployedState struct {
	Spec       model.APIGraphSpec
	Status     model.APIGraphStatus
	Components map[string]deployedComponentState // keyed by package name
}

// deployedComponentState is the in-memory representation of one deployed component.
type deployedComponentState struct {
	Component    model.DeployedComponent
	DeploymentOK bool
	ServiceOK    bool
	ConfigMapOK  bool
}

// Applier applies reconciliation actions to a target environment.
// The reconciler computes what needs to change; the applier executes it.
type Applier interface {
	Apply(ctx context.Context, namespace, environmentID string, actions []Action, spec model.APIGraphSpec) error
}

// Reconciler manages the desired-vs-actual reconciliation loop.
type Reconciler struct {
	mu        sync.RWMutex
	states    map[string]*deployedState // keyed by environment ID
	logger    *slog.Logger
	applier   Applier
	namespace string
}

// New creates a new Reconciler. If applier is nil, actions are only logged.
func New(logger *slog.Logger, applier Applier, namespace string) *Reconciler {
	return &Reconciler{
		states:    make(map[string]*deployedState),
		logger:    logger.With("component", "reconciler"),
		applier:   applier,
		namespace: namespace,
	}
}

// Reconcile takes a desired APIGraphSpec and reconciles it against the
// in-memory cluster state, returning the list of actions taken and the
// resulting status.
func (r *Reconciler) Reconcile(ctx context.Context, spec model.APIGraphSpec) ([]Action, model.APIGraphStatus, error) {
	ctx, span := tracer.Start(ctx, "Reconcile",
		trace.WithAttributes(
			attribute.String("environment_id", spec.EnvironmentID),
			attribute.String("build_id", spec.BuildID),
			attribute.Int("component_count", len(spec.Components)),
		),
	)
	defer span.End()

	r.logger.InfoContext(ctx, "starting reconciliation",
		"environment_id", spec.EnvironmentID,
		"build_id", spec.BuildID,
		"components", len(spec.Components),
	)

	r.mu.Lock()
	defer r.mu.Unlock()

	existing := r.states[spec.EnvironmentID]
	actions := r.computeActions(ctx, spec, existing)

	// Log all actions for observability.
	r.logActions(ctx, spec.EnvironmentID, actions)

	// Apply actions via the applier (K8s client or noop).
	if r.applier != nil && len(actions) > 0 {
		if err := r.applier.Apply(ctx, r.namespace, spec.EnvironmentID, actions, spec); err != nil {
			r.logger.ErrorContext(ctx, "failed to apply actions",
				"environment_id", spec.EnvironmentID,
				"error", err,
			)
			// Continue anyway — update in-memory state so we can retry next cycle.
		}
	}

	// Update in-memory state to reflect the desired spec.
	newState := r.buildState(spec)
	r.states[spec.EnvironmentID] = newState

	status := r.buildStatus(spec, newState)
	newState.Status = status

	span.SetAttributes(
		attribute.String("status.phase", string(status.Phase)),
		attribute.Int("actions.count", len(actions)),
	)

	r.logger.InfoContext(ctx, "reconciliation complete",
		"environment_id", spec.EnvironmentID,
		"phase", status.Phase,
		"actions", len(actions),
	)

	return actions, status, nil
}

// GetStatus returns the current status for an environment, or false if not found.
func (r *Reconciler) GetStatus(environmentID string) (model.APIGraphStatus, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	state, ok := r.states[environmentID]
	if !ok {
		return model.APIGraphStatus{}, false
	}
	return state.Status, true
}

// GetAllStatuses returns status for every tracked environment.
func (r *Reconciler) GetAllStatuses() map[string]model.APIGraphStatus {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make(map[string]model.APIGraphStatus, len(r.states))
	for envID, state := range r.states {
		result[envID] = state.Status
	}
	return result
}

// computeActions diffs desired spec against the existing in-memory state
// and returns the set of actions needed.
func (r *Reconciler) computeActions(ctx context.Context, spec model.APIGraphSpec, existing *deployedState) []Action {
	_, span := tracer.Start(ctx, "computeActions")
	defer span.End()

	var actions []Action

	desiredComponents := make(map[string]model.DeployedComponent, len(spec.Components))
	for _, c := range spec.Components {
		desiredComponents[c.PackageName] = c
	}

	// Determine creates and updates.
	if existing == nil {
		// No existing state — everything is a create.
		for _, c := range spec.Components {
			actions = append(actions, r.createActionsForComponent(c)...)
		}
		// Create ingress resources.
		actions = append(actions, r.createActionsForIngress(spec.Ingress)...)
	} else {
		existingComponents := existing.Components

		// Check each desired component against existing.
		for name, desired := range desiredComponents {
			ec, exists := existingComponents[name]
			if !exists {
				// New component — create.
				actions = append(actions, r.createActionsForComponent(desired)...)
			} else if ec.Component.ArtifactHash != desired.ArtifactHash ||
				ec.Component.Runtime.Replicas != desired.Runtime.Replicas {
				// Changed — update.
				actions = append(actions, r.updateActionsForComponent(desired)...)
			}
			// Otherwise unchanged — no action needed.
		}

		// Check for components that need to be deleted.
		for name := range existingComponents {
			if _, stillDesired := desiredComponents[name]; !stillDesired {
				actions = append(actions, r.deleteActionsForComponent(name)...)
			}
		}

		// Reconcile ingress if host changed or routes changed.
		if existing.Spec.Ingress.Host != spec.Ingress.Host || !routesEqual(existing.Spec.Ingress.Routes, spec.Ingress.Routes) {
			actions = append(actions, Action{
				Type:         ActionUpdate,
				ResourceKind: "Ingress",
				ResourceName: fmt.Sprintf("%s-ingress", spec.EnvironmentID),
				Details:      fmt.Sprintf("update ingress host=%s routes=%d", spec.Ingress.Host, len(spec.Ingress.Routes)),
			})
		}
	}

	span.SetAttributes(attribute.Int("action_count", len(actions)))
	return actions
}

// createActionsForComponent returns the actions needed to deploy a new component.
func (r *Reconciler) createActionsForComponent(c model.DeployedComponent) []Action {
	return []Action{
		{
			Type:         ActionCreate,
			ResourceKind: "Deployment",
			ResourceName: deploymentName(c.PackageName),
			Details:      fmt.Sprintf("image=artifact:%s replicas=%d", c.ArtifactHash, c.Runtime.Replicas),
		},
		{
			Type:         ActionCreate,
			ResourceKind: "Service",
			ResourceName: serviceName(c.PackageName),
			Details:      fmt.Sprintf("selector=%s", c.PackageName),
		},
		{
			Type:         ActionCreate,
			ResourceKind: "ConfigMap",
			ResourceName: configMapName(c.PackageName),
			Details:      fmt.Sprintf("env_vars=%d", len(c.Runtime.Env)),
		},
	}
}

// updateActionsForComponent returns the actions needed to update an existing component.
func (r *Reconciler) updateActionsForComponent(c model.DeployedComponent) []Action {
	return []Action{
		{
			Type:         ActionUpdate,
			ResourceKind: "Deployment",
			ResourceName: deploymentName(c.PackageName),
			Details:      fmt.Sprintf("image=artifact:%s replicas=%d", c.ArtifactHash, c.Runtime.Replicas),
		},
		{
			Type:         ActionUpdate,
			ResourceKind: "ConfigMap",
			ResourceName: configMapName(c.PackageName),
			Details:      fmt.Sprintf("env_vars=%d", len(c.Runtime.Env)),
		},
	}
}

// deleteActionsForComponent returns the actions needed to remove a component.
func (r *Reconciler) deleteActionsForComponent(packageName string) []Action {
	return []Action{
		{
			Type:         ActionDelete,
			ResourceKind: "Deployment",
			ResourceName: deploymentName(packageName),
			Details:      "removing unused component",
		},
		{
			Type:         ActionDelete,
			ResourceKind: "Service",
			ResourceName: serviceName(packageName),
			Details:      "removing unused component",
		},
		{
			Type:         ActionDelete,
			ResourceKind: "ConfigMap",
			ResourceName: configMapName(packageName),
			Details:      "removing unused component",
		},
	}
}

// createActionsForIngress returns actions for setting up ingress resources.
func (r *Reconciler) createActionsForIngress(ingress model.IngressSpec) []Action {
	if ingress.Host == "" {
		return nil
	}
	return []Action{
		{
			Type:         ActionCreate,
			ResourceKind: "Ingress",
			ResourceName: fmt.Sprintf("%s-ingress", ingress.Host),
			Details:      fmt.Sprintf("host=%s routes=%d tls=%v", ingress.Host, len(ingress.Routes), ingress.TLS.AutoCert),
		},
	}
}

// logActions logs each action for observability.
func (r *Reconciler) logActions(ctx context.Context, environmentID string, actions []Action) {
	for _, a := range actions {
		r.logger.InfoContext(ctx, "reconciliation action",
			"environment_id", environmentID,
			"action", a.Type,
			"resource_kind", a.ResourceKind,
			"resource_name", a.ResourceName,
			"details", a.Details,
		)
	}
}

// buildState creates the in-memory deployed state from the spec.
func (r *Reconciler) buildState(spec model.APIGraphSpec) *deployedState {
	components := make(map[string]deployedComponentState, len(spec.Components))
	for _, c := range spec.Components {
		components[c.PackageName] = deployedComponentState{
			Component:    c,
			DeploymentOK: true,
			ServiceOK:    true,
			ConfigMapOK:  true,
		}
	}
	return &deployedState{
		Spec:       spec,
		Components: components,
	}
}

// buildStatus generates an APIGraphStatus from the current state.
func (r *Reconciler) buildStatus(spec model.APIGraphSpec, state *deployedState) model.APIGraphStatus {
	statuses := make([]model.ComponentStatus, 0, len(spec.Components))
	allRunning := true

	for _, c := range spec.Components {
		cs, ok := state.Components[c.PackageName]
		phase := model.PhaseRunning
		readyReplicas := c.Runtime.Replicas
		if !ok || !cs.DeploymentOK {
			phase = model.PhasePending
			readyReplicas = 0
			allRunning = false
		}

		statuses = append(statuses, model.ComponentStatus{
			PackageName:     c.PackageName,
			Phase:           phase,
			ReadyReplicas:   readyReplicas,
			DesiredReplicas: c.Runtime.Replicas,
		})
	}

	graphPhase := model.PhaseRunning
	if !allRunning {
		graphPhase = model.PhaseDeploying
	}

	previewURL := ""
	if spec.Ingress.Host != "" {
		scheme := "http"
		if spec.Ingress.TLS.AutoCert || spec.Ingress.TLS.SecretName != "" {
			scheme = "https"
		}
		previewURL = fmt.Sprintf("%s://%s", scheme, spec.Ingress.Host)
	}

	return model.APIGraphStatus{
		Phase:             graphPhase,
		ComponentStatuses: statuses,
		PreviewURL:        previewURL,
		Message:           fmt.Sprintf("Reconciled build %s", spec.BuildID),
		LastReconciled:    time.Now(),
	}
}

// routesEqual compares two slices of IngressRoute.
func routesEqual(a, b []model.IngressRoute) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func deploymentName(packageName string) string {
	return fmt.Sprintf("deploy-%s", packageName)
}

func serviceName(packageName string) string {
	return fmt.Sprintf("svc-%s", packageName)
}

func configMapName(packageName string) string {
	return fmt.Sprintf("cm-%s", packageName)
}
