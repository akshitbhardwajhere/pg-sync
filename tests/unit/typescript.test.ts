import { describe, it, expect } from "vitest";
import { generateTypeScriptDefinitions } from "../../src/generators/typescript.js";
import { SchemaIR } from "../../src/engine/types.js";

describe("TypeScript Generator", () => {
  const mockIR: SchemaIR = {
    extractedAt: "2026-10-08T12:00:00Z",
    tables: [
      {
        tableName: "users",
        schema: "public",
        isPartitioned: false,
        primaryKeys: ["id"],
        foreignKeys: [],
        columns: [
          {
            name: "id",
            dbType: "integer",
            udtName: "int4",
            isNullable: false,
            isPrimaryKey: true,
            defaultValue: null,
          },
          {
            name: "email",
            dbType: "character varying",
            udtName: "varchar",
            isNullable: false,
            isPrimaryKey: false,
            defaultValue: null,
          },
          {
            name: "bio",
            dbType: "text",
            udtName: "text",
            isNullable: true,
            isPrimaryKey: false,
            defaultValue: null,
          },
        ],
      },
    ],
  };

  it("generates formatted interface with correct types and nullability", async () => {
    const output = await generateTypeScriptDefinitions(mockIR);

    expect(output).toContain("export interface Users {");
    expect(output).toContain("id: number;");
    expect(output).toContain("email: string;");
    expect(output).toContain("bio?: string | null;");
    expect(output).toContain("export interface DatabaseSchema {");
    expect(output).toContain("users: Users;");
  });
});
