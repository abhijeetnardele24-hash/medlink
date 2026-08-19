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
import Razorpay from "razorpay";
import { eq, and, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { doctors, availabilitySlots, users, paymentRecords, payoutRecords, doctorPayoutMethods, appointments, doctorVerifications, messages, encounters, patients } from "../db/schema";
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

// ─── GET /doctors/me/messages/unread ──────────────────────────────────────────

router.get("/me/messages/unread", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;
  const db = getDb();

  const doctorRows = await db
    .select({ id: doctors.id, userId: doctors.userId })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (doctorRows.length === 0) {
    throw new NotFoundError("Doctor profile");
  }

  const doctor = doctorRows[0]!;

  const unreadMessages = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      patientName: users.displayName,
      encounterId: encounters.id,
    })
    .from(messages)
    .innerJoin(encounters, eq(messages.encounterId, encounters.id))
    .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(users, eq(patients.userId, users.id))
    .where(
      and(
        eq(appointments.doctorId, doctor.id),
        gte(messages.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        sql`${messages.senderId} != ${doctor.userId}`
      )
    )
    .orderBy(messages.createdAt);

  res.json({ data: unreadMessages });
});

// ─── PATCH /doctors/me ────────────────────────────────────────────────────────

router.patch("/me", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;
  const db = getDb();

  const doctorRows = await db
    .select({ id: doctors.id, userId: doctors.userId })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (doctorRows.length === 0) {
    throw new NotFoundError("Doctor profile");
  }

  const doctor = doctorRows[0]!;
  const {
    fullName,
    speciality,
    contactNumber,
    facilityName,
    languagesSpoken,
    supportedModes,
    consultationFee,
    bio,
    registrationNumber,
    educationBackground,
    experienceYears,
    isPartTime,
  } = req.body;

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (fullName !== undefined) updateData.fullName = fullName;
  if (speciality !== undefined) updateData.speciality = speciality;
  if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
  if (facilityName !== undefined) updateData.facilityName = facilityName;
  if (languagesSpoken !== undefined) updateData.languagesSpoken = languagesSpoken;
  if (supportedModes !== undefined) updateData.supportedModes = supportedModes;
  if (consultationFee !== undefined) updateData.consultationFee = Number(consultationFee);
  if (bio !== undefined) updateData.bio = bio;
  if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
  if (educationBackground !== undefined) updateData.educationBackground = educationBackground;
  if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);
  if (isPartTime !== undefined) updateData.isPartTime = Boolean(isPartTime);

  const [updated] = await db
    .update(doctors)
    .set(updateData)
    .where(eq(doctors.id, doctor.id))
    .returning();

  if (fullName || contactNumber) {
    const userUpdate: Record<string, any> = { updatedAt: new Date() };
    if (fullName) userUpdate.displayName = fullName;
    if (contactNumber) userUpdate.contactNumber = contactNumber;
    await db.update(users).set(userUpdate).where(eq(users.id, doctor.userId));
  }

  await invalidateCachePrefix("doctors:");
  res.json({ message: "Profile updated successfully", data: updated });
});

router.put("/me", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;
  const db = getDb();

  const doctorRows = await db
    .select({ id: doctors.id, userId: doctors.userId })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (doctorRows.length === 0) {
    throw new NotFoundError("Doctor profile");
  }

  const doctor = doctorRows[0]!;
  const {
    fullName,
    speciality,
    contactNumber,
    facilityName,
    languagesSpoken,
    supportedModes,
    consultationFee,
    bio,
    registrationNumber,
    educationBackground,
    experienceYears,
    isPartTime,
  } = req.body;

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (fullName !== undefined) updateData.fullName = fullName;
  if (speciality !== undefined) updateData.speciality = speciality;
  if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
  if (facilityName !== undefined) updateData.facilityName = facilityName;
  if (languagesSpoken !== undefined) updateData.languagesSpoken = languagesSpoken;
  if (supportedModes !== undefined) updateData.supportedModes = supportedModes;
  if (consultationFee !== undefined) updateData.consultationFee = Number(consultationFee);
  if (bio !== undefined) updateData.bio = bio;
  if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
  if (educationBackground !== undefined) updateData.educationBackground = educationBackground;
  if (experienceYears !== undefined) updateData.experienceYears = Number(experienceYears);
  if (isPartTime !== undefined) updateData.isPartTime = Boolean(isPartTime);

  const [updated] = await db
    .update(doctors)
    .set(updateData)
    .where(eq(doctors.id, doctor.id))
    .returning();

  if (fullName || contactNumber) {
    const userUpdate: Record<string, any> = { updatedAt: new Date() };
    if (fullName) userUpdate.displayName = fullName;
    if (contactNumber) userUpdate.contactNumber = contactNumber;
    await db.update(users).set(userUpdate).where(eq(users.id, doctor.userId));
  }

  await invalidateCachePrefix("doctors:");
  res.json({ message: "Profile updated successfully", data: updated });
});

// ─── GET /doctors/open-slots ──────────────────────────────────────────────────

