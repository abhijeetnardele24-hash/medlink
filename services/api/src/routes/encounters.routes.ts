import { Router, type Request, type Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { encounters, prescriptions, appointments } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { NotFoundError, ForbiddenError } from "../errors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getFirebaseAdmin } from "../firebase";
import { attachments } from "../db/schema";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// ─── GET /encounters ────────────────────────────────────────────────────────
router.get(
  "/",
  authenticate,
  requireRole("doctor"),
  async (_req: Request, res: Response): Promise<void> => {
    const doctorId = (_req as any).user.id;
    const myAppts = await getDb().select({ id: appointments.id }).from(appointments).where(eq(appointments.doctorId, doctorId));
    
    if (myAppts.length === 0) {
      res.json({ data: [] });
      return;
    }

    const apptIds = myAppts.map(a => a.id);
    const rows = await getDb()
      .select()
      .from(encounters)
      .where(inArray(encounters.appointmentId, apptIds));

    res.json({ data: rows });
  }
);

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

    if (!Array.isArray(medicinesJson)) {
      res.status(400).json({ error: "medicinesJson must be an array of medicine objects" });
      return;
    }

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

    // Mark encounter as ended
    const [updatedEncounter] = await getDb()
      .update(encounters)
      .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
      .where(eq(encounters.id, id))
      .returning();

    if (updatedEncounter) {
      // Mark appointment as completed
      await getDb()
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(appointments.id, updatedEncounter.appointmentId));
    }

    res.status(201).json(prescription);
  }
);

// ─── POST /encounters/:id/recording ─────────────────────────────────────────
router.post(
  "/:id/recording",
  authenticate,
  requireRole("doctor"),
  upload.single("recording"),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const file = _req.file;

    if (!file) {
      res.status(400).json({ error: "No recording file provided" });
      return;
    }

    const bucket = getFirebaseAdmin().storage().bucket();
    const fileName = `encounters/${id}/recording_${uuidv4()}.webm`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: { contentType: file.mimetype },
    });

    // Private by default, we just store the gs:// or private bucket path in storageKey
    const storagePath = `gs://${bucket.name}/${fileName}`;

    const [attachment] = await getDb()
      .insert(attachments)
      .values({
        ownerId: (_req as any).user.id,
        encounterId: id,
        storageKey: storagePath,
        contentType: file.mimetype,
        byteSize: file.size,
        checksum: "uploaded",
        scanStatus: "clean",
      })
      .returning();

    res.status(201).json(attachment);
  }
);

// ─── GET /encounters/:id/recording-url ──────────────────────────────────────
router.get(
  "/:id/recording-url",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const userId = (_req as any).user.id;

    // Verify ownership
    const encounterRows = await getDb()
      .select({ 
        doctorId: appointments.doctorId, 
        patientId: appointments.patientId 
      })
      .from(encounters)
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .where(eq(encounters.id, id))
      .limit(1);

    if (encounterRows.length === 0) {
      throw new NotFoundError("Encounter");
    }

    const { doctorId, patientId } = encounterRows[0];
    if (userId !== doctorId && userId !== patientId) {
      throw new ForbiddenError("Not authorized to view this recording");
    }
    
    // Find the attachment
    const attachmentRows = await getDb()
      .select()
      .from(attachments)
      .where(eq(attachments.encounterId, id))
      .limit(1);

    if (attachmentRows.length === 0) {
      throw new NotFoundError("Recording");
    }

    const storageKey = attachmentRows[0].storageKey;
    const bucket = getFirebaseAdmin().storage().bucket();
    
    // Extract file name from gs://bucket/file
    const fileNameMatch = storageKey.match(/gs:\/\/[^\/]+\/(.+)/);
    if (!fileNameMatch) {
      res.status(500).json({ error: "Invalid storage key" });
      return;
    }

    const file = bucket.file(fileNameMatch[1]);
    
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    res.json({ url });
  }
);

export default router;
