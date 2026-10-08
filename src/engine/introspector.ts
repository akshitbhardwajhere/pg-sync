import { Pool } from "pg";
import { SchemaIR, TableMeta, ColumnMeta, ForeignKeyMeta } from "./types.js";

export async function introspectDatabase(
  pool: Pool,
  targetSchema: string = "public",
): Promise<SchemaIR> {
  const client = await pool.connect();

  try {
    // 1. Fetch tables and partition info
    const tablesQuery = `
      SELECT 
        c.relname AS table_name,
        c.relkind,
        pt.partstrat AS partition_strategy
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_catalog.pg_partitioned_table pt ON pt.partrelid = c.oid
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'p')
      ORDER BY c.relname;
    `;
    const { rows: tableRows } = await client.query(tablesQuery, [targetSchema]);

    // 2. Fetch columns
    const columnsQuery = `
      SELECT 
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1
      ORDER BY table_name, ordinal_position;
    `;
    const { rows: columnRows } = await client.query(columnsQuery, [
      targetSchema,
    ]);

    // 3. Fetch primary keys
    const pkQuery = `
      SELECT 
        kcu.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = $1;
    `;
    const { rows: pkRows } = await client.query(pkQuery, [targetSchema]);

    // 4. Fetch foreign keys
    const fkQuery = `
      SELECT
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1;
    `;
    const { rows: fkRows } = await client.query(fkQuery, [targetSchema]);

    // Construct the Schema Intermediate Representation
    const tables: TableMeta[] = tableRows.map((t) => {
      const currentTableColumns = columnRows.filter(
        (c) => c.table_name === t.table_name,
      );
      const currentTablePKs = pkRows
        .filter((pk) => pk.table_name === t.table_name)
        .map((pk) => pk.column_name);
      const currentTableFKs: ForeignKeyMeta[] = fkRows
        .filter((fk) => fk.table_name === t.table_name)
        .map((fk) => ({
          columnName: fk.column_name,
          foreignTableName: fk.foreign_table_name,
          foreignColumnName: fk.foreign_column_name,
        }));

      const columns: ColumnMeta[] = currentTableColumns.map((col) => ({
        name: col.column_name,
        dbType: col.data_type,
        udtName: col.udt_name,
        isNullable: col.is_nullable === "YES",
        isPrimaryKey: currentTablePKs.includes(col.column_name),
        defaultValue: col.column_default,
      }));

      const partitionStrategyMap: Record<string, "RANGE" | "LIST" | "HASH"> = {
        r: "RANGE",
        l: "LIST",
        h: "HASH",
      };

      return {
        tableName: t.table_name,
        schema: targetSchema,
        isPartitioned: t.relkind === "p",
        partitionStrategy: t.partition_strategy
          ? partitionStrategyMap[t.partition_strategy]
          : undefined,
        columns,
        primaryKeys: currentTablePKs,
        foreignKeys: currentTableFKs,
      };
    });

    return {
      extractedAt: new Date().toISOString(),
      tables,
    };
  } finally {
    client.release();
  }
}
