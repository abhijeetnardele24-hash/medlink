import { createServer } from "./server";
import { closeDatabasePool, verifyDatabaseConnection } from "./postgres";
import { getApiConfig } from "./config";

const config = getApiConfig();
const app = createServer();

app.listen(config.port, () => {
  console.log(`medlink-api listening on port ${config.port}`);
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
