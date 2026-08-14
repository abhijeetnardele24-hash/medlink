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
import { doctors, availabilitySlots, users, paymentRecords, payoutRecords, doctorPayoutMethods } from "../db/schema";
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
  const availableBalance = totalEarnings - totalPayouts;
  
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

  const recentPayouts = await db.select().from(payoutRecords).where(eq(payoutRecords.doctorId, id)).orderBy(payoutRecords.updatedAt).limit(5);

  res.json({ 
    totalEarnings,
    availableBalance,
    thisMonthEarnings,
    recentTransactions: earningsData.slice(-10).reverse(),
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
      const contact = await razorpay.contacts.create({
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
  const { payoutRecords, paymentRecords, appointments, doctorPayoutMethods } = await import("../db/schema");
  const { amount, payoutMethodId } = req.body;
  
  // Validate Balance
  const earningsData = await db.select({ amount: paymentRecords.amount }).from(paymentRecords)
    .innerJoin(appointments, eq(paymentRecords.appointmentId, appointments.id))
    .where(and(eq(appointments.doctorId, id), eq(paymentRecords.state, "success")));
    
  const payoutsData = await db.select({ amount: payoutRecords.amount }).from(payoutRecords)
    .where(and(eq(payoutRecords.doctorId, id), eq(payoutRecords.status, "processed")));

  const totalEarnings = earningsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPayouts = payoutsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const availableBalance = totalEarnings - totalPayouts;
  
  if (amount > availableBalance) {
    res.status(400).json({ error: "Insufficient available balance" });
    return;
  }
  
  const [method] = await db.select().from(doctorPayoutMethods).where(eq(doctorPayoutMethods.id, payoutMethodId)).limit(1);
  if (!method) throw new NotFoundError("Payout method");

  // Create Razorpay Payout (Transfer)
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_demo",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "demo_secret"
  });
  
  let payoutId = "fake_payout_" + Date.now();
  let status: "processed" | "processing" | "rejected" = "processed"; // test mode auto-processes
  let failureReason = null;
  
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "rzp_test_demo") {
    try {
      const payout = await razorpay.payouts.create({
        account_number: "2323230040715367", // Platform's RazorpayX account (example from docs)
        fund_account_id: method.razorpayFundAccountId as string,
        amount: amount * 100, // in paise
        currency: "INR",
        mode: method.type === "upi" ? "UPI" : "IMPS",
        purpose: "payout",
        reference_id: "wd_" + Date.now()
      });
      payoutId = payout.id;
      status = payout.status === "processed" ? "processed" : (payout.status === "rejected" ? "rejected" : "processing");
    } catch (err: any) {
      logger.error({ err }, "Razorpay Payout failed");
      status = "rejected";
      failureReason = err.message;
    }
  }

  const [record] = await db.insert(payoutRecords).values({
    doctorId: id,
    payoutMethodId,
    amount,
    status,
    razorpayPayoutId: payoutId,
    failureReason
  }).returning();
  
  if (status === "rejected") {
    res.status(400).json({ error: "Payout failed at gateway", details: failureReason, record });
    return;
  }
  
  res.status(200).json({ message: "Withdrawal initiated successfully", data: record });
});

export default router;
