/**
 * MedLink — Auth request schemas (Zod)
 *
 * Validates incoming request bodies for /auth routes.
 */

import { z } from "zod";

/** POST /auth/register */
export const registerSchema = z.object({
  /** Firebase ID token obtained from the client SDK */
  idToken: z.string().min(1, "Firebase ID token is required"),
  /** Role the user is registering as */
  role: z.enum(["patient", "doctor", "coordinator"]),
  /** Optional display name (falls back to Firebase displayName) */
  displayName: z.string().optional(),
  /** Optional contact number */
  contactNumber: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
