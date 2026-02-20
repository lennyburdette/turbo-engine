// Package applier provides implementations for applying reconciliation actions
// to a target environment (Kubernetes cluster or no-op for dev mode).
package applier

import (
	"context"
	"fmt"
	"log/slog"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"

	"github.com/lennyburdette/turbo-engine/services/operator/internal/model"
	"github.com/lennyburdette/turbo-engine/services/operator/internal/reconciler"
)

// defaultImage is used when the component spec doesn't include an explicit image.
const defaultImage = "registry.k8s.io/pause:3.9"

// componentImage returns the container image for a deployed component.
// Uses the runtime image if specified, otherwise falls back to the default.
func componentImage(comp model.DeployedComponent) string {
	if comp.Runtime.Image != "" {
		return comp.Runtime.Image
	}
	return defaultImage
}

// labels builds standard labels for operator-managed resources.
func labels(environmentID, componentName string) map[string]string {
	return map[string]string{
		"app.kubernetes.io/managed-by": "turbo-engine-operator",
		"turboengine.io/environment":   environmentID,
		"turboengine.io/component":     componentName,
		"app.kubernetes.io/name":       componentName,
		"app.kubernetes.io/instance":   environmentID,
	}
}

// findComponent looks up a component by its deployment resource name.
func findComponent(spec model.APIGraphSpec, resourceName string) (model.DeployedComponent, bool) {
	for _, c := range spec.Components {
		if fmt.Sprintf("deploy-%s", c.PackageName) == resourceName {
			return c, true
		}
	}
	return model.DeployedComponent{}, false
}

// findComponentBySvc looks up a component by its service resource name.
func findComponentBySvc(spec model.APIGraphSpec, resourceName string) (model.DeployedComponent, bool) {
	for _, c := range spec.Components {
		if fmt.Sprintf("svc-%s", c.PackageName) == resourceName {
			return c, true
		}
	}
	return model.DeployedComponent{}, false
}

// findComponentByCM looks up a component by its configmap resource name.
func findComponentByCM(spec model.APIGraphSpec, resourceName string) (model.DeployedComponent, bool) {
	for _, c := range spec.Components {
		if fmt.Sprintf("cm-%s", c.PackageName) == resourceName {
			return c, true
		}
	}
	return model.DeployedComponent{}, false
}

// KubernetesApplier applies actions to a real Kubernetes cluster.
type KubernetesApplier struct {
	client kubernetes.Interface
	logger *slog.Logger
}

// NewKubernetesApplier creates an applier backed by a Kubernetes client.
func NewKubernetesApplier(client kubernetes.Interface, logger *slog.Logger) *KubernetesApplier {
	return &KubernetesApplier{
		client: client,
		logger: logger.With("component", "k8s-applier"),
	}
}

// Apply creates/updates/deletes Kubernetes resources based on the action list.
func (a *KubernetesApplier) Apply(ctx context.Context, namespace, environmentID string, actions []reconciler.Action, spec model.APIGraphSpec) error {
	for _, action := range actions {
		a.logger.InfoContext(ctx, "applying action",
			"type", action.Type,
			"kind", action.ResourceKind,
			"name", action.ResourceName,
			"details", action.Details,
		)

		var err error
		switch {
		case action.ResourceKind == "Deployment" && action.Type == reconciler.ActionCreate:
			err = a.createDeployment(ctx, namespace, environmentID, action.ResourceName, spec)
		case action.ResourceKind == "Deployment" && action.Type == reconciler.ActionUpdate:
			err = a.updateDeployment(ctx, namespace, environmentID, action.ResourceName, spec)
		case action.ResourceKind == "Deployment" && action.Type == reconciler.ActionDelete:
			err = a.deleteDeployment(ctx, namespace, action.ResourceName)
		case action.ResourceKind == "Service" && action.Type == reconciler.ActionCreate:
			err = a.createService(ctx, namespace, environmentID, action.ResourceName, spec)
		case action.ResourceKind == "Service" && action.Type == reconciler.ActionDelete:
			err = a.deleteService(ctx, namespace, action.ResourceName)
		case action.ResourceKind == "ConfigMap" && action.Type == reconciler.ActionCreate:
			err = a.createConfigMap(ctx, namespace, environmentID, action.ResourceName, spec)
		case action.ResourceKind == "ConfigMap" && action.Type == reconciler.ActionUpdate:
			err = a.updateConfigMap(ctx, namespace, environmentID, action.ResourceName, spec)
		case action.ResourceKind == "ConfigMap" && action.Type == reconciler.ActionDelete:
			err = a.deleteConfigMap(ctx, namespace, action.ResourceName)
		default:
			a.logger.WarnContext(ctx, "unhandled action", "type", action.Type, "kind", action.ResourceKind)
		}

		if err != nil {
			a.logger.ErrorContext(ctx, "action failed",
				"type", action.Type,
				"kind", action.ResourceKind,
				"name", action.ResourceName,
				"error", err,
			)
			return fmt.Errorf("applying %s %s %s: %w", action.Type, action.ResourceKind, action.ResourceName, err)
		}
	}
	return nil
}

