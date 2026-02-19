import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateManifest, ManifestError, loadManifest } from "../manifest.js";

// ---------------------------------------------------------------------------
// Load the real JSON Schema once for all tests
// ---------------------------------------------------------------------------

const SCHEMA_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "specs",
  "jsonschema",
  "package-manifest.schema.json",
);

let jsonSchema: object;

beforeEach(async () => {
  if (!jsonSchema) {
    const raw = await readFile(SCHEMA_PATH, "utf-8");
    jsonSchema = JSON.parse(raw) as object;
  }
});

// ---------------------------------------------------------------------------
// validateManifest
// ---------------------------------------------------------------------------

describe("validateManifest", () => {
  it("accepts a minimal valid manifest", () => {
    const data = {
      name: "petstore/users-api",
      kind: "openapi-service",
    };

    const result = validateManifest(data, jsonSchema);

    expect(result.name).toBe("petstore/users-api");
    expect(result.kind).toBe("openapi-service");
  });

  it("accepts a fully populated manifest", () => {
    const data = {
      name: "petstore/users-api",
      kind: "openapi-service",
      version: "1.2.3",
      schema: "./openapi.yaml",
      upstream: {
        url: "https://users.petstore.internal",
        headers: { "X-Custom": "value" },
        auth: {
          type: "bearer",
          tokenSecretRef: "users-api-token",
        },
      },
      dependencies: [
        { name: "petstore/auth-service", version: "^2.0.0" },
        { name: "shared/logging" },
      ],
      metadata: {
        team: "platform",
        tier: "critical",
      },
    };

    const result = validateManifest(data, jsonSchema);

    expect(result.name).toBe("petstore/users-api");
    expect(result.version).toBe("1.2.3");
    expect(result.schema).toBe("./openapi.yaml");
    expect(result.dependencies).toHaveLength(2);
    expect(result.metadata?.team).toBe("platform");
  });

  it("accepts all valid package kinds", () => {
    const kinds = [
      "graphql-subgraph",
      "openapi-service",
      "graphql-operations",
      "postman-collection",
      "graphql-supergraph",
      "workflow-engine",
      "ingress",
      "egress",
    ];

    for (const kind of kinds) {
      const result = validateManifest({ name: "test", kind }, jsonSchema);
      expect(result.kind).toBe(kind);
    }
  });

  it("rejects a manifest missing required 'name' field", () => {
    expect(() => validateManifest({ kind: "openapi-service" }, jsonSchema)).toThrow(ManifestError);
  });

  it("rejects a manifest missing required 'kind' field", () => {
    expect(() => validateManifest({ name: "test" }, jsonSchema)).toThrow(ManifestError);
  });

  it("rejects an invalid package kind", () => {
    expect(() =>
      validateManifest({ name: "test", kind: "not-a-real-kind" }, jsonSchema),
    ).toThrow(ManifestError);
  });

  it("rejects a name with uppercase characters", () => {
    expect(() =>
      validateManifest({ name: "InvalidName", kind: "openapi-service" }, jsonSchema),
    ).toThrow(ManifestError);
  });

  it("rejects a name starting with a number", () => {
    expect(() =>
      validateManifest({ name: "123test", kind: "openapi-service" }, jsonSchema),
    ).toThrow(ManifestError);
  });

  it("includes all validation errors in the message", () => {
    try {
      validateManifest({}, jsonSchema);
      expect.fail("Expected ManifestError");
    } catch (err) {
      expect(err).toBeInstanceOf(ManifestError);
      const me = err as ManifestError;
      // Should mention both required fields
      expect(me.message).toContain("name");
      expect(me.message).toContain("kind");
    }
  });

  it("produces a user-friendly pretty() output", () => {
    try {
      validateManifest({}, jsonSchema);
      expect.fail("Expected ManifestError");
    } catch (err) {
      const me = err as ManifestError;
      const pretty = me.pretty();
      expect(pretty).toContain("Manifest Error");
      expect(pretty).toContain("Hint");
    }
  });
});

// ---------------------------------------------------------------------------
// loadManifest (integration-style with temp files)
// ---------------------------------------------------------------------------

describe("loadManifest", () => {
  it("throws ManifestError for a nonexistent path", async () => {
    await expect(loadManifest("/nonexistent/path/turbo-engine.yaml", { schemaPath: SCHEMA_PATH }))
      .rejects.toThrow(ManifestError);
  });

  it("throws ManifestError with a hint for nonexistent path", async () => {
    try {
      await loadManifest("/nonexistent/path", { schemaPath: SCHEMA_PATH });
      expect.fail("Expected ManifestError");
    } catch (err) {
      expect(err).toBeInstanceOf(ManifestError);
      expect((err as ManifestError).hint).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// ManifestError
// ---------------------------------------------------------------------------

describe("ManifestError", () => {
  it("stores message and hint", () => {
    const err = new ManifestError("something went wrong", "try this instead");
    expect(err.message).toBe("something went wrong");
    expect(err.hint).toBe("try this instead");
    expect(err.name).toBe("ManifestError");
  });

  it("pretty() includes hint when provided", () => {
    const err = new ManifestError("bad input", "check the docs");
    const output = err.pretty();
    expect(output).toContain("bad input");
    expect(output).toContain("check the docs");
  });

  it("pretty() works without hint", () => {
    const err = new ManifestError("bad input");
    const output = err.pretty();
    expect(output).toContain("bad input");
  });
});
