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

export interface AuthUser {
  uid: string;           // Firebase UID
  email: string;
  role: string;          // custom claim: "patient" | "doctor" | "coordinator" | "admin"
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

  if (!authHeader?.startsWith("Bearer ")) {
    next(new UnauthorizedError("Missing or malformed Authorization header"));
    return;
  }

  const idToken = authHeader.slice(7);

  try {
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken, true); // checkRevoked = true

    const role = (decoded["role"] as string | undefined) ?? "patient";

    res.locals.user = {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role,
    };

    next();
  } catch (err) {
    // Firebase errors carry a 'code' property like 'auth/id-token-expired'
    const code =
      err instanceof Error && "code" in err ? (err as { code: string }).code : "unknown";

    next(new UnauthorizedError(`Token verification failed: ${code}`));
  }
};
