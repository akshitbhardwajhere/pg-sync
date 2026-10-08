import pg from "pg";

const { Pool } = pg;

export function createDatabasePool(connectionString: string): pg.Pool {
  return new Pool({
    connectionString,
    ssl:
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
}
