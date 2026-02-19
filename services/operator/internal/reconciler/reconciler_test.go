package reconciler

import (
	"context"
	"log/slog"
	"testing"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
)

func newTestReconciler() *Reconciler {
	return New(slog.Default())
}

func makeSpec(envID, buildID string, components []model.DeployedComponent) model.APIGraphSpec {
	return model.APIGraphSpec{
		EnvironmentID: envID,
		BuildID:       buildID,
		RootPackage:   "root-pkg",
		Components:    components,
		Ingress: model.IngressSpec{
			Host: "api.example.com",
			Routes: []model.IngressRoute{
				{Path: "/graphql", TargetComponent: "gateway", TargetPort: 4000},
			},
			TLS: model.TLSConfig{AutoCert: true},
		},
	}
}

func makeComponent(name, version, hash string, replicas int32) model.DeployedComponent {
	return model.DeployedComponent{
		PackageName:    name,
		PackageVersion: version,
		Kind:           model.PackageKindGraphQLSubgraph,
		ArtifactHash:   hash,
		Runtime: model.ComponentRuntime{
			Replicas: replicas,
			Resources: model.ResourceRequirements{
				CPURequest:    "100m",
				MemoryRequest: "128Mi",
			},
			Env: map[string]string{
				"LOG_LEVEL": "info",
			},
		},
	}
}

