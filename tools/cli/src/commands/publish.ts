import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../config.js";
import { TurboEngineClient, ApiError, ConnectionError } from "../client.js";
import { loadManifest, ManifestError } from "../manifest.js";

export const publishCommand = new Command("publish")
  .description("Publish a package to the Turbo Engine registry")
  .argument("[path]", "Path to turbo-engine.yaml or directory containing one", ".")
  .option("--api-url <url>", "Override all API base URLs")
  .option("--registry-url <url>", "Override the registry API base URL")
  .option("--dry-run", "Validate the manifest without publishing")
  .option("--file <path>", "Explicit path to manifest file")
  .action(async (path: string, opts: { apiUrl?: string; registryUrl?: string; dryRun?: boolean; file?: string }) => {
    const target = opts.file ?? path;

    // ---- Load & validate manifest ----------------------------------------
    const loadSpinner = ora("Loading manifest...").start();
    let loaded;
    try {
      loaded = await loadManifest(target);
      loadSpinner.succeed(
        `Manifest loaded: ${chalk.bold(loaded.manifest.name)} (${loaded.manifest.kind})`,
      );
    } catch (err) {
      loadSpinner.fail("Failed to load manifest");
      if (err instanceof ManifestError) {
        console.error(err.pretty());
      } else {
        console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      }
      process.exitCode = 1;
      return;
    }

    const { manifest, schemaBody } = loaded;

    // Print summary
    console.log();
    console.log(chalk.bold("Package details:"));
    console.log(`  Name     ${chalk.cyan(manifest.name)}`);
    console.log(`  Kind     ${chalk.cyan(manifest.kind)}`);
    if (manifest.version) {
      console.log(`  Version  ${chalk.cyan(manifest.version)}`);
    } else {
      console.log(`  Version  ${chalk.dim("(auto)")}`);
    }
    if (schemaBody) {
      console.log(`  Schema   ${chalk.green(`${schemaBody.length} bytes`)}`);
    }
    if (manifest.dependencies?.length) {
      console.log(`  Deps     ${manifest.dependencies.map((d) => d.name).join(", ")}`);
    }
    console.log();

    // ---- Dry-run mode -----------------------------------------------------
    if (opts.dryRun) {
      console.log(chalk.green.bold("Dry run: manifest is valid. No changes were made."));
      return;
    }

    // ---- Publish ----------------------------------------------------------
    const publishSpinner = ora("Publishing to registry...").start();
    try {
      const config = await loadConfig({
        apiUrl: opts.apiUrl,
        registryUrl: opts.registryUrl,
      });
      const client = new TurboEngineClient(config);

      const result = await client.publishPackage(
        manifest as unknown as Record<string, unknown>,
        schemaBody,
      );

      publishSpinner.succeed(
        `Published ${chalk.bold(result.name)}@${chalk.green(result.version)}`,
      );
      console.log();
      console.log(chalk.dim(`  Created at: ${result.createdAt}`));
    } catch (err) {
      publishSpinner.fail("Publish failed");
      if (err instanceof ApiError) {
        console.error(err.pretty());
      } else if (err instanceof ConnectionError) {
        console.error(err.pretty());
      } else {
        console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      }
      process.exitCode = 1;
    }
  });
