/**
 * MedLink — Appointment routes
 *
 * POST  /appointments          — patient creates an appointment request [auth: patient]
 * GET   /appointments          — list own appointments (patient sees theirs; doctor sees theirs) [auth]
 * GET   /appointments/:id      — single appointment detail [auth, must own]
 * PATCH /appointments/:id      — doctor accepts/rejects/reschedules; patient can cancel [auth]
 *
 * Design notes:
 * - Uses optimistic locking: PATCH requires a `version` field that must
 *   match the current server version. Stale updates get a 409 Conflict.
 * - Slot reservation is atomic: confirming an appointment marks the slot
 *   as 'booked' in the same DB transaction.
 * - Audit events are written for every status transition.
 */

import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  appointments,
  patients,
  doctors,
  availabilitySlots,
  auditEvents,
  users,
} from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import {
  createAppointmentSchema,
  patchAppointmentSchema,
  listAppointmentsQuerySchema,
} from "../schemas/appointment.schema";
import { logger } from "../logger";
import { NotFoundError, ForbiddenError, ConflictError, UnprocessableError } from "../errors";

const router = Router();

// ─── Helper: get the patient record for the current user ──────────────────────

const getPatientForUser = async (firebaseUid: string) => {
  const rows = await db
    .select({ id: patients.id })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);
  return rows[0] ?? null;
};

// ─── Helper: get the doctor record for the current user ───────────────────────

const getDoctorForUser = async (firebaseUid: string) => {
  const rows = await db
    .select({ id: doctors.id })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);
  return rows[0] ?? null;
};

// ─── Helper: get user id from firebase uid ────────────────────────────────────

const getUserIdForFirebaseUid = async (firebaseUid: string) => {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);
  return rows[0]?.id ?? null;
};

// ─── POST /appointments ───────────────────────────────────────────────────────

router.post(
  "/",
  authenticate,
  requireRole("patient"),
  validateBody(createAppointmentSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;
    const body = _req.body as {
      doctorId: string;
      slotId?: string;
      scheduledAt: string;
      concernCategory: string;
      preferredMode?: "video" | "audio" | "async_chat" | "offline";
      patientNotes?: string;
    };

    const patient = await getPatientForUser(uid);
    if (!patient) throw new NotFoundError("Patient profile");

    // Verify the target doctor exists and is verified
    const doctorRows = await db
      .select({ id: doctors.id, verificationStatus: doctors.verificationStatus })
      .from(doctors)
      .where(eq(doctors.id, body.doctorId))
      .limit(1);

    if (doctorRows.length === 0 || doctorRows[0]?.verificationStatus !== "verified") {
      throw new NotFoundError("Verified doctor");
    }

    const [appointment] = await db
      .insert(appointments)
      .values({
        patientId: patient.id,
        doctorId: body.doctorId,
        slotId: body.slotId,
        scheduledAt: new Date(body.scheduledAt),
        concernCategory: body.concernCategory,
        preferredMode: body.preferredMode,
        patientNotes: body.patientNotes,
        status: "requested",
      })
      .returning();

    // Write audit event — no clinical content
    const userId = await getUserIdForFirebaseUid(uid);
    if (userId) {
      await db.insert(auditEvents).values({
        actorId: userId,
        actorRole: "patient",
        action: "appointment.create",
        resourceType: "appointment",
        resourceId: appointment?.id,
        outcome: "success",
      });
    }

    logger.info({ appointmentId: appointment?.id, patientId: patient.id }, "Appointment requested");

    res.status(201).json(appointment);
  }
);

// ─── GET /appointments ────────────────────────────────────────────────────────

router.get(
  "/",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const { uid, role } = res.locals.user;
    const query = listAppointmentsQuerySchema.safeParse(_req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query", issues: query.error.issues });
      return;
    }
    const { status, page, limit } = query.data;
    const offset = (page - 1) * limit;

    let ownerCondition;

    if (role === "patient") {
      const patient = await getPatientForUser(uid);
      if (!patient) throw new NotFoundError("Patient profile");
      ownerCondition = eq(appointments.patientId, patient.id);
    } else if (role === "doctor") {
      const doctor = await getDoctorForUser(uid);
      if (!doctor) throw new NotFoundError("Doctor profile");
      ownerCondition = eq(appointments.doctorId, doctor.id);
    } else {
      // coordinators / admins: see all (add pagination)
      ownerCondition = undefined;
    }

    const conditions = ownerCondition ? [ownerCondition] : [];
    if (status) conditions.push(eq(appointments.status, status));

    const rows = await db
      .select()
      .from(appointments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(appointments.scheduledAt);

    res.json({ data: rows, page, limit });
  }
);