func TestReconcile_InitialDeploy(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
		makeComponent("products-api", "1.0.0", "def456", 3),
	})

	actions, status, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Initial deploy: 2 components x 3 resources each (Deployment, Service, ConfigMap) + 1 Ingress = 7
	if got := len(actions); got != 7 {
		t.Errorf("expected 7 actions, got %d", got)
		for _, a := range actions {
			t.Logf("  %s %s %s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}

	// All actions should be Create.
	for _, a := range actions {
		if a.Type != ActionCreate {
			t.Errorf("expected all Create actions, got %s for %s/%s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}

	// Status should reflect running.
	if status.Phase != model.PhaseRunning {
		t.Errorf("expected phase Running, got %s", status.Phase)
	}

	if len(status.ComponentStatuses) != 2 {
		t.Fatalf("expected 2 component statuses, got %d", len(status.ComponentStatuses))
	}

	if status.PreviewURL != "https://api.example.com" {
		t.Errorf("expected preview URL https://api.example.com, got %s", status.PreviewURL)
	}

	if status.ComponentStatuses[0].ReadyReplicas != 2 {
		t.Errorf("expected 2 ready replicas for users-api, got %d", status.ComponentStatuses[0].ReadyReplicas)
	}
}

func TestReconcile_NoChanges(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	// First reconcile — initial deploy.
	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Second reconcile with the same spec — should produce no actions.
	actions, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if got := len(actions); got != 0 {
		t.Errorf("expected 0 actions for no-change reconcile, got %d", got)
		for _, a := range actions {
			t.Logf("  %s %s %s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}
}

func TestReconcile_UpdateComponent(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Update: new artifact hash.
	spec.BuildID = "build-2"
	spec.Components[0].ArtifactHash = "xyz789"

	actions, status, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Update should produce 2 actions: update Deployment + update ConfigMap.
	if got := len(actions); got != 2 {
		t.Errorf("expected 2 actions for update, got %d", got)
		for _, a := range actions {
			t.Logf("  %s %s %s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}

	for _, a := range actions {
		if a.Type != ActionUpdate {
			t.Errorf("expected Update action, got %s", a.Type)
		}
	}

	if status.Phase != model.PhaseRunning {
		t.Errorf("expected Running phase, got %s", status.Phase)
	}
}

func TestReconcile_ScaleComponent(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Scale replicas from 2 to 5.
	spec.Components[0].Runtime.Replicas = 5

	actions, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if got := len(actions); got != 2 {
		t.Errorf("expected 2 actions for scale, got %d", got)
	}

	foundDeploymentUpdate := false
	for _, a := range actions {
		if a.ResourceKind == "Deployment" && a.Type == ActionUpdate {
			foundDeploymentUpdate = true
		}
	}
	if !foundDeploymentUpdate {
		t.Error("expected a Deployment Update action for scaling")
	}
}

func TestReconcile_AddComponent(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Add a new component.
	spec.Components = append(spec.Components, makeComponent("orders-api", "1.0.0", "ghi012", 1))
	spec.BuildID = "build-2"

	actions, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// New component: 3 Create actions (Deployment, Service, ConfigMap).
	createCount := 0
	for _, a := range actions {
		if a.Type == ActionCreate {
			createCount++
		}
	}
	if createCount != 3 {
		t.Errorf("expected 3 Create actions for new component, got %d", createCount)
	}
}

func TestReconcile_RemoveComponent(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
		makeComponent("products-api", "1.0.0", "def456", 3),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Remove products-api.
	spec.Components = spec.Components[:1]
	spec.BuildID = "build-2"

	actions, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Deleted component: 3 Delete actions (Deployment, Service, ConfigMap).
	deleteCount := 0
	for _, a := range actions {
		if a.Type == ActionDelete {
			deleteCount++
		}
	}
	if deleteCount != 3 {
		t.Errorf("expected 3 Delete actions for removed component, got %d", deleteCount)
	}
}

func TestReconcile_IngressUpdate(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Change the ingress host.
	spec.Ingress.Host = "api-v2.example.com"

	actions, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	foundIngressUpdate := false
	for _, a := range actions {
		if a.ResourceKind == "Ingress" && a.Type == ActionUpdate {
			foundIngressUpdate = true
		}
	}
	if !foundIngressUpdate {
		t.Error("expected an Ingress Update action for host change")
		for _, a := range actions {
			t.Logf("  %s %s %s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}
}

func TestGetStatus_NotFound(t *testing.T) {
	r := newTestReconciler()

	_, ok := r.GetStatus("nonexistent")
	if ok {
		t.Error("expected GetStatus to return false for nonexistent environment")
	}
}

func TestGetStatus_AfterReconcile(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})

	_, _, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	status, ok := r.GetStatus("env-1")
	if !ok {
		t.Fatal("expected GetStatus to return true after reconcile")
	}

	if status.Phase != model.PhaseRunning {
		t.Errorf("expected Running phase, got %s", status.Phase)
	}

	if len(status.ComponentStatuses) != 1 {
		t.Fatalf("expected 1 component status, got %d", len(status.ComponentStatuses))
	}

	if status.ComponentStatuses[0].PackageName != "users-api" {
		t.Errorf("expected package name users-api, got %s", status.ComponentStatuses[0].PackageName)
	}
}

func TestGetAllStatuses(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec1 := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})
	spec2 := makeSpec("env-2", "build-2", []model.DeployedComponent{
		makeComponent("orders-api", "2.0.0", "def456", 1),
	})

	_, _, err := r.Reconcile(ctx, spec1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, _, err = r.Reconcile(ctx, spec2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	all := r.GetAllStatuses()
	if got := len(all); got != 2 {
		t.Fatalf("expected 2 statuses, got %d", got)
	}

	if _, ok := all["env-1"]; !ok {
		t.Error("expected env-1 in statuses")
	}
	if _, ok := all["env-2"]; !ok {
		t.Error("expected env-2 in statuses")
	}
}

func TestReconcile_PreviewURL_NoTLS(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := makeSpec("env-1", "build-1", []model.DeployedComponent{
		makeComponent("users-api", "1.0.0", "abc123", 2),
	})
	spec.Ingress.TLS = model.TLSConfig{} // No TLS

	_, status, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if status.PreviewURL != "http://api.example.com" {
		t.Errorf("expected http preview URL, got %s", status.PreviewURL)
	}
}

func TestReconcile_NoIngress(t *testing.T) {
	r := newTestReconciler()
	ctx := context.Background()

	spec := model.APIGraphSpec{
		EnvironmentID: "env-1",
		BuildID:       "build-1",
		RootPackage:   "root-pkg",
		Components: []model.DeployedComponent{
			makeComponent("users-api", "1.0.0", "abc123", 2),
		},
		Ingress: model.IngressSpec{}, // empty
	}

	actions, status, err := r.Reconcile(ctx, spec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have 3 component actions but no ingress action.
	if got := len(actions); got != 3 {
		t.Errorf("expected 3 actions (no ingress), got %d", got)
		for _, a := range actions {
			t.Logf("  %s %s %s", a.Type, a.ResourceKind, a.ResourceName)
		}
	}

	if status.PreviewURL != "" {
		t.Errorf("expected empty preview URL, got %s", status.PreviewURL)
	}
}
