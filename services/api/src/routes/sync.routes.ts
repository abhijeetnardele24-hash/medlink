import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { messages } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { eq, gt, or, inArray, and } from "drizzle-orm";
import { encounters, appointments, patients, doctors, users } from "../db/schema";
import { logger } from "../logger";

const router = Router();

// Require auth for all sync endpoints
router.use(authenticate);

// Helper to fetch authorized encounter IDs for a user
async function getAuthorizedEncounterIds(db: any, firebaseUid: string, encounterIds: string[]): Promise<string[]> {
  if (encounterIds.length === 0) return [];
  
  let userId = firebaseUid;
  if (process.env.TEST_BYPASS_AUTH !== "true") {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    if (!u) return [];
    userId = u.id;
  }

  const results = await db
    .select({ id: encounters.id })
    .from(encounters)
    .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .where(
      and(
        inArray(encounters.id, encounterIds),
        or(
          eq(patients.userId, userId),
          eq(doctors.userId, userId)
        )
      )
    );
    
  return results.map((r: any) => r.id);
}

// ──────────────── POST /v1/sync/push ─────────────────────────────────────────────────────────────
// Drain client's outbox to the server
router.post("/push", async (req: Request, res: Response): Promise<void> => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations)) {
      res.status(400).json({ error: "operations must be an array" });
      return;
    }

    const results = [];
    const db = getDb();

    for (const op of operations) {
      const { idempotencyKey, entityType, action, payload } = op;

      if (entityType === "message" && action === "CREATE") {
        try {
          const { encounterId, body, attachmentId } = payload;
          
          if (!idempotencyKey) {
            results.push({ status: "error", error: "Missing idempotencyKey" });
            continue;
          }

          // Authorize the encounterId for push
          const authorizedIds = await getAuthorizedEncounterIds(db, res.locals.user.uid, [encounterId]);
          if (authorizedIds.length === 0) {
            results.push({ idempotencyKey, status: "error", error: "Not authorized to access this encounter" });
            continue;
          }

          // Check if already processed (Idempotency)
          const existing = await db
            .select({ id: messages.id })
            .from(messages)
            .where(eq(messages.idempotencyKey, idempotencyKey))
            .limit(1);

          if (existing.length > 0) {
            results.push({ idempotencyKey, status: "success", serverId: existing[0].id });
            continue;
          }

          // Insert new message
          const inserted = await db.insert(messages).values({
            encounterId,
            senderId: res.locals.user.uid,
            body,
            attachmentId: attachmentId || null,
            idempotencyKey,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning({ id: messages.id });

          results.push({ idempotencyKey, status: "success", serverId: inserted[0].id });
        } catch (err: any) {
          logger.error({ err, op }, "Failed to process sync operation");
          results.push({ idempotencyKey, status: "error", error: err.message });
        }
      } else {
        // Unrecognized entity/action
        results.push({ idempotencyKey, status: "error", error: `Unsupported operation: ${entityType} ${action}` });
      }
    }

    res.json({ results });
  } catch (err) {
    logger.error({ err }, "Push sync failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /v1/sync/pull ───────────────────────────────────────────────────
// Fetch changes from the server after the provided cursor
router.get("/pull", async (req: Request, res: Response): Promise<void> => {
  try {
    const cursor = req.query.cursor ? new Date(Number(req.query.cursor)) : new Date(0);
    const db = getDb();
    
    const encounterIdsParam = req.query.encounterIds as string;
    
    if (!encounterIdsParam) {
      res.json({ data: { messages: [] }, nextCursor: Date.now() });
      return;
    }

    const encounterIds = encounterIdsParam.split(',').filter(Boolean);
    if (encounterIds.length === 0) {
      res.json({ data: { messages: [] }, nextCursor: Date.now() });
      return;
    }

    // Filter to only encounters the user is authorized to read
    const authorizedIds = await getAuthorizedEncounterIds(db, res.locals.user.uid, encounterIds);
    if (authorizedIds.length === 0) {
      res.json({ data: { messages: [] }, nextCursor: Date.now() });
      return;
    }

    const pulledMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          inArray(messages.encounterId, authorizedIds),
          gt(messages.updatedAt, cursor)
        )
      )
      .orderBy(messages.updatedAt);

    // Determine the next cursor
    const nextCursor = pulledMessages.length > 0 
      ? pulledMessages[pulledMessages.length - 1].updatedAt.getTime() 
      : Date.now();

    res.json({
      data: {
        messages: pulledMessages
      },
      nextCursor
    });
  } catch (err) {
    logger.error({ err }, "Pull sync failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /v1/sync/ack ───────────────────────────────────────────────────
// Acknowledge the client has received the data up to cursor
router.post("/ack", async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
