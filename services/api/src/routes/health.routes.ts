import { Router } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { logger } from "../logger";
import { getFirebaseAdmin } from "../firebase";

const router = Router();

router.get("/live", (_req, res) => {
  res.json({ status: "ok", service: "medlink-api" });
});

router.get("/ready", async (_req, res) => {
  let dbStatus = "up";
  let firebaseStatus = "up";
  
  try {
    await getDb().execute(sql`SELECT 1`);
  } catch (err) {
    logger.warn({ err }, "Database readiness check failed");
    dbStatus = "down";
  }

  try {
    const admin = getFirebaseAdmin();
    if (!admin.options.projectId && !admin.options.credential) {
      throw new Error("Firebase Admin not properly initialized");
    }
  } catch (err) {
    logger.warn({ err }, "Firebase Admin readiness check failed");
    firebaseStatus = "down";
  }

  if (dbStatus === "down" || firebaseStatus === "down") {
    res.status(503).json({
      status: "degraded",
      service: "medlink-api",
      database: dbStatus,
      firebase: firebaseStatus
    });
    return;
  }

  res.json({ status: "ok", service: "medlink-api", database: "up", firebase: "up" });
});

export default router;
