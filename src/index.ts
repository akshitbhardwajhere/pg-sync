#!/usr/bin/env node

import { Command } from "commander";
import pc from "picocolors";
import { runGenerate } from "./commands/generate.js";
import { runInit } from "./commands/init.js";

const program = new Command();

program
  .name("pg-sync")
  .description(pc.cyan("PostgreSQL Schema Introspector & Code Generator"))
  .version("1.0.0");

program
  .command("init")
  .description("Launch interactive setup wizard and generate configuration")
  .action(async () => {
    await runInit();
  });

program
  .command("generate")
  .description("Introspect database and generate output files")
  .option("-u, --url <url>", "PostgreSQL connection string")
  .option("-s, --schema <schema>", "Database schema to inspect")
  .option("-o, --output <dir>", "Output directory for generated files")
  .option(
    "-t, --target <type>",
    "Output generator target (typescript | frappe)",
  )
  .option("-c, --config <file>", "Custom configuration file path")
  .action(async (options) => {
    await runGenerate({
      connectionString: options.url,
      schema: options.schema,
      outputDir: options.output,
      target: options.target,
      configFile: options.config,
    });
  });

program.parse(process.argv);