router.get("/open-slots", async (req: Request, res: Response): Promise<void> => {
  const db = getDb();
  const now = new Date();

  const slots = await db
    .select({
      id: availabilitySlots.id,
      startsAt: availabilitySlots.startsAt,
      endsAt: availabilitySlots.endsAt,
      supportedModes: availabilitySlots.supportedModes,
      status: availabilitySlots.status,
      doctorId: doctors.id,
      doctorName: doctors.fullName,
      doctorSpeciality: doctors.speciality,
      consultationFee: doctors.consultationFee,
      facilityName: doctors.facilityName,
    })
    .from(availabilitySlots)
    .innerJoin(doctors, eq(doctors.id, availabilitySlots.doctorId))
    .where(
      and(
        eq(availabilitySlots.status, "available"),
        eq(doctors.verificationStatus, "verified"),
        gte(availabilitySlots.startsAt, now)
      )
    )
    .orderBy(availabilitySlots.startsAt)
    .limit(30);

  res.json({ data: slots });
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

// ─── GET /doctors/me/availability ────────────────────────────────────────────

router.get(
  "/me/availability",
  authenticate,
  requireRole("doctor"),
  async (_req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;
    const db = getDb();

    const doctorRows = await db
      .select({ id: doctors.id })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.userId))
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (doctorRows.length === 0) throw new NotFoundError("Doctor profile");

    const slots = await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.doctorId, doctorRows[0]!.id))
      .orderBy(availabilitySlots.startsAt);

    res.json({ data: slots });
  }
);

// ─── DELETE /doctors/me/availability/:slotId ──────────────────────────────────

router.delete(
  "/me/availability/:slotId",
  authenticate,
  requireRole("doctor"),
  async (req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;
    const slotId = req.params.slotId as string;
    const db = getDb();

    const doctorRows = await db
      .select({ id: doctors.id })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.userId))
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (doctorRows.length === 0) throw new NotFoundError("Doctor profile");

    await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.doctorId, doctorRows[0]!.id)
        )
      );

    res.json({ message: "Availability slot deleted" });
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
});

// ─── GET /doctors/:id/earnings ────────────────────────────────────────────────

router.get("/:id/earnings", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { uid } = res.locals.user;
  
  const db = getDb();
  let authUserId = uid;
  if (process.env.TEST_BYPASS_AUTH !== "true") {
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!u) throw new ForbiddenError("User not found in db");
    authUserId = u.id;
  }
  
  const [doc] = await db.select().from(doctors).where(eq(doctors.userId, authUserId)).limit(1);
  if (!doc || doc.id !== id) throw new ForbiddenError("You can only view your own earnings");


  
  const earningsData = await db
    .select({ amount: paymentRecords.amount, updatedAt: paymentRecords.updatedAt })
    .from(paymentRecords)
    .innerJoin(appointments, eq(paymentRecords.appointmentId, appointments.id))
    .where(and(eq(appointments.doctorId, id), eq(paymentRecords.state, "success")))
    .orderBy(paymentRecords.updatedAt);
    
  const payoutsData = await db
    .select({ amount: payoutRecords.amount, status: payoutRecords.status })
    .from(payoutRecords)
    .where(and(eq(payoutRecords.doctorId, id), eq(payoutRecords.status, "processed")));

  const totalEarnings = earningsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPayouts = payoutsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const availableBalance = Math.max(0, totalEarnings - totalPayouts);
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarnings = earningsData
    .filter(e => new Date(e.updatedAt) >= firstDayOfMonth)
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
  const monthlyData: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyData[d.toLocaleString('default', { month: 'short' })] = 0;
  }

  earningsData.forEach(e => {
    const monthStr = new Date(e.updatedAt).toLocaleString('default', { month: 'short' });
    if (monthlyData[monthStr] !== undefined) monthlyData[monthStr] += (e.amount || 0);
  });

  const recentPayouts = await db.select().from(payoutRecords).where(eq(payoutRecords.doctorId, id)).orderBy(payoutRecords.updatedAt).limit(10);

  const finalTransactions = earningsData.map((e, idx) => ({
    id: `settle_${idx + 1}`,
    amount: e.amount,
    date: e.updatedAt,
    patientName: "Patient Consultation",
    type: "Consultation Settlement",
    status: "settled"
  }));

  res.json({ 
    totalEarnings,
    availableBalance,
    thisMonthEarnings,
    pendingClearance: 0,
    recentTransactions: finalTransactions.slice(0, 10).reverse(),
    recentPayouts: recentPayouts.reverse(),
    monthlyData: Object.entries(monthlyData).map(([name, amount]) => ({ name, amount }))
  });
});

// ─── GET /doctors/:id/payout-methods ──────────────────────────────────────────

router.get("/:id/payout-methods", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const db = getDb();
  
  
  const methods = await db.select().from(doctorPayoutMethods).where(eq(doctorPayoutMethods.doctorId, id));
  res.json({ data: methods });
});

// ─── POST /doctors/:id/payout-methods ─────────────────────────────────────────

