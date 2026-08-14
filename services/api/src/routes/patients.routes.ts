import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, patients } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
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
router.put("/me", async (req: Request, res: Response): Promise<void> => {
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
  const { role } = res.locals.user;
  const targetId = req.params.id as string;

  // Doctors, coordinators, and admins can look up patient details
  if (role !== "doctor" && role !== "coordinator" && role !== "admin") {
    throw new ForbiddenError("Only clinical staff can access patient dossiers");
  }

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

  res.json({
    data: patientResult[0],
  });
});

export default router;
