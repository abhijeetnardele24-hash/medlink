import fs from "fs";
import path from "path";

// Ensure .env is loaded before anything else
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { createServer } from "./server";
import { closeDatabasePool, verifyDatabaseConnection } from "./postgres";

const port = parseInt(process.env.PORT ?? "3000", 10);
const app = createServer();

app.listen(port, () => {
  console.log(`medlink-api listening on port ${port}`);
});

void verifyDatabaseConnection()
  .then(() => {
    console.log("postgres connection established");
  })
  .catch((error: unknown) => {
    console.error("postgres connection failed", error);
  });

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  try {
    await closeDatabasePool();
    console.log(`medlink-api closed database pool after ${signal}`);
    process.exit(0);
  } catch (error: unknown) {
    console.error("error while closing database pool", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
