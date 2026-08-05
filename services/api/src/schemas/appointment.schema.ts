/**
 * MedLink — Appointment request schemas (Zod)
 */

import { z } from "zod";

const consultationModeSchema = z.enum(["video", "audio", "async_chat", "offline"]);

/** POST /appointments — patient creates an appointment request */
export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid("doctorId must be a valid UUID"),
  slotId: z.string().uuid("slotId must be a valid UUID").optional(),
  scheduledAt: z.string().datetime({ message: "scheduledAt must be ISO 8601" }),
  concernCategory: z.string().min(1).max(80),
  preferredMode: consultationModeSchema.optional(),
  patientNotes: z.string().max(500).optional(), // strictly limited; no diagnoses
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/** PATCH /appointments/:id — doctor accepts/rejects/reschedules */
export const patchAppointmentSchema = z
  .object({
    action: z.enum([
      "confirm",
      "reject",
      "reschedule",
      "cancel",
      "mark_in_progress",
      "mark_completed",
      "mark_missed",
    ]),
    scheduledAt: z
      .string()
      .datetime({ message: "scheduledAt must be ISO 8601" })
      .optional(),
    rejectionReason: z.string().max(300).optional(),
    /** Optimistic-lock version — must match server version */
    version: z.number().int().positive(),
  })
  .refine(
    (data) =>
      data.action !== "reschedule" || data.scheduledAt !== undefined,
    {
      message: "scheduledAt is required when action is 'reschedule'",
      path: ["scheduledAt"],
    }
  );

export type PatchAppointmentInput = z.infer<typeof patchAppointmentSchema>;

/** Query params for GET /appointments */
export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum([
      "draft",
      "queued_offline",
      "requested",
      "pending_doctor",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "missed",
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
