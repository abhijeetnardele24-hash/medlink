/**
 * MedLink — Drizzle DB client
 *
 * Lazily initialises the pg Pool and Drizzle client on first use.
 * This avoids DATABASE_URL being required at module import time.
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Schema = typeof schema;

let _db: NodePgDatabase<Schema> | null = null;

const createDb = (): NodePgDatabase<Schema> => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  return drizzle(pool, { schema });
};

/**
 * Lazily-initialised Drizzle client.
 * Import `db` wherever you need to run queries.
 */
export const db = new Proxy({} as NodePgDatabase<Schema>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type DrizzleDb = NodePgDatabase<Schema>;
