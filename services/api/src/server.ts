import express, { type Express } from "express";
import { verifyDatabaseConnection } from "./postgres";

export const createServer = (): Express => {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "medlink-api" });
  });

  app.get("/health/ready", async (_req, res) => {
    try {
      await verifyDatabaseConnection();
      res.json({ status: "ok", service: "medlink-api", database: "up" });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Database connection failed";

      res.status(503).json({
        status: "degraded",
        service: "medlink-api",
        database: "down",
        error: errorMessage,
      });
    }
  });

  return app;
};
