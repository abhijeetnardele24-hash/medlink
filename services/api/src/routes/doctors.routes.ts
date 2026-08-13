/**
 * MedLink — Doctor routes
 *
 * GET  /doctors                       — list verified doctors (paginated, filterable)
 * GET  /doctors/:id                   — single doctor profile
 * POST /doctors/me/profile            — doctor completes their own profile [auth: doctor]
 * POST /doctors/me/availability       — doctor creates an availability slot [auth: doctor]
 * GET  /doctors/:id/availability      — list available slots for a doctor
 *
 * Design notes:
 * - Only VERIFIED doctors are visible in the public directory per the security model.
 * - Doctors manage their own availability; coordinators and admins can suspend but
 *   cannot create slots on behalf of a doctor.
 * - Slot creation checks that the doctor's verification status is 'verified'.
 */

import { Router, type Request, type Response } from "express";
import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { doctors, availabilitySlots, users } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import {
  createDoctorProfileSchema,
  createAvailabilitySlotSchema,
  listDoctorsQuerySchema,
} from "../schemas/doctor.schema";
import { logger } from "../logger";
import { NotFoundError, ForbiddenError, ConflictError } from "../errors";
import { withCache, invalidateCachePrefix } from "../redis";

const router = Router();

// ─── GET /doctors ─────────────────────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const query = listDoctorsQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query parameters", issues: query.error.issues });
    return;
  }

  const { speciality, language, page, limit } = query.data;
  const offset = (page - 1) * limit;

  const cacheKey = `doctors:list:${speciality || "all"}:${language || "all"}:${page}:${limit}`;

  const data = await withCache(cacheKey, 300, async () => {
    // Build WHERE clause: only verified doctors
    const conditions = [eq(doctors.verificationStatus, "verified")];
    if (speciality) conditions.push(eq(doctors.speciality, speciality));

    const rows = await getDb()
      .select({
        id: doctors.id,
        fullName: doctors.fullName,
        speciality: doctors.speciality,
        facilityName: doctors.facilityName,
        languagesSpoken: doctors.languagesSpoken,
        supportedModes: doctors.supportedModes,
        consultationFee: doctors.consultationFee,
        bio: doctors.bio,
      })
      .from(doctors)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Filter by language in JS (array contains — simpler than pg array operator for now)
    const filtered = language
      ? rows.filter((d) => d.languagesSpoken.includes(language))
      : rows;

    return { data: filtered, page, limit };
  });

  res.json(data);
});

// ─── GET /doctors/me ──────────────────────────────────────────────────────────

router.get("/me", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;

  const result = await getDb()
    .select({
      id: doctors.id,
      fullName: doctors.fullName,
      speciality: doctors.speciality,
      facilityName: doctors.facilityName,
      languagesSpoken: doctors.languagesSpoken,
      supportedModes: doctors.supportedModes,
      consultationFee: doctors.consultationFee,
      verificationStatus: doctors.verificationStatus,
      bio: doctors.bio,
      contactNumber: doctors.contactNumber,
      registrationNumber: doctors.registrationNumber,
      educationBackground: doctors.educationBackground,
      experienceYears: doctors.experienceYears,
      isPartTime: doctors.isPartTime,
    })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundError("Doctor profile");
  }

  res.json(result[0]);
});

// ─── GET /doctors/:id ─────────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  const result = await withCache(`doctors:profile:${id}`, 300, async () => {
    return getDb()
      .select({
        id: doctors.id,
        fullName: doctors.fullName,
        speciality: doctors.speciality,
        facilityName: doctors.facilityName,
        languagesSpoken: doctors.languagesSpoken,
        supportedModes: doctors.supportedModes,
        consultationFee: doctors.consultationFee,
        verificationStatus: doctors.verificationStatus,
        bio: doctors.bio,
      })
      .from(doctors)
      .where(and(eq(doctors.id, id), eq(doctors.verificationStatus, "verified")))
      .limit(1);
  });

  if (result.length === 0) {
    throw new NotFoundError("Doctor");
  }

  res.json(result[0]);
});

// ─── POST /doctors/me/profile ─────────────────────────────────────────────────

