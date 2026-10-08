import { SchemaIR } from "../engine/types.js";

export function generateMermaidERD(schemaIR: SchemaIR): string {
  const lines: string[] = [];

  lines.push("# Database Entity-Relationship Diagram");
  lines.push(`> Extracted at: ${schemaIR.extractedAt}\n`);
  lines.push("```mermaid");
  lines.push("erDiagram");

  // 1. Define entities and their attributes
  for (const table of schemaIR.tables) {
    // Skip partitioned child tables to keep the diagram clean
    if (table.tableName.includes("_y20") || table.tableName.includes("_p20")) {
      continue;
    }

    const tableNameUpper = table.tableName.toUpperCase();
    lines.push(`    ${tableNameUpper} {`);

    for (const col of table.columns) {
      const isFK = table.foreignKeys.some((fk) => fk.columnName === col.name);
      const keyAnnotation = col.isPrimaryKey ? "PK" : isFK ? "FK" : "";

      // Mermaid requires sanitized type identifiers (no spaces or special chars)
      const cleanType = col.udtName.replace(/[^a-zA-Z0-9]/g, "");
      lines.push(`        ${cleanType} ${col.name} ${keyAnnotation}`.trimEnd());
    }

    lines.push("    }");
  }

  lines.push("");

  // 2. Define relationships from foreign keys
  for (const table of schemaIR.tables) {
    for (const fk of table.foreignKeys) {
      const source = fk.foreignTableName.toUpperCase();
      const target = table.tableName.toUpperCase();
      lines.push(`    ${source} ||--o{ ${target} : "${fk.columnName}"`);
    }
  }

  lines.push("```\n");
  return lines.join("\n");
}
