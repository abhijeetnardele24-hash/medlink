/**
 * MedLink — Drizzle DB client
 *
 * Call `getDb()` inside route handlers and services to get the typed
 * Drizzle client. The pool is created on first call and reused.
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Schema = typeof schema;

let _db: NodePgDatabase<Schema> | null = null;

export const getDb = (): NodePgDatabase<Schema> => {
  if (_db) return _db;
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl || databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  _db = drizzle(pool, { schema });
  return _db;
};

export type DrizzleDb = NodePgDatabase<Schema>;
