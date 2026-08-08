import { Router, type Request, type Response, type NextFunction } from "express";
import { eq, and, or } from "drizzle-orm";
import { getDb } from "../db";
import { consentGrants, users } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { ForbiddenError, NotFoundError } from "../errors";
import { z } from "zod";

const router = Router();

const grantConsentSchema = z.object({
  granteeId: z.string().uuid(),
  purpose: z.string().min(1),
  scope: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

// GET /consents - List active consents for the authenticated user
router.get("/", authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    
    // Resolve internal user ID
    const firebaseUid = res.locals.user.uid;
    let userId = firebaseUid;
    let internalRole = res.locals.user.role;
    
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      userId = u.id;
      internalRole = u.role;
    }

    let consents;
    if (internalRole === "patient") {
      consents = await db.select().from(consentGrants).where(eq(consentGrants.patientId, userId));
    } else {
      // Doctor or coordinator
      consents = await db.select().from(consentGrants).where(eq(consentGrants.granteeId, userId));
    }
    
    res.json({ data: consents });
  } catch (error) {
    next(error);
  }
});

// POST /consents - Patient grants a scope to a doctor
router.post("/", authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const firebaseUid = res.locals.user.uid;
    let userId = firebaseUid;
    let internalRole = res.locals.user.role;
    
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      userId = u.id;
      internalRole = u.role;
    }

    if (internalRole !== "patient") {
      throw new ForbiddenError("Only patients can grant consent");
    }

    const validated = grantConsentSchema.parse(req.body);

    const [newGrant] = await db
      .insert(consentGrants)
      .values({
        patientId: userId,
        granteeId: validated.granteeId,
        purpose: validated.purpose,
        scope: validated.scope,
        status: "active",
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
      })
      .returning();

    res.status(201).json({ data: newGrant });
  } catch (error) {
    next(error);
  }
});

// POST /consents/:id/revoke - Patient revokes an existing grant
router.post("/:id/revoke", authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const db = getDb();
    const grantId = req.params.id as string;
    
    const firebaseUid = res.locals.user.uid;
    let userId = firebaseUid;
    let internalRole = res.locals.user.role;
    
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      userId = u.id;
      internalRole = u.role;
    }

    if (internalRole !== "patient") {
      throw new ForbiddenError("Only patients can revoke consent");
    }

    const [grant] = await db
      .select()
      .from(consentGrants)
      .where(and(eq(consentGrants.id, grantId), eq(consentGrants.patientId, userId)))
      .limit(1);

    if (!grant) {
      throw new NotFoundError("Consent grant not found or not owned by user");
    }

    const [updatedGrant] = await db
      .update(consentGrants)
      .set({
        status: "revoked",
        revokedAt: new Date(),
      })
      .where(eq(consentGrants.id, grantId))
      .returning();

    res.json({ data: updatedGrant });
  } catch (error) {
    next(error);
  }
});

export default router;