router.post("/:id/payout-methods", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const db = getDb();
  
  
  const { type, accountNumber, ifscCode, upiId, name } = req.body;
  
  // Create a Razorpay Contact and Fund Account
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "demo_secret"
  });

  let fundAccountId = "fake_fund_acc_" + Date.now();
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "rzp_test_demo") {
    try {
      const contact = await (razorpay as any).contacts.create({
        name: name || "Doctor " + id.substring(0, 5),
        type: "employee",
        reference_id: id
      });
      
      const fundAccountPayload: any = {
        contact_id: contact.id,
        account_type: type === "bank_account" ? "bank_account" : "vpa"
      };
      
      if (type === "bank_account") {
        fundAccountPayload.bank_account = { name: name || "Doctor", ifsc: ifscCode, account_number: accountNumber };
      } else if (type === "upi") {
        fundAccountPayload.vpa = { address: upiId };
      }
      
      const fundAccount = await razorpay.fundAccount.create(fundAccountPayload);
      fundAccountId = fundAccount.id;
    } catch (err: any) {
      logger.error({ err }, "Razorpay Fund Account creation failed");
      res.status(400).json({ error: "Failed to verify account with payment gateway", details: err.message });
      return;
    }
  }

  const [method] = await db.insert(doctorPayoutMethods).values({
    doctorId: id,
    type,
    accountNumber,
    ifscCode,
    upiId,
    razorpayFundAccountId: fundAccountId,
    isDefault: true
  }).returning();
  
  res.status(201).json({ message: "Payout method linked successfully", data: method });
});

// ─── POST /doctors/:id/withdraw ───────────────────────────────────────────────

router.post("/:id/withdraw", authenticate, requireRole("doctor"), async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const db = getDb();
  const { amount, payoutMethodId } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "Invalid withdrawal amount" });
    return;
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Lock doctor row to serialize concurrent withdrawal attempts
      const lockedDoctor = await tx.execute(
        sql`SELECT id FROM ${doctors} WHERE id = ${id} FOR UPDATE`
      );
      if (!lockedDoctor.rows || lockedDoctor.rows.length === 0) {
        throw new NotFoundError("Doctor");
      }

      // 2. Fetch all successful earnings inside the transaction
      const earningsData = await tx
        .select({ amount: paymentRecords.amount })
        .from(paymentRecords)
        .innerJoin(appointments, eq(paymentRecords.appointmentId, appointments.id))
        .where(and(eq(appointments.doctorId, id), eq(paymentRecords.state, "success")));

      // 3. Fetch all active/processed payouts inside the transaction
      const payoutsData = await tx
        .select({ amount: payoutRecords.amount })
        .from(payoutRecords)
        .where(
          and(
            eq(payoutRecords.doctorId, id),
            sql`${payoutRecords.status} IN ('processed', 'processing')`
          )
        );

      const totalEarnings = earningsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalPayouts = payoutsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const availableBalance = Math.max(0, totalEarnings - totalPayouts);

      if (amount > availableBalance) {
        throw new ConflictError("Insufficient available balance");
      }

      const [method] = await tx
        .select()
        .from(doctorPayoutMethods)
        .where(eq(doctorPayoutMethods.id, payoutMethodId))
        .limit(1);
      if (!method) throw new NotFoundError("Payout method");

      // 4. Create Razorpay Payout (Transfer)
      let payoutId = "fake_payout_" + Date.now();
      let status: "processed" | "processing" | "rejected" = "processed";
      let failureReason: string | null = null;

      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "rzp_test_demo" && process.env.NODE_ENV === "production") {
        try {
          const authHeader = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
          const rzpRes = await fetch("https://api.razorpay.com/v1/payouts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${authHeader}`
            },
            body: JSON.stringify({
              account_number: "2323230040715367",
              fund_account_id: method.razorpayFundAccountId as string,
              amount: amount * 100,
              currency: "INR",
              mode: method.type === "upi" ? "UPI" : "IMPS",
              purpose: "payout",
              reference_id: "wd_" + Date.now()
            })
          });
          const payout = await rzpRes.json();
          if (!rzpRes.ok) {
            throw new Error(payout.error?.description || "Gateway payout rejected");
          }
          payoutId = payout.id;
          status = payout.status === "processed" ? "processed" : (payout.status === "rejected" ? "rejected" : "processing");
        } catch (err: any) {
          logger.error({ err }, "Razorpay Payout failed");
          status = "rejected";
          failureReason = err.message;
        }
      }

      const [record] = await tx
        .insert(payoutRecords)
        .values({
          doctorId: id,
          payoutMethodId,
          amount,
          status,
          razorpayPayoutId: payoutId,
          failureReason,
        })
        .returning();

      if (status === "rejected") {
        throw new ConflictError(`Payout failed at gateway: ${failureReason}`);
      }

      return record;
    });

    res.status(200).json({ message: "Withdrawal initiated successfully", data: result });
  } catch (err: any) {
    if (err.name === "ConflictError" || err.message?.includes("Insufficient") || err.message?.includes("balance")) {
      res.status(400).json({ error: err.message || "Insufficient available balance" });
      return;
    }
    if (err.name === "NotFoundError") {
      res.status(404).json({ error: err.message });
      return;
    }
    logger.error({ err }, "Withdrawal transaction failed");
    res.status(500).json({ error: err.message || "Internal server error during withdrawal" });
  }
});

export default router;
