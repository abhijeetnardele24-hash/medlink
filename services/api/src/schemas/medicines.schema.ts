import { z } from "zod";

export const addMedicineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  genericName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  composition: z.string().optional().nullable(),
  dosageForm: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  price: z.union([z.string().regex(/^\d+(\.\d+)?$/), z.number().positive()]).transform(v => Number(v)),
  stockQuantity: z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).optional().transform(v => v !== undefined ? Number(v) : 0),
  prescriptionTier: z.enum(["otc", "schedule_h", "restricted"]).optional().default("otc"),
  category: z.string().optional().nullable()
});
