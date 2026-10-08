import prettier from "prettier";
import { SchemaIR, TableMeta, ColumnMeta } from "../engine/types.js";
import { toPascalCase } from "../engine/mapper.js";

interface FrappeDocField {
  fieldname: string;
  label: string;
  fieldtype: string;
  reqd: number;
  options?: string;
  default?: string;
}

interface FrappeDocType {
  name: string;
  doctype: string;
  module: string;
  custom: number;
  is_submittable: number;
  fields: FrappeDocField[];
  permissions: Array<{
    role: string;
    read: number;
    write: number;
    create: number;
  }>;
}

function mapPgToFrappeFieldType(
  col: ColumnMeta,
  table: TableMeta,
): { fieldtype: string; options?: string } {
  // Check if this column is a Foreign Key -> Map to Link fieldtype
  const foreignKey = table.foreignKeys.find((fk) => fk.columnName === col.name);
  if (foreignKey) {
    return {
      fieldtype: "Link",
      options: toPascalCase(foreignKey.foreignTableName),
    };
  }

  const baseUdt = col.udtName.toLowerCase();

  switch (baseUdt) {
    case "int2":
    case "int4":
    case "int8":
      return { fieldtype: "Int" };

    case "numeric":
    case "money":
      return { fieldtype: "Currency" };

    case "float4":
    case "float8":
      return { fieldtype: "Float" };

    case "bool":
      return { fieldtype: "Check" };

    case "text":
      return { fieldtype: "Text" };

    case "date":
      return { fieldtype: "Date" };

    case "time":
    case "timetz":
      return { fieldtype: "Time" };

    case "timestamp":
    case "timestamptz":
      return { fieldtype: "Datetime" };

    case "json":
    case "jsonb":
      return { fieldtype: "Code", options: "JSON" };

    default:
      return { fieldtype: "Data" };
  }
}

function toLabel(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateFrappeDocTypes(
  schemaIR: SchemaIR,
  moduleName: string = "Core",
): Promise<Array<{ docTypeName: string; content: string }>> {
  const generatedFiles: Array<{ docTypeName: string; content: string }> = [];

  for (const table of schemaIR.tables) {
    // Skip internal partition child tables if partitioned
    if (table.tableName.includes("_y20") || table.tableName.includes("_p20")) {
      continue;
    }

    const docTypeName = toPascalCase(table.tableName);
    const fields: FrappeDocField[] = [];

    for (const col of table.columns) {
      // Frappe provides its own primary key 'name' field
      if (col.isPrimaryKey && (col.name === "id" || col.name === "name")) {
        continue;
      }

      const { fieldtype, options } = mapPgToFrappeFieldType(col, table);

      const fieldDef: FrappeDocField = {
        fieldname: col.name,
        label: toLabel(col.name),
        fieldtype,
        reqd: !col.isNullable && col.defaultValue === null ? 1 : 0,
      };

      if (options) {
        fieldDef.options = options;
      }

      fields.push(fieldDef);
    }

    const docTypePayload: FrappeDocType = {
      name: docTypeName,
      doctype: "DocType",
      module: moduleName,
      custom: 1,
      is_submittable: 0,
      fields,
      permissions: [
        {
          role: "System Manager",
          read: 1,
          write: 1,
          create: 1,
        },
      ],
    };

    const formattedJson = await prettier.format(
      JSON.stringify(docTypePayload),
      {
        parser: "json",
        tabWidth: 2,
      },
    );

    generatedFiles.push({
      docTypeName,
      content: formattedJson,
    });
  }

  return generatedFiles;
}
