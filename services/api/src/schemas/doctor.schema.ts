/**
 * MedLink — Doctor request schemas (Zod)
 */

import { z } from "zod";

const consultationModeSchema = z.enum(["video", "audio", "async_chat", "offline"]);

/** POST /doctors/me/profile (doctor completes profile after registration) */
export const createDoctorProfileSchema = z.object({
  fullName: z.string().min(1).max(120),
  speciality: z.string().min(1).max(120),
  registrationNumber: z.string().min(1).max(50),
  educationBackground: z.string().min(1, "Education background is required"),
  experienceYears: z.number().min(0),
  isPartTime: z.boolean(),
  facilityName: z.string().optional(),
  languagesSpoken: z.array(z.string()).default([]),
  supportedModes: z.array(z.enum(["video", "audio", "async_chat", "offline"])).default([]),
  bio: z.string().max(1000).optional(),
});

export type CreateDoctorProfileInput = z.infer<typeof createDoctorProfileSchema>;

/** POST /doctors/me/availability */
export const createAvailabilitySlotSchema = z.object({
  startsAt: z.string().datetime({ message: "startsAt must be an ISO 8601 datetime" }),
  endsAt: z.string().datetime({ message: "endsAt must be an ISO 8601 datetime" }),
  supportedModes: z.array(consultationModeSchema).min(1).default(["video", "audio"]),
}).refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  { message: "endsAt must be after startsAt", path: ["endsAt"] }
);

export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;

/** Query params for GET /doctors */
export const listDoctorsQuerySchema = z.object({
  speciality: z.string().optional(),
  language: z.string().optional(),
  mode: consultationModeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListDoctorsQuery = z.infer<typeof listDoctorsQuerySchema>;
