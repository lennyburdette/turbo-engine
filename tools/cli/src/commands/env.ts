import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../config.js";
import { TurboEngineClient, ApiError, ConnectionError } from "../client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEnv(env: {
  id: string;
  name: string;
  basePackage: string;
  branch?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}): void {
  const statusColor =
    env.status === "active" ? chalk.green : env.status === "error" ? chalk.red : chalk.yellow;

  console.log(`  ${chalk.bold(env.name)} ${chalk.dim(`(${env.id})`)}`);
  console.log(`    Base package  ${chalk.cyan(env.basePackage)}`);
  if (env.branch) {
    console.log(`    Branch        ${chalk.cyan(env.branch)}`);
  }
  console.log(`    Status        ${statusColor(env.status)}`);
  console.log(`    Created       ${chalk.dim(env.createdAt)}`);
  console.log(`    Updated       ${chalk.dim(env.updatedAt)}`);
}

function handleError(err: unknown): void {
  if (err instanceof ApiError) {
    console.error(err.pretty());
  } else if (err instanceof ConnectionError) {
    console.error(err.pretty());
  } else {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
  }
  process.exitCode = 1;
}

function parseOverrides(values: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const v of values) {
    const eqIdx = v.indexOf("=");
    if (eqIdx === -1) {
      console.error(
        chalk.red(`Invalid override format: "${v}". Expected key=value.`),
      );
      process.exitCode = 1;
      return result;
    }
    result[v.slice(0, eqIdx)] = v.slice(eqIdx + 1);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const envCreate = new Command("create")
  .description("Create a new environment")
  .argument("<name>", "Environment name")
  .requiredOption("--base-package <name>", "Base package for the environment")
  .option("--branch <branch>", "Git branch to associate")
  .option("--override <key=value...>", "Package version overrides (repeatable)", (v, prev: string[]) => [...prev, v], [] as string[])
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (name: string, opts: { basePackage: string; branch?: string; override: string[]; apiUrl?: string }) => {
    const spinner = ora(`Creating environment ${chalk.bold(name)}...`).start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);

      const overrides = opts.override.length > 0 ? parseOverrides(opts.override) : undefined;

      const env = await client.createEnvironment({
        name,
        basePackage: opts.basePackage,
        branch: opts.branch,
        overrides,
      });

      spinner.succeed(`Environment ${chalk.bold(env.name)} created`);
      console.log();
      formatEnv(env);
    } catch (err) {
      spinner.fail("Failed to create environment");
      handleError(err);
    }
  });

const envList = new Command("list")
  .alias("ls")
  .description("List all environments")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (opts: { apiUrl?: string }) => {
    const spinner = ora("Fetching environments...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const envs = await client.listEnvironments();
      spinner.stop();

      if (envs.length === 0) {
        console.log(chalk.dim("No environments found."));
        return;
      }

      console.log(chalk.bold(`${envs.length} environment(s):\n`));
      for (const env of envs) {
        formatEnv(env);
        console.log();
      }
    } catch (err) {
      spinner.fail("Failed to list environments");
      handleError(err);
    }
  });

const envGet = new Command("get")
  .description("Get details of an environment")
  .argument("<name>", "Environment name or ID")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (name: string, opts: { apiUrl?: string }) => {
    const spinner = ora("Fetching environment...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const env = await client.getEnvironment(name);
      spinner.stop();

      formatEnv(env);
    } catch (err) {
      spinner.fail("Failed to get environment");
      handleError(err);
    }
  });

const envDelete = new Command("delete")
  .alias("rm")
  .description("Delete an environment")
  .argument("<name>", "Environment name or ID")
  .option("--api-url <url>", "Override all API base URLs")
  .option("--yes", "Skip confirmation prompt")
  .action(async (name: string, opts: { apiUrl?: string; yes?: boolean }) => {
    if (!opts.yes) {
      console.log(
        chalk.yellow(`About to delete environment ${chalk.bold(name)}. Use --yes to confirm.`),
      );
      process.exitCode = 1;
      return;
    }

    const spinner = ora(`Deleting environment ${chalk.bold(name)}...`).start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      await client.deleteEnvironment(name);
      spinner.succeed(`Environment ${chalk.bold(name)} deleted`);
    } catch (err) {
      spinner.fail("Failed to delete environment");
      handleError(err);
    }
  });

const envPromote = new Command("promote")
  .description("Promote an environment (copy its config to a target environment)")
  .argument("<source>", "Source environment name or ID")
  .argument("<target>", "Target environment name (e.g., production)")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (source: string, target: string, opts: { apiUrl?: string }) => {
    const spinner = ora(
      `Promoting ${chalk.bold(source)} -> ${chalk.bold(target)}...`,
    ).start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const env = await client.promoteEnvironment(source, target);
      spinner.succeed(
        `Promoted ${chalk.bold(source)} to ${chalk.bold(target)}`,
      );
      console.log();
      formatEnv(env);
    } catch (err) {
      spinner.fail("Promotion failed");
      handleError(err);
    }
  });

// ---------------------------------------------------------------------------
// Parent command
// ---------------------------------------------------------------------------

export const envCommand = new Command("env")
  .description("Manage environments")
  .addCommand(envCreate)
  .addCommand(envList)
  .addCommand(envGet)
  .addCommand(envDelete)
  .addCommand(envPromote);
