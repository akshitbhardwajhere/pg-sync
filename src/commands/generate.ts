import fs from "node:fs/promises";
import path from "node:path";
import ora from "ora";
import pc from "picocolors";
import { createDatabasePool } from "../engine/db.js";
import { introspectDatabase } from "../engine/introspector.js";
import { generateTypeScriptDefinitions } from "../generators/typescript.js";
import { generateFrappeDocTypes } from "../generators/frappe.js";
import { loadConfig } from "../utils/config.js";
import { generateMermaidERD } from "../generators/erd.js";

interface GenerateOptions {
  connectionString?: string;
  schema?: string;
  outputDir?: string;
  target?: "typescript" | "frappe" | "erd";
  configFile?: string;
}

export async function runGenerate(options: GenerateOptions) {
  const fileConfig = await loadConfig(options.configFile);

  const connectionString =
    options.connectionString ||
    process.env.DATABASE_URL ||
    fileConfig?.connectionString;

  if (!connectionString) {
    console.error(pc.red("Error: No connection string provided."));
    console.log(
      `Run ${pc.cyan("pg-sync init")} or supply ${pc.yellow("-u <connectionString>")}`,
    );
    process.exit(1);
  }

  const schema = options.schema || fileConfig?.schema || "public";
  const target = options.target || fileConfig?.target || "typescript";
  const rawOutputDir =
    options.outputDir ||
    fileConfig?.outputDir ||
    (target === "typescript" ? "./generated" : "./doctypes");
  const outputDir = path.resolve(process.cwd(), rawOutputDir);

  const spinner = ora("Connecting to PostgreSQL database...").start();
  const pool = createDatabasePool(connectionString);

  try {
    spinner.text = "Introspecting database catalog and schema tables...";
    const schemaIR = await introspectDatabase(pool, schema);
    spinner.succeed(
      pc.green(
        `Introspection complete! Found ${schemaIR.tables.length} tables.`,
      ),
    );

    for (const table of schemaIR.tables) {
      const partitionInfo = table.isPartitioned
        ? pc.magenta(` [Partitioned: ${table.partitionStrategy}]`)
        : "";
      console.log(
        ` • ${pc.bold(table.tableName)}${partitionInfo} (${table.columns.length} columns)`,
      );
    }

    await fs.mkdir(outputDir, { recursive: true });

    if (target === "typescript") {
      const genSpinner = ora("Generating TypeScript definitions...").start();
      const formattedCode = await generateTypeScriptDefinitions(schemaIR);
      const outputPath = path.join(outputDir, "schema.ts");
      await fs.writeFile(outputPath, formattedCode, "utf-8");
      genSpinner.succeed(
        pc.green(`TypeScript types saved to: ${pc.bold(outputPath)}`),
      );
    } else if (target === "frappe") {
      const genSpinner = ora("Generating Frappe DocType schemas...").start();
      const docTypes = await generateFrappeDocTypes(schemaIR);

      for (const dt of docTypes) {
        const docTypeDir = path.join(outputDir, dt.docTypeName.toLowerCase());
        await fs.mkdir(docTypeDir, { recursive: true });
        const filePath = path.join(
          docTypeDir,
          `${dt.docTypeName.toLowerCase()}.json`,
        );
        await fs.writeFile(filePath, dt.content, "utf-8");
      }
      genSpinner.succeed(
        pc.green(
          `Generated ${docTypes.length} Frappe DocType schemas in: ${pc.bold(outputDir)}`,
        ),
      );
    } else if (target === "erd") {
      const genSpinner = ora("Generating Mermaid ERD documentation...").start();
      const erdMarkdown = generateMermaidERD(schemaIR);
      const outputPath = path.join(outputDir, "ERD.md");
      await fs.writeFile(outputPath, erdMarkdown, "utf-8");
      genSpinner.succeed(
        pc.green(`ERD documentation saved to: ${pc.bold(outputPath)}`),
      );
    }
  } catch (err: any) {
    spinner.fail(pc.red("Generation failed."));
    console.error(pc.red(err.message));
    process.exit(1);
  } finally {
    await pool.end();
  }
}
