import { input, select } from "@inquirer/prompts";
import ora from "ora";
import pc from "picocolors";
import { createDatabasePool } from "../engine/db.js";
import { saveConfig, PgSyncConfig } from "../utils/config.js";

export async function runInit(): Promise<void> {
  console.log(pc.bold(pc.cyan("\n⚙️  pg-sync Initialization Wizard\n")));

  const connectionString = await input({
    message: "Enter PostgreSQL connection string:",
    default: process.env.DATABASE_URL,
    validate: (val) =>
      val.startsWith("postgresql://") || val.startsWith("postgres://")
        ? true
        : "Invalid PostgreSQL URI format",
  });

  const schema = await input({
    message: "Schema to introspect:",
    default: "public",
  });

  const target = await select<"typescript" | "frappe" | "erd">({
    message: "Select output generator target:",
    choices: [
      {
        name: "TypeScript Interfaces (Universal / Next.js / Node)",
        value: "typescript",
      },
      { name: "Frappe Custom DocType JSONs", value: "frappe" },
      { name: "Mermaid ERD Documentation", value: "erd" },
    ],
  });

  const outputDir = await input({
    message: "Target output directory:",
    default:
      target === "typescript"
        ? "./src/types"
        : target === "frappe"
          ? "./doctypes"
          : "./docs",
  });

  // Verify connection before saving
  const spinner = ora("Testing database connection...").start();
  const pool = createDatabasePool(connectionString);

  try {
    const client = await pool.connect();
    client.release();
    spinner.succeed(pc.green("Database connection verified successfully!"));
  } catch (err: any) {
    spinner.fail(pc.red(`Failed to connect: ${err.message}`));
    console.log(
      pc.yellow("Writing config anyway, but double-check your credentials.\n"),
    );
  } finally {
    await pool.end();
  }

  const config: PgSyncConfig = {
    connectionString,
    schema,
    outputDir,
    target, // Ensure this says target, not format
  };

  const savedPath = await saveConfig(config);
  console.log(pc.green(`\n✔ Configuration written to ${pc.bold(savedPath)}`));
  console.log(
    `You can now run ${pc.cyan("pg-sync generate")} or ${pc.cyan("pgs generate")} to create your files.\n`,
  );
}
