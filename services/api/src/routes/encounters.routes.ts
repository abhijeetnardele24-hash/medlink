import { Router, type Request, type Response } from "express";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { encounters, prescriptions, appointments, users as dbUsers, doctors, doctorMedicineRecommendations } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { NotFoundError, ForbiddenError } from "../errors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getFirebaseAdmin } from "../firebase";
import { attachments } from "../db/schema";

const upload = multer({ storage: multer.memoryStorage() });

import messagesRouter from "./messages.routes";

const router = Router();

router.use("/:id/messages", messagesRouter);

// ─── GET /encounters ────────────────────────────────────────────────────────
router.get(
  "/",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const firebaseUid = res.locals.user.uid;
    let userId = firebaseUid;
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await getDb().select({ id: dbUsers.id }).from(dbUsers).where(eq(dbUsers.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      userId = u.id;
    }
    const role = res.locals.user.role;
    let myAppts;
    
    if (role === "doctor") {
      myAppts = await getDb().select({ id: appointments.id }).from(appointments).where(eq(appointments.doctorId, userId));
    } else {
      myAppts = await getDb().select({ id: appointments.id }).from(appointments).where(eq(appointments.patientId, userId));
    }
    
    if (myAppts.length === 0) {
      res.json({ data: [] });
      return;
    }

    const apptIds = myAppts.map(a => a.id);

    const rows = await getDb()
      .select({
        id: encounters.id,
        appointmentId: encounters.appointmentId,
        status: encounters.status,
        startedAt: encounters.startedAt,
        endedAt: encounters.endedAt,
        prescriptionId: prescriptions.id,
        concernCategory: appointments.concernCategory,
        doctorFullName: dbUsers.displayName,
        doctorSpeciality: doctors.speciality,
      })
      .from(encounters)
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .innerJoin(dbUsers, eq(doctors.userId, dbUsers.id))
      .leftJoin(prescriptions, eq(encounters.id, prescriptions.encounterId))
      .where(inArray(encounters.appointmentId, apptIds));

    const formattedRows = rows.map(r => ({
      id: r.id,
      appointmentId: r.appointmentId,
      status: r.status,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      prescriptionId: r.prescriptionId,
      appointment: {
        concernCategory: r.concernCategory,
        doctor: {
          fullName: r.doctorFullName,
          speciality: r.doctorSpeciality
        }
      }
    }));

    res.json({ data: formattedRows });
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

    // Find all medicines that have a medicineId and recommend=true
    const recommendedMedicineIds = medicinesJson
      .filter((m: any) => m.medicineId && m.recommend === true)
      .map((m: any) => m.medicineId);

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

    if (recommendedMedicineIds.length > 0) {
      // Upsert into doctorMedicineRecommendations (ignore conflicts if already recommended)
      await getDb()
        .insert(doctorMedicineRecommendations)
        .values(
          recommendedMedicineIds.map((medicineId: string) => ({
            doctorId,
            medicineId,
          }))
        )
        .onConflictDoNothing({ target: [doctorMedicineRecommendations.doctorId, doctorMedicineRecommendations.medicineId] });
    }

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

// ─── POST /encounters/:id/end ────────────────────────────────────────────────
router.post(
  "/:id/end",
  authenticate,
  requireRole("doctor"),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { summaryNotes } = _req.body;

    const [updatedEncounter] = await getDb()
      .update(encounters)
      .set({
        status: "ended",
        endedAt: new Date(),
        networkEventSummary: summaryNotes ? { notes: summaryNotes } : undefined,
        updatedAt: new Date(),
      })
      .where(eq(encounters.id, id))
      .returning();

    if (!updatedEncounter) {
      throw new NotFoundError("Encounter");
    }

    // Mark appointment as completed
    await getDb()
      .update(appointments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(appointments.id, updatedEncounter.appointmentId));

    res.json({ message: "Encounter ended successfully", encounter: updatedEncounter });
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
        ownerId: res.locals.user.uid,
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
    const firebaseUid = res.locals.user.uid;
    let userId = firebaseUid;
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await getDb().select({ id: dbUsers.id }).from(dbUsers).where(eq(dbUsers.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      userId = u.id;
    }

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
