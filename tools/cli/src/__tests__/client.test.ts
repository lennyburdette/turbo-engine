import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TurboEngineClient, ApiError, ConnectionError } from "../client.js";
import type { Config } from "../config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_CONFIG: Config = {
  registryUrl: "http://registry.test",
  builderUrl: "http://builder.test",
  envmanagerUrl: "http://envmanager.test",
  token: "test-token-123",
};

function mockFetch(response: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: unknown;
  text?: string;
  body?: ReadableStream | null;
}): void {
  const status = response.status ?? (response.ok === false ? 500 : 200);
  const statusText = response.statusText ?? (response.ok === false ? "Internal Server Error" : "OK");

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok ?? true,
      status,
      statusText,
      url: "http://test.url/path",
      json: vi.fn().mockResolvedValue(response.json ?? {}),
      text: vi.fn().mockResolvedValue(response.text ?? ""),
      body: response.body ?? null,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TurboEngineClient", () => {
  let client: TurboEngineClient;

  beforeEach(() => {
    client = new TurboEngineClient(TEST_CONFIG);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Authentication & headers -----------------------------------------

  describe("request headers", () => {
    it("sends Authorization header when token is set", async () => {
      mockFetch({ json: { name: "test", kind: "openapi-service", latestVersion: "1.0.0" } });
      await client.getPackage("test");

      const fetchMock = vi.mocked(fetch);
      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0]!;
      const headers = init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer test-token-123");
    });

    it("sends User-Agent header", async () => {
      mockFetch({ json: {} });
      await client.getPackage("test");

      const fetchMock = vi.mocked(fetch);
      const [, init] = fetchMock.mock.calls[0]!;
      const headers = init?.headers as Record<string, string>;
      expect(headers["User-Agent"]).toContain("turbo-engine-cli");
    });

    it("omits Authorization when token is undefined", async () => {
      const noTokenClient = new TurboEngineClient({
        ...TEST_CONFIG,
        token: undefined,
      });
      mockFetch({ json: {} });
      await noTokenClient.getPackage("test");

      const fetchMock = vi.mocked(fetch);
      const [, init] = fetchMock.mock.calls[0]!;
      const headers = init?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  // ---- Registry (packages) ------------------------------------------------

  describe("publishPackage", () => {
    it("POSTs manifest to /v1/packages", async () => {
      const mockResult = {
        name: "petstore/users-api",
        kind: "openapi-service",
        version: "1.0.0",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockFetch({ json: mockResult });

      const result = await client.publishPackage(
        { name: "petstore/users-api", kind: "openapi-service" },
        "openapi: 3.0.0",
      );

      expect(result.name).toBe("petstore/users-api");
      expect(result.version).toBe("1.0.0");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.name).toBe("petstore/users-api");
      expect(body.schemaBody).toBe("openapi: 3.0.0");
    });
  });

  describe("getPackage", () => {
    it("GETs /v1/packages/:name for latest", async () => {
      mockFetch({ json: { name: "test", version: "2.0.0" } });
      const result = await client.getPackage("test");

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages/test");
      expect(result.version).toBe("2.0.0");
    });

    it("GETs /v1/packages/:name/versions/:version for specific version", async () => {
      mockFetch({ json: { name: "test", version: "1.5.0" } });
      await client.getPackage("test", "1.5.0");

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages/test/versions/1.5.0");
    });

    it("encodes special characters in package name", async () => {
      mockFetch({ json: { name: "ns/pkg" } });
      await client.getPackage("ns/pkg");

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages/ns%2Fpkg");
    });
  });

  describe("listPackages", () => {
    it("GETs /v1/packages without filters", async () => {
      mockFetch({ json: [] });
      await client.listPackages();

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages");
    });

    it("appends kind and namespace as query params", async () => {
      mockFetch({ json: [] });
      await client.listPackages({ kind: "openapi-service", namespace: "petstore" });

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toContain("kind=openapi-service");
      expect(url).toContain("namespace=petstore");
    });
  });

  describe("searchPackages", () => {
    it("GETs /v1/packages/search with query", async () => {
      mockFetch({ json: [] });
      await client.searchPackages("pet");

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://registry.test/v1/packages/search?q=pet");
    });
  });

  // ---- Builder ------------------------------------------------------------

  describe("triggerBuild", () => {
    it("POSTs to /v1/builds", async () => {
      const mockBuild = {
        id: "build-123",
        packageName: "test",
        packageVersion: "1.0.0",
        status: "pending",
        createdAt: "2025-01-01T00:00:00Z",
      };
      mockFetch({ json: mockBuild });

      const result = await client.triggerBuild("test", "1.0.0");

      expect(result.id).toBe("build-123");
      expect(result.status).toBe("pending");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://builder.test/v1/builds");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.packageName).toBe("test");
      expect(body.packageVersion).toBe("1.0.0");
    });
  });

  describe("getBuildStatus", () => {
    it("GETs /v1/builds/:id", async () => {
      mockFetch({
        json: { id: "build-123", status: "succeeded" },
      });
      const result = await client.getBuildStatus("build-123");

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://builder.test/v1/builds/build-123");
      expect(result.status).toBe("succeeded");
    });
  });

  describe("streamBuildLogs", () => {
    it("GETs /v1/builds/:id/logs with SSE accept header and returns raw response", async () => {
      mockFetch({ json: {}, body: null });
      const response = await client.streamBuildLogs("build-456");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://builder.test/v1/builds/build-456/logs");
      const headers = init?.headers as Record<string, string>;
      expect(headers["Accept"]).toBe("text/event-stream");
      // Raw response is returned
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
    });
  });

  // ---- Environment Manager ------------------------------------------------

  describe("createEnvironment", () => {
    it("POSTs to /v1/environments", async () => {
      const mockEnv = {
        id: "env-abc",
        name: "staging",
        basePackage: "petstore/users-api",
        status: "active",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };
      mockFetch({ json: mockEnv });

      const result = await client.createEnvironment({
        name: "staging",
        basePackage: "petstore/users-api",
        branch: "main",
        overrides: { "petstore/auth": "2.1.0" },
      });

      expect(result.name).toBe("staging");
      expect(result.id).toBe("env-abc");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://envmanager.test/v1/environments");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.name).toBe("staging");
      expect(body.branch).toBe("main");
      expect(body.overrides["petstore/auth"]).toBe("2.1.0");
    });
  });

  describe("listEnvironments", () => {
    it("GETs /v1/environments", async () => {
      mockFetch({ json: [] });
      await client.listEnvironments();

      const fetchMock = vi.mocked(fetch);
      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://envmanager.test/v1/environments");
    });
  });

  describe("deleteEnvironment", () => {
    it("DELETEs /v1/environments/:name", async () => {
      mockFetch({ status: 204, json: undefined });
      await client.deleteEnvironment("staging");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://envmanager.test/v1/environments/staging");
      expect(init?.method).toBe("DELETE");
    });
  });

  describe("promoteEnvironment", () => {
    it("POSTs to /v1/environments/:name/promote", async () => {
      mockFetch({
        json: {
          id: "env-prod",
          name: "production",
          basePackage: "test",
          status: "active",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      });
      await client.promoteEnvironment("staging", "production");

      const fetchMock = vi.mocked(fetch);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe("http://envmanager.test/v1/environments/staging/promote");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.target).toBe("production");
    });
  });

  // ---- Error handling -----------------------------------------------------

  describe("error handling", () => {
    it("throws ApiError on non-OK responses", async () => {
      mockFetch({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: { message: "Package not found" },
      });

      await expect(client.getPackage("nonexistent")).rejects.toThrow(ApiError);
    });

    it("ApiError includes status, body, and url", async () => {
      mockFetch({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: { message: "Version already exists" },
      });

      try {
        await client.publishPackage({ name: "test", kind: "openapi-service" });
        expect.fail("Expected ApiError");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.status).toBe(409);
        expect(apiErr.body).toEqual({ message: "Version already exists" });
      }
    });

    it("ApiError.pretty() gives suggestions for 401", async () => {
      const err = new ApiError(401, "Unauthorized", { message: "Invalid token" }, "http://test/v1");
      const output = err.pretty();
      expect(output).toContain("401");
      expect(output).toContain("authentication token");
    });

    it("ApiError.pretty() gives suggestions for 404", async () => {
      const err = new ApiError(404, "Not Found", { message: "Not found" }, "http://test/v1");
      const output = err.pretty();
      expect(output).toContain("not found");
    });

    it("ApiError.pretty() gives suggestions for 409", async () => {
      const err = new ApiError(409, "Conflict", { message: "Duplicate" }, "http://test/v1");
      const output = err.pretty();
      expect(output).toContain("already exists");
    });

    it("ApiError.pretty() gives suggestions for 500+", async () => {
      const err = new ApiError(503, "Service Unavailable", {}, "http://test/v1");
      const output = err.pretty();
      expect(output).toContain("server-side error");
    });

    it("throws ConnectionError when fetch rejects", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("fetch failed")),
      );

      await expect(client.getPackage("test")).rejects.toThrow(ConnectionError);
    });

    it("ConnectionError.pretty() suggests starting the platform", () => {
      const err = new ConnectionError("http://localhost:8081/v1/packages", new TypeError("fetch failed"));
      const output = err.pretty();
      expect(output).toContain("Connection Error");
      expect(output).toContain("dev:up");
    });
  });
});
