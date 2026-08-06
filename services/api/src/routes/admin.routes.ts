import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { doctorVerifications, doctors } from "../db/schema";
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

export default router;
