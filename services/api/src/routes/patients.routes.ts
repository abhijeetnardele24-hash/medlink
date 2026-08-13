import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, patients } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { NotFoundError } from "../errors";

const router = Router();

// Require auth for all patient endpoints
router.use(authenticate);

// ─── GET /v1/patients/me ─────────────────────────────────────────────────────────────
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;

  const userResult = await getDb()
    .select()
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (userResult.length === 0) {
    throw new NotFoundError("User");
  }

  const patientResult = await getDb()
    .select()
    .from(patients)
    .where(eq(patients.userId, userResult[0].id))
    .limit(1);

  if (patientResult.length === 0) {
    throw new NotFoundError("Patient profile");
  }

  res.json({
    data: patientResult[0],
  });
});

// ─── PUT /v1/patients/me ─────────────────────────────────────────────────────────────
router.put("/me", async (req: Request, res: Response): Promise<void> => {
  const { uid } = res.locals.user;
  const { bloodGroup, height, weight, allergies, chronicConditions, gender, dateOfBirth } = req.body;

  const userResult = await getDb()
    .select()
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  if (userResult.length === 0) {
    throw new NotFoundError("User");
  }

  const patientResult = await getDb()
    .select()
    .from(patients)
    .where(eq(patients.userId, userResult[0].id))
    .limit(1);

  if (patientResult.length === 0) {
    throw new NotFoundError("Patient profile");
  }

  const [updatedPatient] = await getDb()
    .update(patients)
    .set({
      bloodGroup,
      height,
      weight,
      allergies,
      chronicConditions,
      gender,
      dateOfBirth,
      updatedAt: new Date(),
    })
    .where(eq(patients.id, patientResult[0].id))
    .returning();

  res.json({
    message: "Patient profile updated successfully",
    data: updatedPatient,
  });
});

export default router;
