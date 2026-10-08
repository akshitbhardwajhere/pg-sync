import { describe, it, expect } from "vitest";
import { mapPgTypeToTs, toPascalCase } from "../../src/engine/mapper.js";

describe("Type Mapper", () => {
  it("maps scalar numeric types to number", () => {
    expect(mapPgTypeToTs("integer", "int4")).toBe("number");
    expect(mapPgTypeToTs("bigint", "int8")).toBe("number");
    expect(mapPgTypeToTs("numeric", "numeric")).toBe("number");
  });

  it("maps string and UUID types to string", () => {
    expect(mapPgTypeToTs("character varying", "varchar")).toBe("string");
    expect(mapPgTypeToTs("text", "text")).toBe("string");
    expect(mapPgTypeToTs("uuid", "uuid")).toBe("string");
  });

  it("maps timestamps and dates to Date | string", () => {
    expect(mapPgTypeToTs("timestamp with time zone", "timestamptz")).toBe(
      "Date | string",
    );
    expect(mapPgTypeToTs("date", "date")).toBe("Date | string");
  });

  it("handles PostgreSQL array types with underscore prefix", () => {
    expect(mapPgTypeToTs("ARRAY", "_text")).toBe("string[]");
    expect(mapPgTypeToTs("ARRAY", "_int4")).toBe("number[]");
  });

  it("maps json and jsonb to Record<string, unknown>", () => {
    expect(mapPgTypeToTs("jsonb", "jsonb")).toBe("Record<string, unknown>");
  });

  it("converts snake_case database names to PascalCase identifiers", () => {
    expect(toPascalCase("user_profiles")).toBe("UserProfiles");
    expect(toPascalCase("order_line_items")).toBe("OrderLineItems");
    expect(toPascalCase("accounts")).toBe("Accounts");
  });
});
