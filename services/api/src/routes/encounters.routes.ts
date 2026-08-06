import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { encounters, prescriptions, appointments } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { NotFoundError, ForbiddenError } from "../errors";

const router = Router();

// ─── POST /encounters ───────────────────────────────────────────────────────
// Start a consultation session from an appointment
router.post(
  "/",
  authenticate,
  requireRole("doctor"),
  async (_req: Request, res: Response): Promise<void> => {
    const { appointmentId } = _req.body as { appointmentId: string };

    const apptRows = await getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (apptRows.length === 0) throw new NotFoundError("Appointment");

    // Create the encounter record
    const [encounter] = await getDb()
      .insert(encounters)
      .values({
        appointmentId,
        status: "active",
        currentMode: apptRows[0].preferredMode || "video",
        startedAt: new Date(),
      })
      .returning();

    // Mark appointment as in progress
    await getDb()
      .update(appointments)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(appointments.id, appointmentId));

    res.status(201).json(encounter);
  }
);

// ─── GET /encounters/:id ──────────────────────────────────────────────────────
router.get(
  "/:id",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;

    const rows = await getDb()
      .select()
      .from(encounters)
      .where(eq(encounters.id, id))
      .limit(1);

    if (rows.length === 0) throw new NotFoundError("Encounter");
    res.json(rows[0]);
  }
);

// ─── POST /encounters/:id/prescriptions ─────────────────────────────────────
router.post(
  "/:id/prescriptions",
  authenticate,
  requireRole("doctor"),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { doctorId, medicinesJson, instructionsText } = _req.body;

    const [prescription] = await getDb()
      .insert(prescriptions)
      .values({
        encounterId: id,
        doctorId,
        medicinesJson,
        instructionsText,
        status: "issued",
        issuedAt: new Date(),
      })
      .returning();

    // Optionally mark encounter as ended
    await getDb()
      .update(encounters)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(encounters.id, id));

    res.status(201).json(prescription);
  }
);

export default router;
