import fs from "node:fs/promises";
import path from "node:path";

export interface PgSyncConfig {
  connectionString?: string;
  schema: string;
  outputDir: string;
  target?: "typescript" | "frappe" | "erd";
}

const CONFIG_FILENAME = "pg-sync.config.json";

export async function loadConfig(
  customPath?: string,
): Promise<PgSyncConfig | null> {
  const targetPath = path.resolve(process.cwd(), customPath || CONFIG_FILENAME);
  try {
    const raw = await fs.readFile(targetPath, "utf-8");
    return JSON.parse(raw) as PgSyncConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(
  config: PgSyncConfig,
  customPath?: string,
): Promise<string> {
  const targetPath = path.resolve(process.cwd(), customPath || CONFIG_FILENAME);
  await fs.writeFile(targetPath, JSON.stringify(config, null, 2), "utf-8");
  return targetPath;
}
