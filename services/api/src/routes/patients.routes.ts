import { Router, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { users, patients, doctors, appointments, consentGrants } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { validateBody } from "../middleware/validateBody";
import { updatePatientProfileSchema } from "../schemas/patient.schema";
import { NotFoundError, ForbiddenError } from "../errors";
import { logger } from "../logger";

const router = Router();

// Require auth for all patient endpoints
router.use(authenticate);

function parseArrayField(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof val === "string" && val.trim().length > 0) {
    return val.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseNumberField(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num);
}

// ─── GET /v1/patients/me ─────────────────────────────────────────────────────────────
router.get("/me", async (_req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;

  const userResult = await getDb()
    .select()
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (userResult.length === 0) {
    throw new NotFoundError("User");
  }

  const user = userResult[0];

  let patientResult = await getDb()
    .select()
    .from(patients)
    .where(eq(patients.userId, user.id))
    .limit(1);

  // Auto-initialize patient record if not present
  if (patientResult.length === 0) {
    const [newPatient] = await getDb()
      .insert(patients)
      .values({
        userId: user.id,
        preferredLanguage: "en",
      })
      .returning();
    patientResult = [newPatient];
  }

  const patient = patientResult[0];

  res.json({
    data: {
      ...patient,
      fullName: user.displayName || "",
      email: user.email,
    },
  });
});

// ─── PUT /v1/patients/me ─────────────────────────────────────────────────────────────
router.put("/me", validateBody(updatePatientProfileSchema), async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;
  const body = req.body || {};

  const userResult = await getDb()
    .select()
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (userResult.length === 0) {
    throw new NotFoundError("User");
  }

  const user = userResult[0];

  let patientResult = await getDb()
    .select()
    .from(patients)
    .where(eq(patients.userId, user.id))
    .limit(1);

  let patientId: string;
  if (patientResult.length === 0) {
    const [newPatient] = await getDb()
      .insert(patients)
      .values({
        userId: user.id,
        preferredLanguage: body.preferredLanguage || "en",
      })
      .returning();
    patientId = newPatient.id;
  } else {
    patientId = patientResult[0].id;
  }

  // Update user full name if provided
  if (body.fullName && body.fullName.trim() !== user.displayName) {
    await getDb()
      .update(users)
      .set({ displayName: body.fullName.trim(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  const updatedFields = {
    gender: body.gender ? String(body.gender).trim() : null,
    dateOfBirth: body.dateOfBirth ? String(body.dateOfBirth).trim() : null,
    bloodGroup: body.bloodGroup ? String(body.bloodGroup).trim() : null,
    height: parseNumberField(body.height),
    weight: parseNumberField(body.weight),
    allergies: parseArrayField(body.allergies),
    chronicConditions: parseArrayField(body.chronicConditions),
    currentMedications: parseArrayField(body.currentMedications),
    pastSurgeries: parseArrayField(body.pastSurgeries),
    emergencyContactName: body.emergencyContactName ? String(body.emergencyContactName).trim() : null,
    emergencyContactPhone: body.emergencyContactPhone ? String(body.emergencyContactPhone).trim() : null,
    address: body.address ? String(body.address).trim() : null,
    smokingStatus: body.smokingStatus ? String(body.smokingStatus).trim() : null,
    alcoholStatus: body.alcoholStatus ? String(body.alcoholStatus).trim() : null,
    dietPreference: body.dietPreference ? String(body.dietPreference).trim() : null,
    abhaId: body.abhaId ? String(body.abhaId).trim() : null,
    insurancePolicyNumber: body.insurancePolicyNumber ? String(body.insurancePolicyNumber).trim() : null,
    locationDistrict: body.locationDistrict ? String(body.locationDistrict).trim() : null,
    updatedAt: new Date(),
  };

  const [updatedPatient] = await getDb()
    .update(patients)
    .set(updatedFields)
    .where(eq(patients.id, patientId))
    .returning();

  logger.info({ patientId, userId: user.id }, "Patient profile updated successfully in Neon DB");

  res.json({
    message: "Patient profile updated successfully",
    data: {
      ...updatedPatient,
      fullName: body.fullName || user.displayName || "",
      email: user.email,
    },
  });
});

// ─── GET /v1/patients/:id ────────────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { uid, role } = res.locals.user;
  const targetId = req.params.id as string;

  let authUserId = uid;
  const [u] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);
  if (u) {
    authUserId = u.id;
  } else if (process.env.NODE_ENV === "production" || process.env.TEST_BYPASS_AUTH !== "true") {
    throw new ForbiddenError("User not found in db");
  }

  // Look up target patient record
  const patientResult = await getDb()
    .select({
      id: patients.id,
      userId: patients.userId,
      gender: patients.gender,
      dateOfBirth: patients.dateOfBirth,
      bloodGroup: patients.bloodGroup,
      height: patients.height,
      weight: patients.weight,
      allergies: patients.allergies,
      chronicConditions: patients.chronicConditions,
      currentMedications: patients.currentMedications,
      pastSurgeries: patients.pastSurgeries,
      emergencyContactName: patients.emergencyContactName,
      emergencyContactPhone: patients.emergencyContactPhone,
      address: patients.address,
      smokingStatus: patients.smokingStatus,
      alcoholStatus: patients.alcoholStatus,
      dietPreference: patients.dietPreference,
      abhaId: patients.abhaId,
      insurancePolicyNumber: patients.insurancePolicyNumber,
      locationDistrict: patients.locationDistrict,
      updatedAt: patients.updatedAt,
      fullName: users.displayName,
      email: users.email,
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId))
    .where(eq(patients.id, targetId))
    .limit(1);

  if (patientResult.length === 0) {
    throw new NotFoundError("Patient");
  }

  const patientDoc = patientResult[0];

  // 1. If requester is a patient, they can only view their own dossier
  if (role === "patient") {
    if (patientDoc.userId !== authUserId) {
      throw new ForbiddenError("You are not authorized to view another patient's medical dossier");
    }
  } else if (role === "doctor") {
    // 2. If requester is a doctor, verify active appointment relationship OR active consent grant
    const [doctor] = await getDb()
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.userId, authUserId))
      .limit(1);

    if (!doctor) {
      throw new ForbiddenError("Doctor profile not found");
    }

    // Check if doctor has an appointment with this patient
    const apptRows = await getDb()
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          eq(appointments.patientId, targetId)
        )
      )
      .limit(1);

    const hasAppointment = apptRows.length > 0;

    // Check active consent grant
    const [grant] = await getDb()
      .select({ id: consentGrants.id })
      .from(consentGrants)
      .where(
        and(
          eq(consentGrants.patientId, targetId),
          eq(consentGrants.granteeId, authUserId),
          eq(consentGrants.status, "active")
        )
      )
      .limit(1);

    const hasActiveConsent = !!grant;

    if (!hasAppointment && !hasActiveConsent) {
      throw new ForbiddenError(
        "You do not have an active appointment relationship or consent grant to access this patient's medical dossier"
      );
    }
  } else if (role !== "coordinator" && role !== "admin") {
    throw new ForbiddenError("Only clinical staff or authorized caretakers can access patient dossiers");
  }

  res.json({
    data: patientDoc,
  });
});

export default router;
