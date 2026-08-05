/**
 * MedLink — Auth request schemas (Zod)
 *
 * Validates incoming request bodies for /auth routes.
 */

import { z } from "zod";

/** POST /auth/register */
export const registerSchema = z.object({
  /** Firebase ID token obtained from the client SDK */
  idToken: z.string().min(1, "idToken is required"),
  /** Role the user is registering as */
  role: z.enum(["patient", "doctor"], {
    errorMap: () => ({ message: "role must be 'patient' or 'doctor'" }),
  }),
  /** Optional display name (falls back to Firebase displayName) */
  displayName: z.string().min(1).max(120).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
