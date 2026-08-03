import { Pool } from "pg";
import { getApiConfig } from "./config";

const config = getApiConfig();

const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const verifyDatabaseConnection = async (): Promise<void> => {
  await pool.query("SELECT 1");
};

export const closeDatabasePool = async (): Promise<void> => {
  await pool.end();
};