// ─── GET /appointments/:id ────────────────────────────────────────────────────

router.get(
  "/:id",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const { uid, role } = res.locals.user;
    const { id } = _req.params;

    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (rows.length === 0) throw new NotFoundError("Appointment");
    const appt = rows[0]!;

    // Ownership check: patient sees own, doctor sees assigned, coordinator/admin see all
    if (role === "patient") {
      const patient = await getPatientForUser(uid);
      if (!patient || appt.patientId !== patient.id) throw new ForbiddenError();
    } else if (role === "doctor") {
      const doctor = await getDoctorForUser(uid);
      if (!doctor || appt.doctorId !== doctor.id) throw new ForbiddenError();
    }

    res.json(appt);
  }
);

// ─── PATCH /appointments/:id ──────────────────────────────────────────────────

router.patch(
  "/:id",
  authenticate,
  validateBody(patchAppointmentSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const { uid, role } = res.locals.user;
    const { id } = _req.params;
    const body = _req.body as {
      action: string;
      scheduledAt?: string;
      rejectionReason?: string;
      version: number;
    };

    const rows = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (rows.length === 0) throw new NotFoundError("Appointment");
    const appt = rows[0]!;

    // Optimistic lock check
    if (appt.version !== body.version) {
      throw new ConflictError(
        `Appointment was updated by another request. Expected version ${body.version}, got ${appt.version}. Refresh and retry.`
      );
    }

    // Role-based action gate
    const allowedActions: Record<string, string[]> = {
      patient: ["cancel"],
      doctor: ["confirm", "reject", "reschedule", "mark_in_progress", "mark_completed", "mark_missed"],
      coordinator: ["cancel"],
      admin: ["cancel", "confirm", "reject"],
    };

    if (!allowedActions[role]?.includes(body.action)) {
      throw new ForbiddenError(
        `Role '${role}' cannot perform action '${body.action}' on an appointment`
      );
    }

    // Derive new status from action
    const statusMap: Record<string, string> = {
      confirm: "confirmed",
      reject: "rejected",
      reschedule: "rescheduled",
      cancel: "cancelled",
      mark_in_progress: "in_progress",
      mark_completed: "completed",
      mark_missed: "missed",
    };

    const newStatus = statusMap[body.action];
    if (!newStatus) throw new UnprocessableError(`Unknown action: ${body.action}`);

    // Reservation: confirm action books the slot atomically
    await db.transaction(async (tx) => {
      if (body.action === "confirm" && appt.slotId) {
        await tx
          .update(availabilitySlots)
          .set({ status: "booked", updatedAt: new Date() })
          .where(
            and(
              eq(availabilitySlots.id, appt.slotId),
              eq(availabilitySlots.status, "available")
            )
          );
      }

      const updateFields: Record<string, unknown> = {
        status: newStatus,
        version: appt.version + 1,
        updatedAt: new Date(),
      };

      if (body.action === "reschedule" && body.scheduledAt) {
        updateFields.scheduledAt = new Date(body.scheduledAt);
      }

      await tx
        .update(appointments)
        .set(updateFields)
        .where(eq(appointments.id, id));
    });

    // Write audit event
    const userId = await getUserIdForFirebaseUid(uid);
    if (userId) {
      await db.insert(auditEvents).values({
        actorId: userId,
        actorRole: role as "patient" | "doctor" | "coordinator" | "admin",
        action: `appointment.${body.action}`,
        resourceType: "appointment",
        resourceId: id,
        outcome: "success",
      });
    }

    logger.info(
      { appointmentId: id, action: body.action, newStatus, actorRole: role },
      "Appointment status transitioned"
    );

    // Return the updated record
    const updated = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    res.json(updated[0]);
  }
);

export default router;
