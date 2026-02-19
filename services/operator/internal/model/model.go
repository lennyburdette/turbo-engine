// Package model defines the Go types mirroring the operator.proto definitions.
// These represent the CRD spec that the Kubernetes operator watches.
package model

import "time"

// PackageKind classifies what a package provides to the platform.
type PackageKind string

const (
	PackageKindUnspecified         PackageKind = "UNSPECIFIED"
	PackageKindGraphQLSubgraph     PackageKind = "GRAPHQL_SUBGRAPH"
	PackageKindOpenAPIService      PackageKind = "OPENAPI_SERVICE"
	PackageKindGraphQLOperations   PackageKind = "GRAPHQL_OPERATIONS"
	PackageKindPostmanCollection   PackageKind = "POSTMAN_COLLECTION"
	PackageKindGraphQLSupergraph   PackageKind = "GRAPHQL_SUPERGRAPH"
	PackageKindWorkflowEngine      PackageKind = "WORKFLOW_ENGINE"
	PackageKindIngress             PackageKind = "INGRESS"
	PackageKindEgress              PackageKind = "EGRESS"
)

// Phase represents the lifecycle state of a resource.
type Phase string

const (
	PhasePending   Phase = "Pending"
	PhaseDeploying Phase = "Deploying"
	PhaseRunning   Phase = "Running"
	PhaseDegraded  Phase = "Degraded"
	PhaseFailed    Phase = "Failed"
)

// APIGraphSpec is the top-level CRD representing a deployed dependency tree.
// It mirrors the APIGraphSpec protobuf message.
type APIGraphSpec struct {
	EnvironmentID string              `json:"environmentId"`
	BuildID       string              `json:"buildId"`
	RootPackage   string              `json:"rootPackage"`
	Components    []DeployedComponent `json:"components"`
	Ingress       IngressSpec         `json:"ingress"`
}

// DeployedComponent represents one package deployed as part of the graph.
type DeployedComponent struct {
	PackageName    string           `json:"packageName"`
	PackageVersion string           `json:"packageVersion"`
	Kind           PackageKind      `json:"kind"`
	ArtifactHash   string           `json:"artifactHash"`
	Runtime        ComponentRuntime `json:"runtime"`
}

// ComponentRuntime holds runtime configuration for a deployed component.
type ComponentRuntime struct {
	Replicas    int32             `json:"replicas"`
	Resources   ResourceRequirements `json:"resources"`
	Env         map[string]string `json:"env,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}

// ResourceRequirements defines CPU and memory limits/requests.
type ResourceRequirements struct {
	CPURequest    string `json:"cpuRequest,omitempty"`
	CPULimit      string `json:"cpuLimit,omitempty"`
	MemoryRequest string `json:"memoryRequest,omitempty"`
	MemoryLimit   string `json:"memoryLimit,omitempty"`
}

// IngressSpec configures gateway/ingress routing.
type IngressSpec struct {
	Host   string         `json:"host"`
	Routes []IngressRoute `json:"routes"`
	TLS    TLSConfig      `json:"tls,omitempty"`
}

// IngressRoute maps a path to a target component and port.
type IngressRoute struct {
	Path            string `json:"path"`
	TargetComponent string `json:"targetComponent"`
	TargetPort      int32  `json:"targetPort"`
}

// TLSConfig holds TLS settings for ingress.
type TLSConfig struct {
	SecretName string `json:"secretName,omitempty"`
	AutoCert   bool   `json:"autoCert,omitempty"`
}

// APIGraphStatus is the observed state written by the operator.
type APIGraphStatus struct {
	Phase             Phase             `json:"phase"`
	ComponentStatuses []ComponentStatus `json:"componentStatuses"`
	PreviewURL        string            `json:"previewUrl,omitempty"`
	Message           string            `json:"message,omitempty"`
	LastReconciled    time.Time         `json:"lastReconciled"`
}

// ComponentStatus reports the observed state of a single component.
type ComponentStatus struct {
	PackageName     string `json:"packageName"`
	Phase           Phase  `json:"phase"`
	ReadyReplicas   int32  `json:"readyReplicas"`
	DesiredReplicas int32  `json:"desiredReplicas"`
	Message         string `json:"message,omitempty"`
}
