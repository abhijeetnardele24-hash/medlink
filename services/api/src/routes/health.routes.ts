/**
 * MedLink — Health check routes
 *
 * Extracted from server.ts for a cleaner module boundary.
 *
 * GET /health       — liveness probe (always 200 if process is up)
 * GET /health/ready — readiness probe (200 when DB is reachable)
 */

import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { logger } from "../logger";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "medlink-api" });
});

router.get("/health/ready", async (_req, res) => {
  try {
    await getDb().execute(sql`SELECT 1`);
    res.json({ status: "ok", service: "medlink-api", database: "up" });
  } catch (err) {
    logger.warn({ err }, "Database readiness check failed");
    res.status(503).json({
      status: "degraded",
      service: "medlink-api",
      database: "down",
    });
  }
});

export default router;
