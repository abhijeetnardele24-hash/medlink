import { Router, type Request, type Response } from "express";
import { eq, inArray, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { encounters, prescriptions, appointments, users as dbUsers, doctors, patients, doctorMedicineRecommendations } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import { createEncounterSchema, createPrescriptionSchema, endEncounterSchema } from "../schemas/encounter.schema";
import { NotFoundError, ForbiddenError } from "../errors";
import multer from "multer";
import { getFirebaseAdmin } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { attachments, notifications } from "../db/schema";
import { sendPushNotification } from "../services/push.service";

const upload = multer({ storage: multer.memoryStorage() });

import { logger } from "../logger";
import messagesRouter from "./messages.routes";

const router = Router();

router.use("/:id/messages", messagesRouter);

// Helper to resolve DB user ID from Firebase UID
async function resolveAuthUserId(uid: string): Promise<string> {
  const [u] = await getDb().select({ id: dbUsers.id }).from(dbUsers).where(eq(dbUsers.firebaseUid, uid)).limit(1);
  if (u) return u.id;
  if (process.env.NODE_ENV === "production" || process.env.TEST_BYPASS_AUTH !== "true") {
    throw new ForbiddenError("User not found in db");
  }
  return uid;
}

// Helper to verify encounter participant authorization
async function verifyEncounterAccess(
  encounterId: string,
  user: { uid: string; role: string },
  requireDoctorAssigned = false
) {
  const authUserId = await resolveAuthUserId(user.uid);
  const rows = await getDb()
    .select({
      encounter: encounters,
      appointment: appointments,
      doctorUserId: doctors.userId,
      doctorId: doctors.id,
      patientUserId: patients.userId,
      patientId: patients.id,
    })
    .from(encounters)
    .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
    .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .where(eq(encounters.id, encounterId))
    .limit(1);

  if (rows.length === 0) throw new NotFoundError("Encounter");
  const enc = rows[0];

  if (user.role === "admin" || user.role === "coordinator") {
    return { ...enc, authUserId };
  }

  if (requireDoctorAssigned) {
    if (enc.doctorUserId !== authUserId) {
      throw new ForbiddenError("You are not the assigned doctor for this encounter");
    }
    return { ...enc, authUserId };
  }

  const isPatient = enc.patientUserId === authUserId;
  const isDoctor = enc.doctorUserId === authUserId;

  if (!isPatient && !isDoctor) {
    throw new ForbiddenError("You are not authorized to access this encounter");
  }

  return { ...enc, authUserId };
}

// ─── GET /encounters ────────────────────────────────────────────────────────
router.get(
  "/",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const authUserId = await resolveAuthUserId(res.locals.user.uid);
    const role = res.locals.user.role;
    let myAppts: { id: string }[] = [];
    
    if (role === "doctor") {
      const [doc] = await getDb().select({ id: doctors.id }).from(doctors).where(eq(doctors.userId, authUserId)).limit(1);
      if (!doc) {
        res.json({ data: [] });
        return;
      }
      myAppts = await getDb().select({ id: appointments.id }).from(appointments).where(eq(appointments.doctorId, doc.id));
    } else if (role === "patient") {
      const [pat] = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, authUserId)).limit(1);
      if (!pat) {
        res.json({ data: [] });
        return;
      }
      myAppts = await getDb().select({ id: appointments.id }).from(appointments).where(eq(appointments.patientId, pat.id));
    } else {
      // Coordinator / Admin
      myAppts = await getDb().select({ id: appointments.id }).from(appointments);
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
      .where(inArray(encounters.appointmentId, apptIds))
      .orderBy(desc(encounters.startedAt))
      .limit(50);

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
  validateBody(createEncounterSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const { appointmentId } = _req.body as { appointmentId: string };
    const authUserId = await resolveAuthUserId(res.locals.user.uid);

    const [doc] = await getDb().select({ id: doctors.id }).from(doctors).where(eq(doctors.userId, authUserId)).limit(1);
    if (!doc) throw new ForbiddenError("Doctor profile not found");

    const apptRows = await getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (apptRows.length === 0) throw new NotFoundError("Appointment");
    if (apptRows[0].doctorId !== doc.id && res.locals.user.role !== "admin") {
      throw new ForbiddenError("You are not the assigned doctor for this appointment");
    }

    // Atomic creation and status update
    const [encounter] = await getDb().transaction(async (tx) => {
      const [newEnc] = await tx
        .insert(encounters)
        .values({
          appointmentId,
          status: "active",
          currentMode: apptRows[0].preferredMode || "video",
          startedAt: new Date(),
        })
        .returning();

      await tx
        .update(appointments)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));

      return [newEnc];
    });

    res.status(201).json(encounter);
  }
);

