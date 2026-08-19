import { z } from "zod";

export const updatePatientProfileSchema = z.object({
  fullName: z.string().max(200).optional(),
  preferredLanguage: z.string().max(20).optional(),
  gender: z.string().max(50).optional().nullable(),
  dateOfBirth: z.string().max(50).optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  height: z.union([z.number(), z.string()]).optional().nullable(),
  weight: z.union([z.number(), z.string()]).optional().nullable(),
  allergies: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  chronicConditions: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  currentMedications: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  pastSurgeries: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  smokingStatus: z.string().max(50).optional().nullable(),
  alcoholStatus: z.string().max(50).optional().nullable(),
  dietPreference: z.string().max(100).optional().nullable(),
  abhaId: z.string().max(100).optional().nullable(),
  insurancePolicyNumber: z.string().max(100).optional().nullable(),
  locationDistrict: z.string().max(100).optional().nullable(),
});

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>;
