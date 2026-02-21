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
// Gateway API — request execution
// ---------------------------------------------------------------------------

export interface GatewayResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
  durationMs: number;
  traceId?: string;
}

export async function executeGatewayRequest(
  method: string,
  path: string,
  body?: string,
  headers?: Record<string, string>,
): Promise<GatewayResponse> {
  const url = `${_baseUrl}/api/gateway${path}`;
  const start = performance.now();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: method !== "GET" && method !== "HEAD" ? body : undefined,
  });

  const durationMs = Math.round(performance.now() - start);
  const resHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    resHeaders[k] = v;
  });

  let resBody: unknown;
  const text = await res.text();
  try {
    resBody = JSON.parse(text);
  } catch {
    resBody = text;
  }

  // Extract trace ID from response body if present
  const traceId =
    typeof resBody === "object" && resBody !== null && "trace_id" in resBody
      ? String((resBody as Record<string, unknown>).trace_id)
      : undefined;

  return {
    status: res.status,
    headers: resHeaders,
    body: resBody,
    durationMs,
    traceId,
  };
}

// ---------------------------------------------------------------------------
// Jaeger API — trace querying
// ---------------------------------------------------------------------------

export interface JaegerTrace {
  traceID: string;
  spans: JaegerSpan[];
  processes: Record<string, JaegerProcess>;
}

export interface JaegerSpan {
  traceID: string;
  spanID: string;
  operationName: string;
  references: JaegerReference[];
  startTime: number; // microseconds
  duration: number; // microseconds
  tags: JaegerTag[];
  logs: JaegerLog[];
  processID: string;
}

export interface JaegerReference {
  refType: "CHILD_OF" | "FOLLOWS_FROM";
  traceID: string;
  spanID: string;
}

export interface JaegerTag {
  key: string;
  type: string;
  value: string | number | boolean;
}

export interface JaegerLog {
  timestamp: number;
  fields: JaegerTag[];
}

export interface JaegerProcess {
  serviceName: string;
  tags: JaegerTag[];
}

export interface JaegerTracesResponse {
  data: JaegerTrace[];
}

export interface JaegerServicesResponse {
  data: string[];
}

export async function listJaegerServices(): Promise<string[]> {
  const url = `${_baseUrl}/api/jaeger/api/services`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  const json = (await res.json()) as JaegerServicesResponse;
  return json.data ?? [];
}

export async function queryJaegerTraces(
  service: string,
  params?: {
    limit?: number;
    lookback?: string;
    start?: number;
    end?: number;
  },
): Promise<JaegerTrace[]> {
  const qs = new URLSearchParams();
  qs.set("service", service);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.lookback) qs.set("lookback", params.lookback);
  if (params?.start) qs.set("start", String(params.start));
  if (params?.end) qs.set("end", String(params.end));

  const url = `${_baseUrl}/api/jaeger/api/traces?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.text());
  const json = (await res.json()) as JaegerTracesResponse;
  return json.data ?? [];
}

export async function getJaegerTrace(
  traceId: string,
): Promise<JaegerTrace | null> {
  const url = `${_baseUrl}/api/jaeger/api/traces/${encodeURIComponent(traceId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new ApiError(res.status, await res.text());
  }
  const json = (await res.json()) as JaegerTracesResponse;
  return json.data?.[0] ?? null;
}

/** Extract all unique service names involved in a trace */
export function traceServiceNames(trace: JaegerTrace): string[] {
  const names = new Set<string>();
  for (const proc of Object.values(trace.processes)) {
    names.add(proc.serviceName);
  }
  return [...names].sort();
}

/** Compute total trace duration in ms */
export function traceDurationMs(trace: JaegerTrace): number {
  if (trace.spans.length === 0) return 0;
  const minStart = Math.min(...trace.spans.map((s) => s.startTime));
  const maxEnd = Math.max(
    ...trace.spans.map((s) => s.startTime + s.duration),
  );
  return Math.round((maxEnd - minStart) / 1000);
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