router.post(
  "/me/profile",
  authenticate,
  requireRole("doctor"),
  validateBody(createDoctorProfileSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;
    const body = _req.body as {
      fullName: string;
      speciality: string;
      registrationNumber: string;
      educationBackground: string;
      experienceYears: number;
      isPartTime: boolean;
      facilityName?: string;
      languagesSpoken: string[];
      supportedModes: ("video" | "audio" | "async_chat" | "offline")[];
      consultationFee: number;
      bio?: string;
    };

    // Find the doctor record for the authenticated user
    const doctorRows = await getDb()
      .select({ id: doctors.id, verificationStatus: doctors.verificationStatus })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.userId))
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (doctorRows.length === 0) {
      throw new NotFoundError("Doctor profile");
    }

    const doctor = doctorRows[0]!;

    // Once verified/suspended, profile updates go through coordinator review
    if (["verified", "suspended"].includes(doctor.verificationStatus)) {
      throw new ForbiddenError(
        "Profile is locked after verification. Contact a coordinator to request changes."
      );
    }

    const [updated] = await getDb().transaction(async (tx) => {
      const [doc] = await tx
        .update(doctors)
        .set({
          fullName: body.fullName,
          speciality: body.speciality,
          registrationNumber: body.registrationNumber,
          educationBackground: body.educationBackground,
          experienceYears: body.experienceYears,
          isPartTime: body.isPartTime,
          facilityName: body.facilityName,
          languagesSpoken: body.languagesSpoken,
          supportedModes: body.supportedModes,
          consultationFee: body.consultationFee,
          bio: body.bio,
          // Transition to pending_verification on profile submission
          verificationStatus: "pending_verification",
          updatedAt: new Date(),
        })
        .where(eq(doctors.id, doctor.id))
        .returning({ id: doctors.id, verificationStatus: doctors.verificationStatus });

      // Create the initial verification record
      const { doctorVerifications } = await import("../db/schema");
      await tx.insert(doctorVerifications).values({
        doctorId: doctor.id,
        status: "pending_verification",
        submittedDocumentsMeta: { note: "Uploaded via Onboarding Portal" },
      });

      return [doc];
    });

    logger.info({ doctorId: doctor.id }, "Doctor application submitted for verification");

    await invalidateCachePrefix("doctors:");

    res.status(200).json({
      message: "Profile submitted. Awaiting coordinator verification.",
      doctor: updated,
    });
  }
);

// ─── POST /doctors/me/availability ────────────────────────────────────────────

router.post(
  "/me/availability",
  authenticate,
  requireRole("doctor"),
  validateBody(createAvailabilitySlotSchema),
  async (_req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;
    const body = _req.body as {
      startsAt: string;
      endsAt: string;
      supportedModes: ("video" | "audio" | "async_chat" | "offline")[];
    };

    const doctorRows = await getDb()
      .select({ id: doctors.id, verificationStatus: doctors.verificationStatus })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.userId))
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (doctorRows.length === 0) throw new NotFoundError("Doctor profile");

    const doctor = doctorRows[0]!;

    if (doctor.verificationStatus !== "verified") {
      throw new ForbiddenError(
        "Only verified doctors can publish availability slots."
      );
    }

    const [slot] = await getDb()
      .insert(availabilitySlots)
      .values({
        doctorId: doctor.id,
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        supportedModes: body.supportedModes,
      })
      .returning();

    logger.info({ doctorId: doctor.id, slotId: slot?.id }, "Availability slot created");

    res.status(201).json(slot);
  }
);

// ─── GET /doctors/:id/availability ───────────────────────────────────────────

router.get("/:id/availability", async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  // Only show future available slots to patients
  const now = new Date();

  const slots = await getDb()
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
      supportedModes: availabilitySlots.supportedModes,
      status: availabilitySlots.status,
    })
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.doctorId, id),
        eq(availabilitySlots.status, "available"),
        gte(availabilitySlots.startsAt, now)
      )
    )
    .orderBy(availabilitySlots.startsAt);

  res.json({ data: slots });
// ─── GET /doctors/:id/earnings ────────────────────────────────────────────────

router.get("/:id/earnings", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { uid } = res.locals.user;
  
  // Verify doctor id matches logged in user's doctor profile
  const db = getDb();
  
  // To avoid circular dependency on schema loading, we just check the id against their auth
  let authUserId = uid;
  if (process.env.TEST_BYPASS_AUTH !== "true") {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!u) throw new ForbiddenError("User not found in db");
    authUserId = u.id;
  }
  
  const [doc] = await db.select().from(doctors).where(eq(doctors.userId, authUserId)).limit(1);
  if (!doc || doc.id !== id) {
    throw new ForbiddenError("You can only view your own earnings");
  }

  // Calculate earnings (simplified: sum of successful appointment payments)
  // Need to import paymentRecords, appointments
  const { paymentRecords, appointments } = await import("../db/schema");
  
  const earningsData = await db
    .select({
      amount: paymentRecords.amount,
      updatedAt: paymentRecords.updatedAt
    })
    .from(paymentRecords)
    .innerJoin(appointments, eq(paymentRecords.appointmentId, appointments.id))
    .where(
      and(
        eq(appointments.doctorId, id),
        eq(paymentRecords.state, "success")
      )
    )
    .orderBy(paymentRecords.updatedAt);
    
  // Calculate total and this month
  const total = earningsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarnings = earningsData
    .filter(e => new Date(e.updatedAt) >= firstDayOfMonth)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
  // Monthly distribution for chart
  const monthlyData: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    monthlyData[monthStr] = 0;
  }
  
  earningsData.forEach(e => {
    const d = new Date(e.updatedAt);
    const monthStr = d.toLocaleString('default', { month: 'short' });
    if (monthlyData[monthStr] !== undefined) {
      monthlyData[monthStr] += (e.amount || 0);
    }
  });

  res.json({ 
    totalEarnings: total,
    thisMonthEarnings: thisMonthEarnings,
    recentTransactions: earningsData.slice(-10).reverse(), // last 10
    monthlyData: Object.entries(monthlyData).map(([name, amount]) => ({ name, amount }))
  });
});

export default router;
