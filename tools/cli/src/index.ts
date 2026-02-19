import { Command } from "commander";
import chalk from "chalk";
import { publishCommand } from "./commands/publish.js";
import { envCommand } from "./commands/env.js";
import { buildCommand } from "./commands/build.js";
import { packageCommand } from "./commands/package.js";
import { loadConfig, printConfig } from "./config.js";

const program = new Command();

program
  .name("turbo-engine")
  .description("CLI for the Turbo Engine platform — publish packages, manage environments, trigger builds")
  .version("0.1.0")
  .option("--api-url <url>", "Override all API base URLs")
  .option("--debug", "Enable verbose debug output");

// ---------------------------------------------------------------------------
// Register subcommands
// ---------------------------------------------------------------------------

program.addCommand(publishCommand);
program.addCommand(envCommand);
program.addCommand(buildCommand);
program.addCommand(packageCommand);

// ---------------------------------------------------------------------------
// Config subcommand (lightweight, no separate file needed)
// ---------------------------------------------------------------------------

const configCommand = new Command("config")
  .description("View resolved configuration")
  .option("--api-url <url>", "Override all API base URLs")
  .action(async (opts: { apiUrl?: string }) => {
    const config = await loadConfig({ apiUrl: opts.apiUrl });
    printConfig(config);
  });

program.addCommand(configCommand);

// ---------------------------------------------------------------------------
// Global error handling
// ---------------------------------------------------------------------------

program.hook("preAction", (_thisCommand, actionCommand) => {
  // Propagate --debug and --api-url from the root program to subcommands
  const rootOpts = program.opts();
  if (rootOpts.debug) {
    process.env["TURBO_ENGINE_DEBUG"] = "1";
  }
  // Pass api-url down if set at root level but not on the subcommand
  if (rootOpts.apiUrl && !actionCommand.opts().apiUrl) {
    actionCommand.setOptionValue("apiUrl", rootOpts.apiUrl);
  }
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error(chalk.red.bold("Unexpected error:"));
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    if (process.env["TURBO_ENGINE_DEBUG"]) {
      console.error(err);
    }
    process.exitCode = 1;
  }
}

main();
