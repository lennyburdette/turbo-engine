import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import YAML from "yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Config {
  /** Base URL for the Registry API (package CRUD). */
  registryUrl: string;
  /** Base URL for the Builder API (build triggers, status, logs). */
  builderUrl: string;
  /** Base URL for the Environment Manager API. */
  envmanagerUrl: string;
  /** Optional bearer token for authenticated requests. */
  token?: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULTS: Config = {
  registryUrl: "http://localhost:8081",
  builderUrl: "http://localhost:8082",
  envmanagerUrl: "http://localhost:8083",
};

const CONFIG_DIR = join(homedir(), ".turbo-engine");
const CONFIG_FILE = join(CONFIG_DIR, "config.yaml");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RawConfigFile {
  registry_url?: string;
  builder_url?: string;
  envmanager_url?: string;
  token?: string;
}

async function loadConfigFile(): Promise<RawConfigFile | null> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return YAML.parse(raw) as RawConfigFile;
  } catch {
    // File doesn't exist or is not readable — that's fine.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ConfigOverrides {
  apiUrl?: string;
  registryUrl?: string;
  builderUrl?: string;
  envmanagerUrl?: string;
  token?: string;
}

/**
 * Resolve configuration by merging (in increasing priority):
 *   1. Built-in defaults
 *   2. ~/.turbo-engine/config.yaml
 *   3. Environment variables
 *   4. Explicit CLI flag overrides
 */
export async function loadConfig(overrides: ConfigOverrides = {}): Promise<Config> {
  const file = await loadConfigFile();

  const registryUrl =
    overrides.registryUrl ??
    overrides.apiUrl ??
    process.env["TURBO_ENGINE_REGISTRY_URL"] ??
    file?.registry_url ??
    DEFAULTS.registryUrl;

  const builderUrl =
    overrides.builderUrl ??
    overrides.apiUrl ??
    process.env["TURBO_ENGINE_BUILDER_URL"] ??
    file?.builder_url ??
    DEFAULTS.builderUrl;

  const envmanagerUrl =
    overrides.envmanagerUrl ??
    overrides.apiUrl ??
    process.env["TURBO_ENGINE_ENVMANAGER_URL"] ??
    file?.envmanager_url ??
    DEFAULTS.envmanagerUrl;

  const token =
    overrides.token ??
    process.env["TURBO_ENGINE_TOKEN"] ??
    file?.token ??
    undefined;

  return { registryUrl, builderUrl, envmanagerUrl, token };
}

/**
 * Print the resolved config for debugging.
 */
export function printConfig(config: Config): void {
  console.log(chalk.bold("Resolved configuration:"));
  console.log(`  Registry   ${chalk.cyan(config.registryUrl)}`);
  console.log(`  Builder    ${chalk.cyan(config.builderUrl)}`);
  console.log(`  EnvManager ${chalk.cyan(config.envmanagerUrl)}`);
  console.log(`  Token      ${config.token ? chalk.green("set") : chalk.dim("not set")}`);
}
