import { Router, type Request, type Response } from "express";
import { eq, count, sql } from "drizzle-orm";
import { getDb } from "../db";
import { doctorVerifications, doctors, appointments, patients, reminderTasks, pharmacists, pharmacistVerifications, pharmacistVerificationHistory, users, auditEvents } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import { reviewDoctorVerificationSchema, reviewPharmacistVerificationSchema } from "../schemas/admin.schema";
import { NotFoundError } from "../errors";
import { invalidateCachePrefix } from "../redis";

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
  validateBody(reviewDoctorVerificationSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { status, reasonCode } = _req.body as { status: string; reasonCode?: string };
    const { uid } = res.locals.user;

    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    const coordinatorId = userRows[0]?.id || "system";

    const verifRows = await getDb()
      .select()
      .from(doctorVerifications)
      .where(eq(doctorVerifications.id, id))
      .limit(1);

    if (verifRows.length === 0) throw new NotFoundError("Doctor Verification");
    const verif = verifRows[0];

    // Transaction to update both verification, doctor status, and audit log atomically
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

      await tx.insert(auditEvents).values({
        actorId: coordinatorId,
        actorRole: "coordinator",
        action: `doctor.verification.${status}`,
        resourceType: "doctor",
        resourceId: verif.doctorId,
        outcome: "success",
        metadata: { verificationId: id, status, reasonCode },
      });
    });

    await invalidateCachePrefix("doctors:");

    res.json({ success: true, message: `Doctor verification updated to ${status}` });
  }
);

// ─── GET /admin/pharmacist-verifications ──────────────────────────────────
router.get(
  "/pharmacist-verifications",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const status = (_req.query.status as string) || "pending_verification";
    
    const rows = await getDb()
      .select({
        id: pharmacistVerifications.id,
        pharmacistId: pharmacistVerifications.pharmacistId,
        status: pharmacistVerifications.status,
        createdAt: pharmacistVerifications.createdAt,
        pharmacist: {
          fullName: pharmacists.fullName,
          shopName: pharmacists.shopName,
          registeredAddress: pharmacists.registeredAddress,
          contactNumber: pharmacists.contactNumber,
          drugLicenseNumber: pharmacists.drugLicenseNumber,
          drugLicenseDocumentUrl: pharmacists.drugLicenseDocumentUrl,
          pharmacyCouncilRegistrationNumber: pharmacists.pharmacyCouncilRegistrationNumber,
          licenseIssuingState: pharmacists.licenseIssuingState,
          licenseExpiryDate: pharmacists.licenseExpiryDate,
        }
      })
      .from(pharmacistVerifications)
      .innerJoin(pharmacists, eq(pharmacistVerifications.pharmacistId, pharmacists.id))
      .where(eq(pharmacistVerifications.status, status as any));

    res.json(rows);
  }
);

// ─── PATCH /admin/pharmacist-verifications/:id ──────────────────────────────
router.patch(
  "/pharmacist-verifications/:id",
  authenticate,
  requireRole("coordinator"),
  validateBody(reviewPharmacistVerificationSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { status, reasonCode, notes } = _req.body as { status: string; reasonCode?: string; notes?: string };
    const { uid } = res.locals.user;

    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (userRows.length === 0) throw new NotFoundError("User");
    const coordinatorId = userRows[0].id;

    const verifRows = await getDb()
      .select()
      .from(pharmacistVerifications)
      .where(eq(pharmacistVerifications.id, id))
      .limit(1);

    if (verifRows.length === 0) throw new NotFoundError("Pharmacist Verification");
    const verif = verifRows[0];

    await getDb().transaction(async (tx) => {
      await tx
        .update(pharmacistVerifications)
        .set({
          status: status as any,
          reasonCode: reasonCode || null,
          decidedAt: new Date(),
          updatedAt: new Date(),
          reviewerId: coordinatorId,
          reviewerComment: notes,
        })
        .where(eq(pharmacistVerifications.id, id));

      if (status === "verified" || status === "rejected") {
        await tx
          .update(pharmacists)
          .set({ verificationStatus: status as any, updatedAt: new Date() })
          .where(eq(pharmacists.id, verif.pharmacistId));
      }

      // Add to verification history
      let actionName = status;
      if (status === "needs_correction") actionName = "correction_requested";
      
      await tx
        .insert(pharmacistVerificationHistory)
        .values({
          pharmacistId: verif.pharmacistId,
          coordinatorId,
          action: actionName as any,
          notes: notes || reasonCode,
        });

      await tx.insert(auditEvents).values({
        actorId: coordinatorId,
        actorRole: "coordinator",
        action: `pharmacist.verification.${status}`,
        resourceType: "pharmacist",
        resourceId: verif.pharmacistId,
        outcome: "success",
        metadata: { verificationId: id, status, reasonCode, notes },
      });
    });

    await invalidateCachePrefix("medicines:");

    res.json({ success: true, message: `Pharmacist verification updated to ${status}` });
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
    const id = _req.params.id as string;
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


// ─── GET /admin/analytics ───────────────────────────────────────────────────
router.get(
  "/analytics",
  authenticate,
  requireRole("coordinator"),
  async (_req: Request, res: Response): Promise<void> => {
    const db = getDb();
    
    // Quick counts for the dashboard
    const [patientCount] = await db.select({ value: count() }).from(patients);
    const [doctorCount] = await db.select({ value: count() }).from(doctors);
    const [apptCount] = await db.select({ value: count() }).from(appointments);
    const [pharmacistCount] = await db.select({ value: count() }).from(pharmacists);
    
    // Appointments by status
    const apptsByStatus = await db
      .select({
        status: appointments.status,
        count: count()
      })
      .from(appointments)
      .groupBy(appointments.status);
      
    // Doctors by speciality
    const docsBySpeciality = await db
      .select({
        speciality: doctors.speciality,
        count: count()
      })
      .from(doctors)
      .groupBy(doctors.speciality);

    res.json({
      overview: {
        totalPatients: patientCount.value,
        totalDoctors: doctorCount.value,
        totalAppointments: apptCount.value,
        totalPharmacists: pharmacistCount.value,
      },
      appointmentsByStatus: apptsByStatus,
      doctorsBySpeciality: docsBySpeciality,
    });
  }
);

// ─── GET|POST /admin/seed-test-appointment ──────────────────────────────────
// DEV ONLY: Creates a confirmed appointment between the first doctor and first
// patient in the DB. No auth required. Works via browser URL bar (GET) or curl (POST).
router.all(
  "/seed-test-appointment",
  async (_req: Request, res: Response): Promise<void> => {
    const db = getDb();

    const allDoctors = await db.select().from(doctors).limit(1);
    const allPatients = await db.select().from(patients).limit(1);

    if (allDoctors.length === 0) {
      res.status(404).json({ error: "No doctors found. Run seed-users.bat first." });
      return;
    }
    if (allPatients.length === 0) {
      res.status(404).json({ error: "No patients found. Run seed-users.bat first." });
      return;
    }

    const doctor = allDoctors[0];
    const patient = allPatients[0];

    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: new Date(),
        status: "confirmed",
        concernCategory: "general_consultation",
        version: 1,
      })
      .returning();

    res.json({
      success: true,
      message: "Test appointment created! Refresh both portals to see it.",
      appointment: {
        id: appointment.id,
        status: appointment.status,
        doctorId: doctor.id,
        patientId: patient.id,
        scheduledAt: appointment.scheduledAt,
      },
      portals: {
        patient: "http://localhost:5176",
        doctor: "http://localhost:5173",
      },
    });
  }
);

export default router;

