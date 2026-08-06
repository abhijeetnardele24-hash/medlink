import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { doctorVerifications, doctors, appointments, patients, reminderTasks } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { NotFoundError } from "../errors";

const router = Router();

// ─── GET /admin/verifications ───────────────────────────────────────────────
// Get all pending doctor verifications
router.get(
  "/verifications",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const status = (_req.query.status as string) || "pending_verification";
    
    // In Drizzle, we do an inner join to get doctor details along with the verification
    const rows = await getDb()
      .select({
        id: doctorVerifications.id,
        doctorId: doctorVerifications.doctorId,
        status: doctorVerifications.status,
        createdAt: doctorVerifications.createdAt,
        doctor: {
          fullName: doctors.fullName,
          speciality: doctors.speciality,
          registrationNumber: doctors.registrationNumber,
          facilityName: doctors.facilityName,
          educationBackground: doctors.educationBackground,
          experienceYears: doctors.experienceYears,
          isPartTime: doctors.isPartTime,
          contactNumber: doctors.contactNumber,
        }
      })
      .from(doctorVerifications)
      .innerJoin(doctors, eq(doctorVerifications.doctorId, doctors.id))
      .where(eq(doctorVerifications.status, status as any));

    res.json(rows);
  }
);

// ─── PATCH /admin/verifications/:id ─────────────────────────────────────────
// Approve or reject a verification
router.patch(
  "/verifications/:id",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const { id } = _req.params;
    const { status, reasonCode } = _req.body as { status: string; reasonCode?: string };

    const verifRows = await getDb()
      .select()
      .from(doctorVerifications)
      .where(eq(doctorVerifications.id, id))
      .limit(1);

    if (verifRows.length === 0) throw new NotFoundError("Doctor Verification");
    const verif = verifRows[0];

    // Transaction to update both verification and doctor status atomically
    await getDb().transaction(async (tx) => {
      await tx
        .update(doctorVerifications)
        .set({
          status: status as any,
          reasonCode: reasonCode || null,
          decidedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(doctorVerifications.id, id));

      // If approved or rejected, update the actual doctor record's status
      if (status === "verified" || status === "rejected") {
        await tx
          .update(doctors)
          .set({ verificationStatus: status as any, updatedAt: new Date() })
          .where(eq(doctors.id, verif.doctorId));
      }
    });

    res.json({ success: true, message: `Doctor verification updated to ${status}` });
  }
);

// ─── GET /admin/appointments ──────────────────────────────────────────────
// Get all appointments (for coordinator oversight)
router.get(
  "/appointments",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    // In a real app we'd paginate this
    const rows = await getDb()
      .select({
        id: appointments.id,
        scheduledAt: appointments.scheduledAt,
        status: appointments.status,
        concernCategory: appointments.concernCategory,
        patient: {
          id: patients.id,
          userId: patients.userId,
        },
        doctor: {
          id: doctors.id,
          fullName: doctors.fullName,
          speciality: doctors.speciality,
        }
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .orderBy(appointments.scheduledAt);

    res.json(rows);
  }
);

// ─── GET /admin/tasks ───────────────────────────────────────────────────────
// Get all reminder tasks
router.get(
  "/tasks",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await getDb()
      .select({
        id: reminderTasks.id,
        taskType: reminderTasks.taskType,
        dueAt: reminderTasks.dueAt,
        outcome: reminderTasks.outcome,
        attemptCount: reminderTasks.attemptCount,
        coordinatorNote: reminderTasks.coordinatorNote,
        appointment: {
          id: appointments.id,
          scheduledAt: appointments.scheduledAt,
          status: appointments.status,
        },
        patient: {
          id: patients.id,
        },
        doctor: {
          id: doctors.id,
          fullName: doctors.fullName,
        }
      })
      .from(reminderTasks)
      .innerJoin(appointments, eq(reminderTasks.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .orderBy(reminderTasks.dueAt);

    res.json(rows);
  }
);

// ─── PATCH /admin/tasks/:id ─────────────────────────────────────────────────
// Update a reminder task (e.g. mark reached, confirmed)
router.patch(
  "/tasks/:id",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const { id } = _req.params;
    const { outcome, coordinatorNote } = _req.body as { outcome: string; coordinatorNote?: string };

    const taskRows = await getDb()
      .select()
      .from(reminderTasks)
      .where(eq(reminderTasks.id, id))
      .limit(1);

    if (taskRows.length === 0) throw new NotFoundError("Reminder Task");
    const task = taskRows[0];

    const updated = await getDb()
      .update(reminderTasks)
      .set({
        outcome: outcome as any,
        coordinatorNote: coordinatorNote || task.coordinatorNote,
        attemptCount: task.attemptCount + 1,
        resolvedAt: outcome !== "pending" && outcome !== "attempted" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(reminderTasks.id, id))
      .returning();

    res.json(updated[0]);
  }
);

export default router;
