// ---------------------------------------------------------------------------
// API types — subset of the console types, focused on exploration
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

export interface BuildLogEntry {
  timestamp: string;
  level: string;
  message: string;
  step: string;
}

// ---------------------------------------------------------------------------
// Configurable base URL (defaults to relative for same-origin / proxy)
// ---------------------------------------------------------------------------

let _baseUrl = "";

export function setBaseUrl(url: string): void {
  // Strip trailing slash for consistency
  _baseUrl = url.replace(/\/+$/, "");
}

export function getBaseUrl(): string {
  return _baseUrl;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${_baseUrl}${path}`;
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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Registry API — read-only exploration
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

// ---------------------------------------------------------------------------
// Environment Manager API — read-only exploration
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

export async function getEnvironment(id: string): Promise<Environment> {
  return request<Environment>(
    `/api/envmanager/v1/environments/${encodeURIComponent(id)}`,
  );
}

// ---------------------------------------------------------------------------
// Builder API — build log streaming
// ---------------------------------------------------------------------------

export function streamBuildLogs(
  buildId: string,
  onEntry: (entry: BuildLogEntry) => void,
  onError?: (err: Event) => void,
): EventSource {
  const url = `${_baseUrl}/api/builder/v1/builds/${encodeURIComponent(buildId)}/logs`;
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
