import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import Ajv, { type ErrorObject } from "ajv";
import chalk from "chalk";
import YAML from "yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Manifest {
  name: string;
  kind: string;
  version?: string;
  schema?: string;
  upstream?: {
    url: string;
    headers?: Record<string, string>;
    auth?: unknown;
  };
  dependencies?: Array<{ name: string; version?: string }>;
  metadata?: Record<string, unknown>;
}

export interface LoadedManifest {
  /** Parsed and validated manifest. */
  manifest: Manifest;
  /** Absolute path to the manifest file. */
  manifestPath: string;
  /** Contents of the referenced schema file (if any). */
  schemaBody?: string;
}

// ---------------------------------------------------------------------------
// Schema loading
// ---------------------------------------------------------------------------

const SCHEMA_PATH = resolve(
  import.meta.dirname ?? ".",
  "..",
  "..",
  "..",
  "specs",
  "jsonschema",
  "package-manifest.schema.json",
);

let cachedSchema: object | null = null;

async function loadJsonSchema(schemaPath?: string): Promise<object> {
  if (cachedSchema) return cachedSchema;
  const p = schemaPath ?? SCHEMA_PATH;
  try {
    const raw = await readFile(p, "utf-8");
    cachedSchema = JSON.parse(raw) as object;
    return cachedSchema;
  } catch {
    throw new ManifestError(
      `Could not load package-manifest JSON Schema from ${p}`,
      "Ensure you are running the CLI from within the turbo-engine repository, or set TURBO_ENGINE_SCHEMA_PATH.",
    );
  }
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ManifestError extends Error {
  constructor(
    message: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "ManifestError";
  }

  pretty(): string {
    const lines = [chalk.red.bold("Manifest Error: ") + this.message];
    if (this.hint) {
      lines.push("");
      lines.push(chalk.dim(`Hint: ${this.hint}`));
    }
    return lines.join("\n");
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateManifest(data: unknown, jsonSchema: object): Manifest {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  const AjvClass = (Ajv as any).default ?? Ajv;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const ajv = new AjvClass({ allErrors: true, strict: false, validateSchema: false, validateFormats: false });
  const validate = ajv.compile(jsonSchema);

  if (!validate(data)) {
    const errors = (validate.errors ?? [])
      .map((e: ErrorObject) => {
        const path = e.instancePath || "(root)";
        return `  ${chalk.yellow(path)}: ${e.message ?? "unknown error"}`;
      })
      .join("\n");

    throw new ManifestError(
      `Manifest validation failed:\n${errors}`,
      "Check your turbo-engine.yaml against the schema at specs/jsonschema/package-manifest.schema.json",
    );
  }

  return data as Manifest;
}

// ---------------------------------------------------------------------------
// Loading from file
// ---------------------------------------------------------------------------

const MANIFEST_NAMES = ["turbo-engine.yaml", "turbo-engine.yml"];

export async function findManifestPath(dir: string): Promise<string> {
  for (const name of MANIFEST_NAMES) {
    const candidate = join(dir, name);
    try {
      await readFile(candidate, "utf-8");
      return candidate;
    } catch {
      // try next
    }
  }
  throw new ManifestError(
    `No manifest file found in ${dir}`,
    `Create a ${MANIFEST_NAMES[0]} file, or specify a path with --file.`,
  );
}

export async function loadManifest(
  fileOrDir: string,
  opts?: { schemaPath?: string },
): Promise<LoadedManifest> {
  const resolvedPath = resolve(fileOrDir);

  // Determine whether the input is a file or directory
  let manifestPath: string;
  try {
    const stat = await import("node:fs/promises").then((m) => m.stat(resolvedPath));
    manifestPath = stat.isDirectory() ? await findManifestPath(resolvedPath) : resolvedPath;
  } catch {
    throw new ManifestError(
      `Path does not exist: ${resolvedPath}`,
      "Provide a valid path to a turbo-engine.yaml file or the directory containing one.",
    );
  }

  // Parse YAML
  let raw: unknown;
  try {
    const content = await readFile(manifestPath, "utf-8");
    raw = YAML.parse(content);
  } catch (err) {
    throw new ManifestError(
      `Failed to parse ${manifestPath}: ${err instanceof Error ? err.message : String(err)}`,
      "Ensure the file is valid YAML.",
    );
  }

  // Validate against JSON Schema
  const jsonSchema = await loadJsonSchema(opts?.schemaPath);
  const manifest = validateManifest(raw, jsonSchema);

  // If the manifest references a schema file, read it
  let schemaBody: string | undefined;
  if (manifest.schema) {
    const schemaFilePath = resolve(dirname(manifestPath), manifest.schema);
    try {
      schemaBody = await readFile(schemaFilePath, "utf-8");
    } catch {
      throw new ManifestError(
        `Schema file not found: ${schemaFilePath}`,
        `The manifest references schema: "${manifest.schema}" but the file does not exist relative to the manifest.`,
      );
    }
  }

  return { manifest, manifestPath, schemaBody };
}

// Re-export for testing
export { loadJsonSchema as _loadJsonSchema, SCHEMA_PATH as _SCHEMA_PATH };
