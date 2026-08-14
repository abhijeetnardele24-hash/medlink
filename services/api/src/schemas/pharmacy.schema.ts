import { z } from "zod";

export const verifyPharmacistSchema = z.object({
  drugLicenseNumber: z.string().min(1, "Drug license number is required"),
  drugLicenseDocumentUrl: z.string().url().optional().nullable(),
  pharmacyCouncilRegistrationNumber: z.string().min(1, "Pharmacy council registration number is required"),
  licenseIssuingState: z.string().optional().nullable(),
  licenseExpiryDate: z.string().optional().nullable(),
});

export const uploadPrescriptionSchema = z.object({
  pharmacistId: z.string().uuid().optional(),
  attachmentUrl: z.string().url("Valid attachment URL is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
});

export const buildOrderSchema = z.object({
  items: z.array(
    z.object({
      medicineId: z.string().uuid("Invalid medicine ID"),
      quantity: z.number().int().positive("Quantity must be a positive integer")
    })
  ).min(1, "At least one item is required")
});

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      medicineId: z.string().uuid("Invalid medicine ID"),
      quantity: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]).transform(v => Number(v))
    })
  ).min(1, "Order must have items"),
  prescriptionId: z.string().uuid().optional(),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  pharmacistId: z.string().uuid().optional()
});

export const fileComplaintSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  issueDescription: z.string().min(1, "Issue description is required")
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required")
});
