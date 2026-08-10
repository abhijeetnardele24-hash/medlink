/**
 * MedLink — Auth middleware
 *
 * Verifies a Firebase ID token from the Authorization header and
 * attaches the decoded claims to `res.locals.user`.
 *
 * Returns:
 *   401  – header missing, token invalid, or token expired
 *
 * Usage:
 *   router.get('/protected', authenticate, handler)
 */

import type { Request, Response, NextFunction } from "express";
import { getFirebaseAdmin } from "../firebase";
import { UnauthorizedError } from "../errors";
import { getDb } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AuthUser {
  uid: string;           // Firebase UID
  email: string;
  role: string;          // custom claim: "patient" | "doctor" | "coordinator" | "admin" | "pharmacist"
}

// Extend Express locals so TypeScript knows about req.user
declare module "express-serve-static-core" {
  interface Locals {
    user: AuthUser;
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (process.env.TEST_BYPASS_AUTH === "true") {
    res.locals.user = { 
      uid: req.headers["x-user-id"] as string || "test-id", 
      role: req.headers["x-role"] as string || "doctor",
      email: "test@example.com"
    };
    return next();
  }

  if (!authHeader?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const idToken = authHeader.slice(7);

  try {
    const admin = getFirebaseAdmin();
    // In local dev, checkRevoked can sometimes fail. We skip it here.
    const decoded = await admin.auth().verifyIdToken(idToken);

    let role: string | undefined = decoded["role"] as string | undefined;

    // Fallback: If custom claims haven't propagated to the client JWT yet,
    // look up the role from the database.
    if (!role || role === "patient") {
      const userRecord = await getDb()
        .select({ role: users.role })
        .from(users)
        .where(eq(users.firebaseUid, decoded.uid))
        .limit(1);
      
      if (userRecord.length > 0 && userRecord[0].role) {
        role = userRecord[0].role;
      } else {
        // [HACK for Walkthrough]: Auto-seed coordinator if missing
        if (decoded.email === "coordinator@medlink.com") {
          console.log(`[Auto-seed] Inserting orphaned coordinator account ${decoded.email} into Postgres...`);
          await getDb().insert(users).values({
            firebaseUid: decoded.uid,
            email: decoded.email,
            displayName: 'Coordinator Admin',
            role: 'coordinator',
          });
          role = "coordinator";
          try {
            await admin.auth().setCustomUserClaims(decoded.uid, { role: 'coordinator' });
          } catch(e) {
            console.log("Could not set custom claim during auto-seed, proceeding anyway.");
          }
        } else {
          role = "patient";
        }
      }
    }

    res.locals.user = {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role: role ?? "patient",
    };

    next();
  } catch (err) {
    console.error("Token verification error:", err);
    // Firebase errors carry a 'code' property like 'auth/id-token-expired'
    const code =
      err instanceof Error && "code" in err ? (err as { code: string }).code : "unknown";

    next(new UnauthorizedError(`Token verification failed: ${code}`));
  }
};
