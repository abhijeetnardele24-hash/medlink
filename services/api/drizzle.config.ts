import type { Config } from "drizzle-kit";

// drizzle-kit CLI automatically loads .env — no manual dotenv needed here.
// DATABASE_URL must be set in .env or the environment before running db:* scripts.
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://localhost:5432/medlink";

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;
