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
import { users, patients, doctors, pharmacists } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { registerSchema } from "../schemas/auth.schema";
import { getFirebaseAdmin } from "../firebase";
import { logger } from "../logger";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { sendEmail } from "../utils/resend";

const router = Router();

// ─── POST /auth/register ──────────────────────────────────────────────────────

router.post(
  "/register",
  validateBody(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { idToken, role, displayName, contactNumber, shopName, registeredAddress } = req.body as {
      idToken: string;
      role: "patient" | "doctor" | "pharmacist";
      displayName?: string;
      contactNumber?: string;
      shopName?: string;
      registeredAddress?: string;
    };

    // Verify the token independently (this route is not behind authenticate
    // middleware because the user doesn't have a session yet)
    const admin = getFirebaseAdmin();
    // In local dev without a valid service account, checkRevoked will fail.
    const decoded = await admin.auth().verifyIdToken(idToken);

    const firebaseUid = decoded.uid;
    const email = decoded.email ?? "";
    const name = displayName ?? decoded.name ?? "";

    // Idempotency: return existing user if already registered by firebaseUid
    const existingByUid = await getDb()
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    if (existingByUid.length > 0) {
      const existingUser = existingByUid[0]!;
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

    // Link seeded account if email matches
    if (email && email.trim().length > 0) {
      const existingByEmail = await getDb()
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
        
      if (existingByEmail.length > 0) {
        const existingUser = existingByEmail[0]!;
        if (existingUser.role !== role) {
          throw new ConflictError(
            `Email already registered with role '${existingUser.role}'`
          );
        }
        
        // In production, require verified email before account linking
        if (process.env.NODE_ENV === "production" && !decoded.email_verified) {
          throw new ForbiddenError("Email must be verified before linking this account");
        }
        
        // Update the seeded user with the real Firebase UID
        await getDb().update(users).set({ firebaseUid, updatedAt: new Date() }).where(eq(users.id, existingUser.id));
        
        res.status(200).json({
          message: "Seeded account linked successfully",
          user: {
            id: existingUser.id,
            role: existingUser.role,
            email: existingUser.email,
          },
        });
        return;
      }
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
          contactNumber, // optional
        });
      } else if (role === "pharmacist") {
        if (!shopName || !registeredAddress) {
          throw new ConflictError("shopName and registeredAddress are required for pharmacists");
        }
        await tx.insert(pharmacists).values({
          userId: newUser.id,
          fullName: name,
          contactNumber,
          shopName,
          registeredAddress,
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

      // Send welcome email asynchronously if email is provided
      if (email && email.trim().length > 0) {
        const subject = "Welcome to MedLink!";
        let html = `<h1>Welcome to MedLink!</h1><p>Hi ${name || 'there'},</p><p>Your account has been successfully created.</p>`;
        
        if (role === 'doctor') {
          html += `<p>Please complete your profile and submit your verification documents in the portal.</p>`;
        } else if (role === 'pharmacist') {
          html += `<p>Please submit your pharmacy license and store details to start selling.</p>`;
        } else {
          html += `<p>You can now book appointments and order medicines directly from your dashboard.</p>`;
        }
        
        html += `<br/><p>Best regards,<br/>The MedLink Team</p>`;

        sendEmail(email, subject, html).catch((err) => {
          logger.error({ err, userId: newUser.id }, "Failed to send welcome email");
        });
      }
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
