import { z } from "zod";

export const reviewDoctorVerificationSchema = z.object({
  status: z.enum(["draft", "pending_verification", "needs_correction", "verified", "rejected", "suspended"]),
  reasonCode: z.string().max(200).optional(),
});

export type ReviewDoctorVerificationInput = z.infer<typeof reviewDoctorVerificationSchema>;

export const reviewPharmacistVerificationSchema = z.object({
  status: z.enum(["draft", "pending_verification", "needs_correction", "verified", "rejected", "suspended"]),
  reasonCode: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type ReviewPharmacistVerificationInput = z.infer<typeof reviewPharmacistVerificationSchema>;
