/**
 * MedLink — Auth routes
 *
 * POST /auth/register   — create a new user account from a Firebase token
 * GET  /auth/me         — return the authenticated user's profile
 *
 * Design notes:
 * - The client (Flutter app / React dashboard) authenticates with Firebase
 *   directly. After getting a Firebase ID token, it calls this API to
 *   persist the user record in our PostgreSQL database with the correct role.
 * - Firebase UID is stored as the external identity anchor; we never store
 *   the raw Firebase token.
 * - Idempotent: calling /auth/register twice with the same Firebase UID
 *   returns the existing user rather than creating a duplicate.
 */

import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users, patients, doctors } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { registerSchema } from "../schemas/auth.schema";
import { getFirebaseAdmin } from "../firebase";
import { logger } from "../logger";
import { ConflictError, NotFoundError } from "../errors";

const router = Router();

// ─── POST /auth/register ──────────────────────────────────────────────────────

router.post(
  "/register",
  validateBody(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { idToken, role, displayName } = req.body as {
      idToken: string;
      role: "patient" | "doctor";
      displayName?: string;
    };

    // Verify the token independently (this route is not behind authenticate
    // middleware because the user doesn't have a session yet)
    const admin = getFirebaseAdmin();
    // In local dev without a valid service account, checkRevoked will fail.
    const decoded = await admin.auth().verifyIdToken(idToken);

    const firebaseUid = decoded.uid;
    const email = decoded.email ?? "";
    const name = displayName ?? decoded.name ?? "";

    // Idempotency: return existing user if already registered
    const existing = await getDb()
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (existing.length > 0) {
      const existingUser = existing[0]!;
      if (existingUser.role !== role) {
        throw new ConflictError(
          `Account already registered with role '${existingUser.role}'`
        );
      }
      res.status(200).json({
        message: "Account already exists",
        user: {
          id: existingUser.id,
          role: existingUser.role,
          email: existingUser.email,
        },
      });
      return;
    }

    // Create user + role-specific profile in a transaction
    await getDb().transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          firebaseUid,
          role,
          email,
          displayName: name,
        })
        .returning();

      if (!newUser) throw new Error("User insert returned no rows");

      if (role === "patient") {
        await tx.insert(patients).values({ userId: newUser.id });
      } else if (role === "doctor") {
        // Doctor profile is intentionally sparse at registration.
        // Full profile + verification are completed in a separate step.
        await tx.insert(doctors).values({
          userId: newUser.id,
          fullName: name,
          contactNumber: req.body.contactNumber, // optional
        });
      }

      logger.info(
        { userId: newUser.id, role },
        "New user registered"
      );

      res.status(201).json({
        message: "Account created",
        user: {
          id: newUser.id,
          role: newUser.role,
          email: newUser.email,
        },
      });
    });
  }
);

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get(
  "/me",
  authenticate,
  async (_req: Request, res: Response): Promise<void> => {
    const { uid } = res.locals.user;

    const result = await getDb()
      .select()
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError("User");
    }

    const user = result[0]!;

    res.json({
      id: user.id,
      role: user.role,
      email: user.email,
      displayName: user.displayName,
      profileStatus: user.profileStatus,
      createdAt: user.createdAt,
    });
  }
);

export default router;
