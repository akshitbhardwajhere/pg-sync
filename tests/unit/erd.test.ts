import { describe, it, expect } from "vitest";
import { generateMermaidERD } from "../../src/generators/erd.js";
import { SchemaIR } from "../../src/engine/types.js";

describe("Mermaid ERD Generator", () => {
  it("generates valid mermaid syntax with relationships", () => {
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
          ],
        },
        {
          tableName: "orders",
          schema: "public",
          isPartitioned: false,
          primaryKeys: ["id"],
          foreignKeys: [
            {
              columnName: "user_id",
              foreignTableName: "users",
              foreignColumnName: "id",
            },
          ],
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
              name: "user_id",
              dbType: "integer",
              udtName: "int4",
              isNullable: false,
              isPrimaryKey: false,
              defaultValue: null,
            },
          ],
        },
      ],
    };

    const output = generateMermaidERD(mockIR);

    expect(output).toContain("```mermaid");
    expect(output).toContain("USERS {");
    expect(output).toContain("ORDERS {");
    expect(output).toContain("int4 id PK");
    expect(output).toContain('USERS ||--o{ ORDERS : "user_id"');
  });
});
