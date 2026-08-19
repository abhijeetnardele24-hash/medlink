import { z } from "zod";

export const createEncounterSchema = z.object({
  appointmentId: z.string().uuid("appointmentId must be a valid UUID"),
});

export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;

export const prescriptionMedicineItemSchema = z.object({
  medicineId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().max(100).optional(),
  durationDays: z.number().int().positive().optional(),
  recommend: z.boolean().optional(),
});

export const createPrescriptionSchema = z.object({
  medicinesJson: z.array(prescriptionMedicineItemSchema).min(1, "At least one medicine is required"),
  instructionsText: z.string().max(2000).optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

export const endEncounterSchema = z.object({
  summaryNotes: z.string().max(3000).optional(),
});

export type EndEncounterInput = z.infer<typeof endEncounterSchema>;
