import { describe, it, expect } from "vitest";
import { generateFrappeDocTypes } from "../../src/generators/frappe.js";
import { SchemaIR } from "../../src/engine/types.js";

describe("Frappe DocType Generator", () => {
  const mockIR: SchemaIR = {
    extractedAt: "2026-10-08T12:00:00Z",
    tables: [
      {
        tableName: "orders",
        schema: "public",
        isPartitioned: false,
        primaryKeys: ["id"],
        foreignKeys: [
          {
            columnName: "customer_id",
            foreignTableName: "customers",
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
            name: "customer_id",
            dbType: "integer",
            udtName: "int4",
            isNullable: false,
            isPrimaryKey: false,
            defaultValue: null,
          },
          {
            name: "total_amount",
            dbType: "numeric",
            udtName: "numeric",
            isNullable: false,
            isPrimaryKey: false,
            defaultValue: null,
          },
        ],
      },
    ],
  };

  it("maps relational foreign keys to Frappe Link fields and handles currency", async () => {
    const results = await generateFrappeDocTypes(mockIR, "Commerce");

    expect(results).toHaveLength(1);
    expect(results[0].docTypeName).toBe("Orders");

    const parsed = JSON.parse(results[0].content);
    expect(parsed.doctype).toBe("DocType");
    expect(parsed.module).toBe("Commerce");

    const customerField = parsed.fields.find(
      (f: any) => f.fieldname === "customer_id",
    );
    expect(customerField).toMatchObject({
      fieldtype: "Link",
      options: "Customers",
      reqd: 1,
    });

    const amountField = parsed.fields.find(
      (f: any) => f.fieldname === "total_amount",
    );
    expect(amountField).toMatchObject({
      fieldtype: "Currency",
    });
  });
});
