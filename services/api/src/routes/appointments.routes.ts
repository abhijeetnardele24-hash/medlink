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
import { getDb } from "../db";
import {
  appointments,
  patients,
  doctors,
  availabilitySlots,
  auditEvents,
  users,
  paymentRecords,
} from "../db/schema";
import { authenticate } from "../middleware/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import {
  createAppointmentSchema,
  patchAppointmentSchema,
  listAppointmentsQuerySchema,
} from "../schemas/appointment.schema";
import { logger } from "../logger";
import { NotFoundError, ForbiddenError, ConflictError, UnprocessableError } from "../errors";
import { emitNotification } from "../socket/emitter";

const router = Router();

// ─── Helper: get the patient record for the current user ──────────────────────

const getPatientForUser = async (firebaseUid: string) => {
  const rows = await getDb()
    .select({ id: patients.id })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);
  return rows[0] ?? null;
};

// ─── Helper: get the doctor record for the current user ───────────────────────

const getDoctorForUser = async (firebaseUid: string) => {
  const rows = await getDb()
    .select({ id: doctors.id })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, firebaseUid))
    .limit(1);
  return rows[0] ?? null;
};

// ─── Helper: get user id from firebase uid ────────────────────────────────────

const getUserIdForFirebaseUid = async (firebaseUid: string) => {
  const rows = await getDb()
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
    const doctorRows = await getDb()
      .select({ 
        id: doctors.id, 
        userId: doctors.userId,
        verificationStatus: doctors.verificationStatus, 
        consultationFee: doctors.consultationFee 
      })
      .from(doctors)
      .where(eq(doctors.id, body.doctorId))
      .limit(1);

    if (doctorRows.length === 0 || doctorRows[0]?.verificationStatus !== "verified") {
      throw new NotFoundError("Verified doctor");
    }

    const [appointment] = await getDb()
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

    // Snapshot the fee into a payment record
    await getDb().insert(paymentRecords).values({
      appointmentId: appointment.id,
      amount: doctorRows[0].consultationFee,
      state: "pending", // Payment is now required
    });

    // Write audit event — no clinical content
    const userId = await getUserIdForFirebaseUid(uid);
    if (userId) {
      await getDb().insert(auditEvents).values({
        actorId: userId,
        actorRole: "patient",
        action: "appointment.create",
        resourceType: "appointment",
        resourceId: appointment?.id,
        outcome: "success",
      });
    }

    // Notify the doctor
    if (doctorRows[0]?.userId) {
      await emitNotification(
        doctorRows[0].userId,
        "appointment_requested",
        "New Appointment Request",
        `You have a new appointment request for ${body.scheduledAt}`,
        { appointmentId: appointment.id }
      );
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

    const rows = await getDb()
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
    const id = _req.params.id as string;

    const rows = await getDb()
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
    const id = _req.params.id as string;
    const body = _req.body as {
      action: string;
      scheduledAt?: string;
      rejectionReason?: string;
      version: number;
    };

    const rows = await getDb()
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
    await getDb().transaction(async (tx) => {
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
      await getDb().insert(auditEvents).values({
        actorId: userId,
        actorRole: role as "patient" | "doctor" | "coordinator" | "admin" | "pharmacist",
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
    const updated = await getDb()
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    res.json(updated[0]);
  }
);

// ─── POST /appointments/:id/create-payment ─────────────────────────────────────

router.post(
  "/:id/create-payment",
  authenticate,
  requireRole("patient"),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { uid } = res.locals.user;

    const patient = await getPatientForUser(uid);
    if (!patient) throw new NotFoundError("Patient profile");

    const apptRows = await getDb()
      .select({
        id: appointments.id,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        status: appointments.status,
      })
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (apptRows.length === 0) throw new NotFoundError("Appointment");
    if (apptRows[0].patientId !== patient.id) throw new ForbiddenError();

    // Fetch the snapshotted fee from payment records
    const paymentRows = await getDb()
      .select({ amount: paymentRecords.amount })
      .from(paymentRecords)
      .where(eq(paymentRecords.appointmentId, id))
      .limit(1);

    if (paymentRows.length === 0) throw new NotFoundError("Payment Record");
    const fee = paymentRows[0].amount;

    // Initialize Razorpay (using test keys if env vars missing for demo)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "demo_secret",
    });

    try {
      let order: any;
      if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === "rzp_test_demo") {
        order = {
          id: `order_mock_${Date.now()}`,
          amount: fee * 100,
          currency: "INR",
          receipt: `receipt_${id}`,
        };
      } else {
        order = await razorpay.orders.create({
          amount: fee * 100, // Razorpay amount is in paise
          currency: "INR",
          receipt: `receipt_${id}`,
        });
      }

      // Update payment record with razorpay order
      await getDb()
        .update(paymentRecords)
        .set({ razorpayOrderId: order.id, updatedAt: new Date() })
        .where(eq(paymentRecords.appointmentId, id));

      res.status(200).json({ order, fee });
    } catch (err: any) {
      logger.error({ err, appointmentId: id }, "Failed to create Razorpay order");
      res.status(500).json({ error: "Failed to create payment order" });
    }
  }
);

// ─── POST /appointments/:id/verify-payment ─────────────────────────────────────

router.post(
  "/:id/verify-payment",
  authenticate,
  requireRole("patient"),
  async (_req: Request, res: Response): Promise<void> => {
    const id = _req.params.id as string;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = _req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "demo_secret";
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      // Allow bypass if test demo
      if (secret !== "demo_secret") {
        throw new ForbiddenError("Invalid payment signature");
      }
    }

    // Update payment record to success
    await getDb()
      .update(paymentRecords)
      .set({
        state: "success",
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date(),
      })
      .where(eq(paymentRecords.appointmentId, id));

    // Confirm the appointment
    await getDb()
      .update(appointments)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(eq(appointments.id, id));

    logger.info({ appointmentId: id, paymentId: razorpay_payment_id }, "Payment verified and appointment confirmed");

    res.status(200).json({ success: true });
  }
);

export default router;
