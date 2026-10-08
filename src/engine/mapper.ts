export function mapPgTypeToTs(dbType: string, udtName: string): string {
  const normalizedType = dbType.toLowerCase();
  const normalizedUdt = udtName.toLowerCase();

  // Check for PostgreSQL array types (udt_name typically starts with an underscore, e.g., _text)
  const isArray = normalizedType === "array" || normalizedUdt.startsWith("_");
  const baseUdt =
    isArray && normalizedUdt.startsWith("_")
      ? normalizedUdt.slice(1)
      : normalizedUdt;

  let tsType: string;

  switch (baseUdt) {
    case "int2":
    case "int4":
    case "int8":
    case "float4":
    case "float8":
    case "numeric":
    case "money":
      tsType = "number";
      break;

    case "bool":
      tsType = "boolean";
      break;

    case "varchar":
    case "char":
    case "text":
    case "uuid":
    case "citext":
      tsType = "string";
      break;

    case "timestamp":
    case "timestamptz":
    case "date":
    case "time":
    case "timetz":
      tsType = "Date | string";
      break;

    case "json":
    case "jsonb":
      tsType = "Record<string, unknown>";
      break;

    case "bytea":
      tsType = "Buffer";
      break;

    default:
      tsType = "unknown";
      break;
  }

  return isArray ? `${tsType}[]` : tsType;
}

export function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}
