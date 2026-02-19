import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../config.js";
import { TurboEngineClient, ApiError, ConnectionError } from "../client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBuild(build: {
  id: string;
  packageName: string;
  packageVersion: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}): void {
  const statusColor =
    build.status === "succeeded"
      ? chalk.green
      : build.status === "failed"
        ? chalk.red
        : build.status === "running"
          ? chalk.yellow
          : chalk.dim;

  console.log(`  ${chalk.bold(build.id)}`);
  console.log(`    Package   ${chalk.cyan(build.packageName)}@${build.packageVersion}`);
  console.log(`    Status    ${statusColor(build.status)}`);
  console.log(`    Created   ${chalk.dim(build.createdAt)}`);
  if (build.startedAt) {
    console.log(`    Started   ${chalk.dim(build.startedAt)}`);
  }
  if (build.finishedAt) {
    console.log(`    Finished  ${chalk.dim(build.finishedAt)}`);
  }
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

// ---------------------------------------------------------------------------
// Log level colors
// ---------------------------------------------------------------------------

function colorLogLine(line: string): string {
  // Match common log level prefixes
  if (/\b(ERROR|FATAL|PANIC)\b/i.test(line)) return chalk.red(line);
  if (/\bWARN(ING)?\b/i.test(line)) return chalk.yellow(line);
  if (/\bINFO\b/i.test(line)) return chalk.blue(line);
  if (/\bDEBUG\b/i.test(line)) return chalk.dim(line);
  if (/\bTRACE\b/i.test(line)) return chalk.gray(line);
  return line;
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

const buildTrigger = new Command("trigger")
  .description("Trigger a new build for a package")
  .argument("<package>", "Package name (e.g., petstore/users-api)")
  .argument("<version>", "Package version to build")
  .option("--api-url <url>", "Override all API base URLs")
  .option("--follow", "Stream build logs after triggering")
  .action(async (packageName: string, version: string, opts: { apiUrl?: string; follow?: boolean }) => {
    const spinner = ora(`Triggering build for ${chalk.bold(packageName)}@${version}...`).start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const build = await client.triggerBuild(packageName, version);

      spinner.succeed(`Build ${chalk.bold(build.id)} triggered`);
      console.log();
      formatBuild(build);

      if (opts.follow) {
        console.log();
        console.log(chalk.bold("Streaming logs...\n"));
        await streamLogs(client, build.id);
      }
    } catch (err) {
      spinner.fail("Failed to trigger build");
      handleError(err);
    }
  });

const buildStatus = new Command("status")
  .description("Check the status of a build")
  .argument("<build-id>", "Build ID")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (buildId: string, opts: { apiUrl?: string }) => {
    const spinner = ora("Fetching build status...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const build = await client.getBuildStatus(buildId);
      spinner.stop();

      formatBuild(build);
    } catch (err) {
      spinner.fail("Failed to get build status");
      handleError(err);
    }
  });

const buildLogs = new Command("logs")
  .description("Stream build logs in real time (SSE)")
  .argument("<build-id>", "Build ID")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (buildId: string, opts: { apiUrl?: string }) => {
    const spinner = ora("Connecting to log stream...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      spinner.stop();

      console.log(chalk.bold(`Build logs for ${chalk.cyan(buildId)}:\n`));
      await streamLogs(client, buildId);
    } catch (err) {
      spinner.fail("Failed to connect to log stream");
      handleError(err);
    }
  });

// ---------------------------------------------------------------------------
// SSE log streaming
// ---------------------------------------------------------------------------

async function streamLogs(client: TurboEngineClient, buildId: string): Promise<void> {
  const response = await client.streamBuildLogs(buildId);

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }
    throw new ApiError(response.status, response.statusText, body, response.url);
  }

  if (!response.body) {
    console.log(chalk.dim("(No log stream available)"));
    return;
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE events from the buffer
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          // Check for end-of-stream sentinel
          if (data === "[DONE]") {
            console.log();
            console.log(chalk.dim("--- End of logs ---"));
            return;
          }

          // Try to parse as JSON; fall back to plain text
          try {
            const parsed = JSON.parse(data) as {
              level?: string;
              message?: string;
              timestamp?: string;
            };
            const ts = parsed.timestamp ? chalk.dim(`[${parsed.timestamp}] `) : "";
            const msg = parsed.message ?? data;
            console.log(ts + colorLogLine(msg));
          } catch {
            // Plain-text log line
            console.log(colorLogLine(data));
          }
        }
        // Ignore SSE comments (lines starting with ":") and event/id fields
      }
    }
  } finally {
    reader.releaseLock();
  }

  console.log();
  console.log(chalk.dim("--- Stream ended ---"));
}

// ---------------------------------------------------------------------------
// Parent command
// ---------------------------------------------------------------------------

export const buildCommand = new Command("build")
  .description("Trigger and monitor builds")
  .addCommand(buildTrigger)
  .addCommand(buildStatus)
  .addCommand(buildLogs);