func (a *KubernetesApplier) createDeployment(ctx context.Context, ns, envID, name string, spec model.APIGraphSpec) error {
	comp, ok := findComponent(spec, name)
	if !ok {
		return fmt.Errorf("component not found for deployment %s", name)
	}

	replicas := comp.Runtime.Replicas
	lbls := labels(envID, comp.PackageName)

	deploy := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: ns,
			Labels:    lbls,
			Annotations: map[string]string{
				"turboengine.io/artifact-hash": comp.ArtifactHash,
				"turboengine.io/build-id":      spec.BuildID,
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app.kubernetes.io/name":     comp.PackageName,
					"app.kubernetes.io/instance": envID,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: lbls,
					Annotations: map[string]string{
						"turboengine.io/artifact-hash": comp.ArtifactHash,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  comp.PackageName,
							Image: componentImage(comp),
						},
					},
				},
			},
		},
	}

	_, err := a.client.AppsV1().Deployments(ns).Create(ctx, deploy, metav1.CreateOptions{})
	if errors.IsAlreadyExists(err) {
		return a.updateDeployment(ctx, ns, envID, name, spec)
	}
	return err
}

func (a *KubernetesApplier) updateDeployment(ctx context.Context, ns, envID, name string, spec model.APIGraphSpec) error {
	comp, ok := findComponent(spec, name)
	if !ok {
		return fmt.Errorf("component not found for deployment %s", name)
	}

	existing, err := a.client.AppsV1().Deployments(ns).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	replicas := comp.Runtime.Replicas
	existing.Spec.Replicas = &replicas
	if existing.Annotations == nil {
		existing.Annotations = make(map[string]string)
	}
	existing.Annotations["turboengine.io/artifact-hash"] = comp.ArtifactHash
	existing.Annotations["turboengine.io/build-id"] = spec.BuildID
	if existing.Spec.Template.Annotations == nil {
		existing.Spec.Template.Annotations = make(map[string]string)
	}
	existing.Spec.Template.Annotations["turboengine.io/artifact-hash"] = comp.ArtifactHash

	_, err = a.client.AppsV1().Deployments(ns).Update(ctx, existing, metav1.UpdateOptions{})
	return err
}

func (a *KubernetesApplier) deleteDeployment(ctx context.Context, ns, name string) error {
	err := a.client.AppsV1().Deployments(ns).Delete(ctx, name, metav1.DeleteOptions{})
	if errors.IsNotFound(err) {
		return nil
	}
	return err
}

func (a *KubernetesApplier) createService(ctx context.Context, ns, envID, name string, spec model.APIGraphSpec) error {
	comp, ok := findComponentBySvc(spec, name)
	if !ok {
		return fmt.Errorf("component not found for service %s", name)
	}

	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: ns,
			Labels:    labels(envID, comp.PackageName),
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app.kubernetes.io/name":     comp.PackageName,
				"app.kubernetes.io/instance": envID,
			},
			Type: corev1.ServiceTypeClusterIP,
			Ports: []corev1.ServicePort{
				{
					Name:       "http",
					Port:       8080,
					TargetPort: intstr.FromInt32(8080),
					Protocol:   corev1.ProtocolTCP,
				},
			},
		},
	}

	_, err := a.client.CoreV1().Services(ns).Create(ctx, svc, metav1.CreateOptions{})
	if errors.IsAlreadyExists(err) {
		return nil // Services are immutable-ish; skip update
	}
	return err
}

func (a *KubernetesApplier) deleteService(ctx context.Context, ns, name string) error {
	err := a.client.CoreV1().Services(ns).Delete(ctx, name, metav1.DeleteOptions{})
	if errors.IsNotFound(err) {
		return nil
	}
	return err
}

func (a *KubernetesApplier) createConfigMap(ctx context.Context, ns, envID, name string, spec model.APIGraphSpec) error {
	comp, ok := findComponentByCM(spec, name)
	if !ok {
		return fmt.Errorf("component not found for configmap %s", name)
	}

	cm := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: ns,
			Labels:    labels(envID, comp.PackageName),
		},
		Data: comp.Runtime.Env,
	}

	_, err := a.client.CoreV1().ConfigMaps(ns).Create(ctx, cm, metav1.CreateOptions{})
	if errors.IsAlreadyExists(err) {
		return a.updateConfigMap(ctx, ns, envID, name, spec)
	}
	return err
}

func (a *KubernetesApplier) updateConfigMap(ctx context.Context, ns, envID, name string, spec model.APIGraphSpec) error {
	comp, ok := findComponentByCM(spec, name)
	if !ok {
		return fmt.Errorf("component not found for configmap %s", name)
	}

	existing, err := a.client.CoreV1().ConfigMaps(ns).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return err
	}

	existing.Data = comp.Runtime.Env
	_, err = a.client.CoreV1().ConfigMaps(ns).Update(ctx, existing, metav1.UpdateOptions{})
	return err
}

func (a *KubernetesApplier) deleteConfigMap(ctx context.Context, ns, name string) error {
	err := a.client.CoreV1().ConfigMaps(ns).Delete(ctx, name, metav1.DeleteOptions{})
	if errors.IsNotFound(err) {
		return nil
	}
	return err
}
