import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { Pool } from "pg";
import { introspectDatabase } from "../../src/engine/introspector.js";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:admin@localhost:5432/postgres";

describe("Introspection Engine (Integration)", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });

    // Seed test fixture schema
    await pool.query(`
      DROP TABLE IF EXISTS ci_order_items CASCADE;
      DROP TABLE IF EXISTS ci_orders CASCADE;
      DROP TABLE IF EXISTS ci_metrics CASCADE;

      CREATE TABLE ci_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(64) NOT NULL UNIQUE,
        total_amount NUMERIC(12, 2) NOT NULL,
        metadata JSONB
      );

      CREATE TABLE ci_order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL REFERENCES ci_orders(id) ON DELETE CASCADE,
        item_sku VARCHAR(32) NOT NULL
      );

      CREATE TABLE ci_metrics (
        device_id INT NOT NULL,
        logged_at TIMESTAMPTZ NOT NULL,
        val NUMERIC(8, 2),
        PRIMARY KEY (device_id, logged_at)
      ) PARTITION BY RANGE (logged_at);
    `);
  });

  afterAll(async () => {
    await pool.query(`
      DROP TABLE IF EXISTS ci_order_items CASCADE;
      DROP TABLE IF EXISTS ci_orders CASCADE;
      DROP TABLE IF EXISTS ci_metrics CASCADE;
    `);
    await pool.end();
  });

  it("introspects tables, primary keys, and foreign keys accurately", async () => {
    const schemaIR = await introspectDatabase(pool, "public");

    const ordersTable = schemaIR.tables.find(
      (t) => t.tableName === "ci_orders",
    );
    const itemsTable = schemaIR.tables.find(
      (t) => t.tableName === "ci_order_items",
    );
    const metricsTable = schemaIR.tables.find(
      (t) => t.tableName === "ci_metrics",
    );

    expect(ordersTable).toBeDefined();
    expect(ordersTable?.primaryKeys).toContain("id");

    expect(itemsTable).toBeDefined();
    expect(itemsTable?.foreignKeys).toHaveLength(1);
    expect(itemsTable?.foreignKeys[0]).toMatchObject({
      columnName: "order_id",
      foreignTableName: "ci_orders",
      foreignColumnName: "id",
    });

    expect(metricsTable).toBeDefined();
    expect(metricsTable?.isPartitioned).toBe(true);
    expect(metricsTable?.partitionStrategy).toBe("RANGE");
  });
});
