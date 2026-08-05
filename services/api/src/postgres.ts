/**
 * MedLink — pg Pool (legacy; kept for postgres.ts verifyDatabaseConnection)
 * Routes should use the Drizzle client from src/db instead.
 */

import { Pool } from "pg";

let _pool: Pool | null = null;

const getPool = (): Pool => {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  _pool = new Pool({ connectionString: url });
  return _pool;
};

export const verifyDatabaseConnection = async (): Promise<void> => {
  await getPool().query("SELECT 1");
};

export const closeDatabasePool = async (): Promise<void> => {
  if (_pool) await _pool.end();
};
