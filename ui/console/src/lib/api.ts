// ---------------------------------------------------------------------------
// API types — derived from the OpenAPI specs
// ---------------------------------------------------------------------------

export interface Package {
  id: string;
  name: string;
  namespace: string;
  kind: string;
  version: string;
  schema: string;
  upstreamConfig?: UpstreamConfig;
  dependencies?: Dependency[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpstreamConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface Dependency {
  packageName: string;
  versionConstraint: string;
}

export interface ListPackagesResponse {
  packages: Package[];
  nextPageToken?: string;
}

export interface PublishRequest {
  package: Omit<Package, "id" | "createdAt" | "updatedAt">;
}

export interface Environment {
  id: string;
  name: string;
  baseRootPackage: string;
  baseRootVersion: string;
  branch: string;
  createdBy: string;
  status: "creating" | "ready" | "building" | "failed" | "deleting";
  overrides?: PackageOverride[];
  currentBuildId?: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageOverride {
  packageName: string;
  schema: string;
}

export interface ListEnvironmentsResponse {
  environments: Environment[];
  nextPageToken?: string;
}

export interface CreateEnvironmentRequest {
  name: string;
  baseRootPackage: string;
  baseRootVersion?: string;
  branch?: string;
  createdBy?: string;
  overrides?: PackageOverride[];
}

export interface ApplyOverridesRequest {
  overrides: PackageOverride[];
  triggerBuild?: boolean;
}

export interface PromoteResponse {
  promotedPackages: Array<{ name: string; version: string }>;
}

export interface Build {
  id: string;
  environmentId: string;
  status: "pending" | "running" | "succeeded" | "failed";
  artifacts?: Artifact[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Artifact {
  id: string;
  kind: string;
  contentHash: string;
  labels?: Record<string, string>;
}

export interface CreateBuildRequest {
  environmentId: string;
  rootPackageName: string;
  rootPackageVersion: string;
}

export interface BuildLogEntry {
  timestamp: string;
  level: string;
  message: string;
  step: string;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Registry API
// ---------------------------------------------------------------------------

export interface ListPackagesParams {
  namespace?: string;
  kind?: string;
  namePrefix?: string;
  pageSize?: number;
  pageToken?: string;
}

export async function listPackages(
  params?: ListPackagesParams,
): Promise<ListPackagesResponse> {
  const qs = new URLSearchParams();
  if (params?.namespace) qs.set("namespace", params.namespace);
  if (params?.kind) qs.set("kind", params.kind);
  if (params?.namePrefix) qs.set("name_prefix", params.namePrefix);
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  if (params?.pageToken) qs.set("page_token", params.pageToken);
  const q = qs.toString();
  return request<ListPackagesResponse>(
    `/api/registry/v1/packages${q ? `?${q}` : ""}`,
  );
}

export async function getPackage(
  name: string,
  version: string = "latest",
): Promise<Package> {
  return request<Package>(
    `/api/registry/v1/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`,
  );
}

export async function publishPackage(req: PublishRequest): Promise<Package> {
  return request<Package>("/api/registry/v1/packages", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// ---------------------------------------------------------------------------
// Environment Manager API
// ---------------------------------------------------------------------------

export interface ListEnvironmentsParams {
  branch?: string;
  createdBy?: string;
  pageSize?: number;
  pageToken?: string;
}

export async function listEnvironments(
  params?: ListEnvironmentsParams,
): Promise<ListEnvironmentsResponse> {
  const qs = new URLSearchParams();
  if (params?.branch) qs.set("branch", params.branch);
  if (params?.createdBy) qs.set("created_by", params.createdBy);
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  if (params?.pageToken) qs.set("page_token", params.pageToken);
  const q = qs.toString();
  return request<ListEnvironmentsResponse>(
    `/api/envmanager/v1/environments${q ? `?${q}` : ""}`,
  );
}

export async function createEnvironment(
  req: CreateEnvironmentRequest,
): Promise<Environment> {
  return request<Environment>("/api/envmanager/v1/environments", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getEnvironment(id: string): Promise<Environment> {
  return request<Environment>(
    `/api/envmanager/v1/environments/${encodeURIComponent(id)}`,
  );
}

export async function deleteEnvironment(id: string): Promise<void> {
  return request<void>(
    `/api/envmanager/v1/environments/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function applyOverrides(
  environmentId: string,
  req: ApplyOverridesRequest,
): Promise<Environment> {
  return request<Environment>(
    `/api/envmanager/v1/environments/${encodeURIComponent(environmentId)}/overrides`,
    { method: "POST", body: JSON.stringify(req) },
  );
}

export async function promote(environmentId: string): Promise<PromoteResponse> {
  return request<PromoteResponse>(
    `/api/envmanager/v1/environments/${encodeURIComponent(environmentId)}/promote`,
    { method: "POST" },
  );
}

// ---------------------------------------------------------------------------
// Builder API
// ---------------------------------------------------------------------------

export async function getBuild(buildId: string): Promise<Build> {
  return request<Build>(
    `/api/builder/v1/builds/${encodeURIComponent(buildId)}`,
  );
}

export async function createBuild(req: CreateBuildRequest): Promise<Build> {
  return request<Build>("/api/builder/v1/builds", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * Stream build logs via SSE. Returns an EventSource instance that the caller
 * should close when done.
 */
export function streamBuildLogs(
  buildId: string,
  onEntry: (entry: BuildLogEntry) => void,
  onError?: (err: Event) => void,
): EventSource {
  const url = `/api/builder/v1/builds/${encodeURIComponent(buildId)}/logs`;
  const source = new EventSource(url);

  source.onmessage = (event) => {
    try {
      const entry = JSON.parse(event.data) as BuildLogEntry;
      onEntry(entry);
    } catch {
      // ignore malformed events
    }
  };

  source.onerror = (err) => {
    onError?.(err);
  };

  return source;
}
