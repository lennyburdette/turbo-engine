import chalk from "chalk";
import type { Config } from "./config.js";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    public readonly url: string,
  ) {
    const detail =
      typeof body === "object" && body !== null && "message" in body
        ? (body as { message: string }).message
        : JSON.stringify(body);
    super(`${status} ${statusText} — ${detail}`);
    this.name = "ApiError";
  }

  /** Return a user-friendly error string with suggestions. */
  pretty(): string {
    const lines: string[] = [
      chalk.red.bold(`API Error: ${this.status} ${this.statusText}`),
      chalk.dim(`  URL: ${this.url}`),
    ];

    if (typeof this.body === "object" && this.body !== null) {
      const b = this.body as Record<string, unknown>;
      if (b["message"]) lines.push(`  ${chalk.yellow(String(b["message"]))}`);
      if (b["details"]) lines.push(`  ${chalk.dim(String(b["details"]))}`);
    }

    // Suggestions based on status code
    if (this.status === 401 || this.status === 403) {
      lines.push("");
      lines.push(chalk.dim("Hint: Check your authentication token."));
      lines.push(chalk.dim("  Set TURBO_ENGINE_TOKEN or run: turbo-engine config set token <value>"));
    } else if (this.status === 404) {
      lines.push("");
      lines.push(chalk.dim("Hint: The requested resource was not found."));
      lines.push(chalk.dim("  Verify the name/ID is correct, and that the server is reachable."));
    } else if (this.status === 409) {
      lines.push("");
      lines.push(chalk.dim("Hint: A resource with that name/version already exists."));
      lines.push(chalk.dim("  Bump the version in your manifest or use a different name."));
    } else if (this.status >= 500) {
      lines.push("");
      lines.push(chalk.dim("Hint: This is a server-side error. Check the service logs."));
    }

    return lines.join("\n");
  }
}

export class ConnectionError extends Error {
  constructor(
    public readonly url: string,
    public readonly cause: unknown,
  ) {
    super(`Failed to connect to ${url}`);
    this.name = "ConnectionError";
  }

  pretty(): string {
    return [
      chalk.red.bold("Connection Error"),
      chalk.dim(`  URL: ${this.url}`),
      "",
      chalk.dim("Hint: Is the Turbo Engine platform running?"),
      chalk.dim("  Start it with: task dev:up"),
      chalk.dim("  Or set the correct API URLs via environment variables / --api-url."),
    ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// Generic fetch wrapper
// ---------------------------------------------------------------------------

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** If true, return the raw Response instead of parsing JSON. */
  raw?: boolean;
}

async function request<T = unknown>(
  baseUrl: string,
  path: string,
  token: string | undefined,
  opts: RequestOptions & { raw: true },
): Promise<Response>;
async function request<T = unknown>(
  baseUrl: string,
  path: string,
  token: string | undefined,
  opts?: RequestOptions,
): Promise<T>;
async function request<T = unknown>(
  baseUrl: string,
  path: string,
  token: string | undefined,
  opts: RequestOptions = {},
): Promise<T | Response> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

  const headers: Record<string, string> = {
    "User-Agent": "turbo-engine-cli/0.1.0",
    ...opts.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    throw new ConnectionError(url, err);
  }

  if (opts.raw) {
    return response;
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }
    throw new ApiError(response.status, response.statusText, body, url);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Typed API responses
// ---------------------------------------------------------------------------

export interface PackageVersion {
  name: string;
  kind: string;
  version: string;
  schema?: string;
  upstream?: unknown;
  dependencies?: Array<{ name: string; version?: string }>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PackageListItem {
  name: string;
  kind: string;
  latestVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  basePackage: string;
  branch?: string;
  overrides?: Record<string, string>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Build {
  id: string;
  packageName: string;
  packageVersion: string;
  status: "pending" | "running" | "succeeded" | "failed";
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

export class TurboEngineClient {
  constructor(private readonly config: Config) {}

  // ---- Registry (packages) ------------------------------------------------

  async publishPackage(manifest: Record<string, unknown>, schema?: string): Promise<PackageVersion> {
    const payload: Record<string, unknown> = { ...manifest };
    if (schema !== undefined) {
      payload["schemaBody"] = schema;
    }
    return request<PackageVersion>(
      this.config.registryUrl,
      "/v1/packages",
      this.config.token,
      { method: "POST", body: payload },
    );
  }

  async getPackage(name: string, version?: string): Promise<PackageVersion> {
    const path = version
      ? `/v1/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
      : `/v1/packages/${encodeURIComponent(name)}`;
    return request<PackageVersion>(this.config.registryUrl, path, this.config.token);
  }

  async listPackages(params?: { kind?: string; namespace?: string }): Promise<PackageListItem[]> {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set("kind", params.kind);
    if (params?.namespace) qs.set("namespace", params.namespace);
    const query = qs.toString();
    return request<PackageListItem[]>(
      this.config.registryUrl,
      `/v1/packages${query ? `?${query}` : ""}`,
      this.config.token,
    );
  }

  async searchPackages(prefix: string): Promise<PackageListItem[]> {
    return request<PackageListItem[]>(
      this.config.registryUrl,
      `/v1/packages/search?q=${encodeURIComponent(prefix)}`,
      this.config.token,
    );
  }

  // ---- Builder ------------------------------------------------------------

  async triggerBuild(packageName: string, packageVersion: string): Promise<Build> {
    return request<Build>(
      this.config.builderUrl,
      "/v1/builds",
      this.config.token,
      { method: "POST", body: { packageName, packageVersion } },
    );
  }

  async getBuildStatus(buildId: string): Promise<Build> {
    return request<Build>(
      this.config.builderUrl,
      `/v1/builds/${encodeURIComponent(buildId)}`,
      this.config.token,
    );
  }

  async streamBuildLogs(buildId: string): Promise<Response> {
    return request(
      this.config.builderUrl,
      `/v1/builds/${encodeURIComponent(buildId)}/logs`,
      this.config.token,
      {
        raw: true,
        headers: { Accept: "text/event-stream" },
      },
    );
  }

  // ---- Environment Manager ------------------------------------------------

  async createEnvironment(opts: {
    name: string;
    basePackage: string;
    branch?: string;
    overrides?: Record<string, string>;
  }): Promise<Environment> {
    return request<Environment>(
      this.config.envmanagerUrl,
      "/v1/environments",
      this.config.token,
      { method: "POST", body: opts },
    );
  }

  async getEnvironment(nameOrId: string): Promise<Environment> {
    return request<Environment>(
      this.config.envmanagerUrl,
      `/v1/environments/${encodeURIComponent(nameOrId)}`,
      this.config.token,
    );
  }

  async listEnvironments(): Promise<Environment[]> {
    return request<Environment[]>(
      this.config.envmanagerUrl,
      "/v1/environments",
      this.config.token,
    );
  }

  async deleteEnvironment(nameOrId: string): Promise<void> {
    await request<void>(
      this.config.envmanagerUrl,
      `/v1/environments/${encodeURIComponent(nameOrId)}`,
      this.config.token,
      { method: "DELETE" },
    );
  }

  async promoteEnvironment(nameOrId: string, targetEnv: string): Promise<Environment> {
    return request<Environment>(
      this.config.envmanagerUrl,
      `/v1/environments/${encodeURIComponent(nameOrId)}/promote`,
      this.config.token,
      { method: "POST", body: { target: targetEnv } },
    );
  }
}