// ─── GET /encounters/:id ──────────────────────────────────────────────────────
router.get(
  "/:id",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { encounter } = await verifyEncounterAccess(id, res.locals.user);
    res.json(encounter);
  }
);

// ─── POST /encounters/:id/prescriptions ─────────────────────────────────────
router.post(
  "/:id/prescriptions",
  authenticate,
  requireRole("doctor"),
  validateBody(createPrescriptionSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { medicinesJson, instructionsText } = _req.body;

    const access = await verifyEncounterAccess(id, res.locals.user, true);

    const recommendedMedicineIds = medicinesJson
      .filter((m: any) => m.medicineId && m.recommend === true)
      .map((m: any) => m.medicineId);

    // Atomic transaction for prescription insert, recommendations upsert, encounter completion, and appointment completion
    const prescription = await getDb().transaction(async (tx) => {
      const [newPrescription] = await tx
        .insert(prescriptions)
        .values({
          encounterId: id,
          doctorId: access.doctorId,
          medicinesJson,
          instructionsText,
          status: "issued",
          issuedAt: new Date(),
        })
        .returning();

      if (recommendedMedicineIds.length > 0) {
        await tx
          .insert(doctorMedicineRecommendations)
          .values(
            recommendedMedicineIds.map((medicineId: string) => ({
              doctorId: access.doctorId,
              medicineId,
            }))
          )
          .onConflictDoNothing({ target: [doctorMedicineRecommendations.doctorId, doctorMedicineRecommendations.medicineId] });
      }

      await tx
        .update(encounters)
        .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
        .where(eq(encounters.id, id));

      await tx
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(appointments.id, access.appointment.id));

      return newPrescription;
    });

    // Notify patient via push
    await sendPushNotification(access.patientUserId, {
      title: "New Prescription Issued",
      body: `Your doctor has issued a new prescription for your recent consultation.`,
      url: `/patient/history`,
    });

    // Notify patient via DB
    await getDb().insert(notifications).values({
      userId: access.patientUserId,
      title: "New Prescription Issued",
      message: `Your doctor has issued a new prescription for your recent consultation.`,
      type: "appointment",
      isRead: false,
    });

    res.status(201).json(prescription);
  }
);

// ─── POST /encounters/:id/end ────────────────────────────────────────────────
router.post(
  "/:id/end",
  authenticate,
  requireRole("doctor"),
  validateBody(endEncounterSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { summaryNotes } = _req.body;

    const access = await verifyEncounterAccess(id, res.locals.user, true);

    const updatedEncounter = await getDb().transaction(async (tx) => {
      const [enc] = await tx
        .update(encounters)
        .set({
          status: "ended",
          endedAt: new Date(),
          networkEventSummary: summaryNotes ? { notes: summaryNotes } : undefined,
          updatedAt: new Date(),
        })
        .where(eq(encounters.id, id))
        .returning();

      await tx
        .update(appointments)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(appointments.id, access.appointment.id));

      return enc;
    });

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

    const access = await verifyEncounterAccess(id, res.locals.user, true);

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
    await verifyEncounterAccess(id, res.locals.user);
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
