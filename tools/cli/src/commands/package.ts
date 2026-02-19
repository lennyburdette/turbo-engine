import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../config.js";
import { TurboEngineClient, ApiError, ConnectionError } from "../client.js";
import type { PackageVersion, PackageListItem } from "../client.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPackageVersion(pkg: PackageVersion): void {
  console.log(`  ${chalk.bold(pkg.name)} ${chalk.green(`v${pkg.version}`)}`);
  console.log(`    Kind       ${chalk.cyan(pkg.kind)}`);
  console.log(`    Created    ${chalk.dim(pkg.createdAt)}`);
  if (pkg.dependencies?.length) {
    const deps = pkg.dependencies.map((d) =>
      d.version ? `${d.name}@${d.version}` : d.name,
    );
    console.log(`    Deps       ${deps.join(", ")}`);
  }
  if (pkg.upstream) {
    const u = pkg.upstream as { url?: string };
    if (u.url) console.log(`    Upstream   ${chalk.dim(u.url)}`);
  }
  if (pkg.metadata && Object.keys(pkg.metadata).length > 0) {
    console.log(`    Metadata   ${chalk.dim(JSON.stringify(pkg.metadata))}`);
  }
}

function formatPackageListItem(pkg: PackageListItem): void {
  console.log(
    `  ${chalk.bold(pkg.name)}  ${chalk.dim(pkg.kind)}  ${chalk.green(`v${pkg.latestVersion}`)}  ${chalk.dim(pkg.updatedAt)}`,
  );
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
// Subcommands
// ---------------------------------------------------------------------------

const packageGet = new Command("get")
  .description("Get details of a specific package (optionally at a version)")
  .argument("<name>", "Package name (e.g., petstore/users-api)")
  .option("--version <version>", "Specific version (default: latest)")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (name: string, opts: { version?: string; apiUrl?: string }) => {
    const spinner = ora("Fetching package...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const pkg = await client.getPackage(name, opts.version);
      spinner.stop();

      formatPackageVersion(pkg);
    } catch (err) {
      spinner.fail("Failed to get package");
      handleError(err);
    }
  });

const packageList = new Command("list")
  .alias("ls")
  .description("List packages in the registry")
  .option("--kind <kind>", "Filter by package kind (e.g., graphql-subgraph)")
  .option("--namespace <ns>", "Filter by namespace prefix")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (opts: { kind?: string; namespace?: string; apiUrl?: string }) => {
    const spinner = ora("Listing packages...").start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const packages = await client.listPackages({
        kind: opts.kind,
        namespace: opts.namespace,
      });
      spinner.stop();

      if (packages.length === 0) {
        console.log(chalk.dim("No packages found."));
        if (opts.kind || opts.namespace) {
          console.log(chalk.dim("Try removing filters to see all packages."));
        }
        return;
      }

      console.log(chalk.bold(`${packages.length} package(s):\n`));
      for (const pkg of packages) {
        formatPackageListItem(pkg);
      }
    } catch (err) {
      spinner.fail("Failed to list packages");
      handleError(err);
    }
  });

const packageSearch = new Command("search")
  .description("Search for packages by name prefix")
  .argument("<query>", "Name prefix to search for")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (query: string, opts: { apiUrl?: string }) => {
    const spinner = ora(`Searching for "${query}"...`).start();
    try {
      const config = await loadConfig({ apiUrl: opts.apiUrl });
      const client = new TurboEngineClient(config);
      const results = await client.searchPackages(query);
      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.dim(`No packages found matching "${query}".`));
        return;
      }

      console.log(chalk.bold(`${results.length} result(s) for "${query}":\n`));
      for (const pkg of results) {
        formatPackageListItem(pkg);
      }
    } catch (err) {
      spinner.fail("Search failed");
      handleError(err);
    }
  });

// ---------------------------------------------------------------------------
// Parent command
// ---------------------------------------------------------------------------

export const packageCommand = new Command("package")
  .alias("pkg")
  .description("Browse and inspect packages in the registry")
  .addCommand(packageGet)
  .addCommand(packageList)
  .addCommand(packageSearch);
