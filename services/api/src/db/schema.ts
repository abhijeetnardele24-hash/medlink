/**
 * MedLink — Drizzle ORM Schema
 *
 * Defines every entity from the system design. All tables use UUID primary
 * keys, have NOT NULL constraints, foreign keys, and enum-based status fields
 * for safe state-machine transitions.
 *
 * Entities follow FHIR-inspired naming for future interoperability:
 *   Patient, Practitioner (Doctor), Appointment, Encounter, MedicationRequest
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// ENUMS — state machines enforced at the DB level
// ─────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "doctor",
  "coordinator",
  "admin",
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "active",
  "suspended",
  "deleted",
]);

export const doctorVerificationStatusEnum = pgEnum(
  "doctor_verification_status",
  [
    "draft",
    "pending_verification",
    "needs_correction",
    "verified",
    "rejected",
    "suspended",
  ]
);

export const slotStatusEnum = pgEnum("slot_status", [
  "available",
  "booked",
  "cancelled",
  "completed",
]);

export const consultationModeEnum = pgEnum("consultation_mode", [
  "video",
  "audio",
  "async_chat",
  "offline",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "draft",
  "queued_offline",
  "requested",
  "pending_doctor",
  "confirmed",
  "in_progress",
  "completed",
  "rescheduled",
  "rejected",
  "cancelled",
  "missed",
  "follow_up_needed",
]);

export const encounterStatusEnum = pgEnum("encounter_status", [
  "waiting",
  "active",
  "ended",
  "abandoned",
]);

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "draft",
  "issued",
  "amended",
  "revoked",
]);

export const paymentStateEnum = pgEnum("payment_state", [
  "free_demo",
  "pending",
  "success",
  "failed",
  "refunded",
]);

export const reminderTaskTypeEnum = pgEnum("reminder_task_type", [
  "pre_appointment_patient",
  "pre_appointment_doctor",
  "no_show_follow_up",
  "booking_confirmation",
  "cancellation_notice",
]);

export const reminderOutcomeEnum = pgEnum("reminder_outcome", [
  "pending",
  "attempted",
  "reached",
  "confirmed",
  "rescheduled",
  "no_response",
]);

export const syncOperationTypeEnum = pgEnum("sync_operation_type", [
  "create",
  "update",
  "delete",
]);

export const syncOperationStatusEnum = pgEnum("sync_operation_status", [
  "pending",
  "sent",
  "acknowledged",
  "failed",
  "conflict",
]);

export const consentStatusEnum = pgEnum("consent_status", [
  "active",
  "revoked",
  "expired",
]);

// ─────────────────────────────────────────────────────────────
// USERS — identity layer (Firebase UID is the external key)
// ─────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firebaseUid: text("firebase_uid").notNull(),
    role: userRoleEnum("role").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    profileStatus: profileStatusEnum("profile_status")
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_firebase_uid_idx").on(t.firebaseUid),
    uniqueIndex("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
  ]
);

// ─────────────────────────────────────────────────────────────
// PATIENTS
// ─────────────────────────────────────────────────────────────

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Demographic — kept minimal per privacy-by-design principle
    preferredLanguage: text("preferred_language").notNull().default("en"),
    ageGroup: text("age_group"), // e.g. "adult", "child", "senior" — not exact DOB
    genderSelfDescribed: text("gender_self_described"),
    locationDistrict: text("location_district"),
    consentTeleconsultation: boolean("consent_teleconsultation")
      .notNull()
      .default(false),
    consentGrantedAt: timestamp("consent_granted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("patients_user_id_idx").on(t.userId),
  ]
);

// ─────────────────────────────────────────────────────────────
// DOCTORS
// ─────────────────────────────────────────────────────────────

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    contactNumber: text("contact_number"),
    speciality: text("speciality"),
    registrationNumber: text("registration_number"), // professional licence
    educationBackground: text("education_background"),
    experienceYears: integer("experience_years"),
    isPartTime: boolean("is_part_time"),
    facilityName: text("facility_name"),
    languagesSpoken: text("languages_spoken").array().notNull().default([]),
    supportedModes: text("supported_modes")
      .array()
      .notNull()
      .default(["video", "audio", "async_chat"]),
    consultationFee: integer("consultation_fee").notNull().default(500),
    verificationStatus: doctorVerificationStatusEnum("verification_status")
      .notNull()
      .default("draft"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("doctors_user_id_idx").on(t.userId),
    index("doctors_speciality_idx").on(t.speciality),
    index("doctors_verification_status_idx").on(t.verificationStatus),
  ]
);

// ─────────────────────────────────────────────────────────────
// DOCTOR VERIFICATIONS
// ─────────────────────────────────────────────────────────────

export const doctorVerifications = pgTable(
  "doctor_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    status: doctorVerificationStatusEnum("status")
      .notNull()
      .default("pending_verification"),
    submittedDocumentsMeta: jsonb("submitted_documents_meta"), // metadata only, not the file
    reviewerId: uuid("reviewer_id").references(() => users.id),
    reasonCode: text("reason_code"),
    reviewerComment: text("reviewer_comment"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("doctor_verifications_doctor_id_idx").on(t.doctorId),
    index("doctor_verifications_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────
// AVAILABILITY SLOTS
// ─────────────────────────────────────────────────────────────

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    supportedModes: text("supported_modes")
      .array()
      .notNull()
      .default(["video", "audio"]),
    status: slotStatusEnum("status").notNull().default("available"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("availability_slots_doctor_id_idx").on(t.doctorId),
    index("availability_slots_starts_at_idx").on(t.startsAt),
    index("availability_slots_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id),
    slotId: uuid("slot_id").references(() => availabilitySlots.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("requested"),
    concernCategory: text("concern_category").notNull(), // non-diagnostic: e.g. "skin", "general"
    preferredMode: consultationModeEnum("preferred_mode"),
    patientNotes: text("patient_notes"), // kept minimal — no diagnosis text
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("appointments_patient_id_idx").on(t.patientId),
    index("appointments_doctor_id_idx").on(t.doctorId),
    index("appointments_status_idx").on(t.status),
    index("appointments_scheduled_at_idx").on(t.scheduledAt),
  ]
);

// ─────────────────────────────────────────────────────────────
// PAYMENT RECORDS (demo state only — no real card/UPI data)
// ─────────────────────────────────────────────────────────────

export const paymentRecords = pgTable(
  "payment_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull().default(0), // Snapshot of the fee at booking time (in INR)
    state: paymentStateEnum("state").notNull().default("free_demo"),
    demoReference: text("demo_reference"), // synthetic reference only
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("payment_records_appointment_id_idx").on(t.appointmentId),
  ]
);

// ─────────────────────────────────────────────────────────────
// REMINDER TASKS
// ─────────────────────────────────────────────────────────────

export const reminderTasks = pgTable(
  "reminder_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    assignedCoordinatorId: uuid("assigned_coordinator_id").references(
      () => users.id
    ),
    taskType: reminderTaskTypeEnum("task_type").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    outcome: reminderOutcomeEnum("outcome").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    coordinatorNote: text("coordinator_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reminder_tasks_appointment_id_idx").on(t.appointmentId),
    index("reminder_tasks_due_at_idx").on(t.dueAt),
    index("reminder_tasks_outcome_idx").on(t.outcome),
  ]
);

// ─────────────────────────────────────────────────────────────
// ENCOUNTERS (= a single consultation session)
// ─────────────────────────────────────────────────────────────

export const encounters = pgTable(
  "encounters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id),
    currentMode: consultationModeEnum("current_mode").notNull().default("video"),
    status: encounterStatusEnum("status").notNull().default("waiting"),
    networkEventSummary: jsonb("network_event_summary"), // mode-switch history, not PHI
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("encounters_appointment_id_idx").on(t.appointmentId),
    index("encounters_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body"),
    attachmentId: uuid("attachment_id"), // FK wired after attachments table
    isSystemEvent: boolean("is_system_event").notNull().default(false), // mode-switch notices
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_encounter_id_idx").on(t.encounterId),
    index("messages_sender_id_idx").on(t.senderId),
    index("messages_created_at_idx").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────────────────────
// PRESCRIPTIONS (immutable after issue; corrections = new record)
// ─────────────────────────────────────────────────────────────

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    encounterId: uuid("encounter_id")
      .notNull()
      .references(() => encounters.id),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id),
    medicinesJson: jsonb("medicines_json").notNull(), // structured list, not free-text
    instructionsText: text("instructions_text"),
    status: prescriptionStatusEnum("status").notNull().default("draft"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    supersedesId: uuid("supersedes_id"), // self-FK for amendment chain
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prescriptions_encounter_id_idx").on(t.encounterId),
    index("prescriptions_doctor_id_idx").on(t.doctorId),
    index("prescriptions_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────
// ATTACHMENTS (metadata only; binary in object storage)
// ─────────────────────────────────────────────────────────────

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    encounterId: uuid("encounter_id").references(() => encounters.id),
    storageKey: text("storage_key").notNull(), // object-store path, never exposed directly
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    checksum: text("checksum").notNull(),
    scanStatus: text("scan_status").notNull().default("pending"), // pending|clean|flagged
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attachments_owner_id_idx").on(t.ownerId),
    index("attachments_encounter_id_idx").on(t.encounterId),
  ]
);

// ─────────────────────────────────────────────────────────────
// CONSENT GRANTS
// ─────────────────────────────────────────────────────────────

export const consentGrants = pgTable(
  "consent_grants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    granteeId: uuid("grantee_id").references(() => users.id), // doctor, coordinator
    purpose: text("purpose").notNull(), // e.g. "consultation", "record_share"
    scope: text("scope").notNull(), // e.g. "appointment_history", "prescriptions"
    status: consentStatusEnum("status").notNull().default("active"),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    index("consent_grants_patient_id_idx").on(t.patientId),
    index("consent_grants_grantee_id_idx").on(t.granteeId),
    index("consent_grants_status_idx").on(t.status),
  ]
);

// ─────────────────────────────────────────────────────────────
// SYNC OPERATIONS — idempotency + offline outbox tracking
// ─────────────────────────────────────────────────────────────

export const syncOperations = pgTable(
  "sync_operations",
  {
    operationId: uuid("operation_id").primaryKey(), // client-generated UUID (idempotency key)
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id),
    entityType: text("entity_type").notNull(), // "appointment", "message", etc.
    entityId: uuid("entity_id").notNull(),
    operationType: syncOperationTypeEnum("operation_type").notNull(),
    payload: jsonb("payload").notNull(),
    baseVersion: integer("base_version"),
    status: syncOperationStatusEnum("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    lastErrorCode: text("last_error_code"),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  },
  (t) => [
    index("sync_operations_actor_id_idx").on(t.actorId),
    index("sync_operations_entity_type_id_idx").on(t.entityType, t.entityId),
    index("sync_operations_status_idx").on(t.status),
    index("sync_operations_received_at_idx").on(t.receivedAt),
  ]
);

// ─────────────────────────────────────────────────────────────
// AUDIT EVENTS — immutable security/operational trail
// Deliberately stores only what is needed; NO clinical content.
// ─────────────────────────────────────────────────────────────

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id), // null = unauthenticated attempt
    actorRole: userRoleEnum("actor_role"),
    action: text("action").notNull(), // e.g. "appointment.create", "user.login"
    resourceType: text("resource_type"), // "appointment", "patient", etc.
    resourceId: uuid("resource_id"),
    outcome: text("outcome").notNull(), // "success" | "failure" | "conflict"
    metadata: jsonb("metadata"), // non-PHI context (IP range, error code)
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_events_actor_id_idx").on(t.actorId),
    index("audit_events_action_idx").on(t.action),
    index("audit_events_resource_idx").on(t.resourceType, t.resourceId),
    index("audit_events_occurred_at_idx").on(t.occurredAt),
  ]
);

// ─────────────────────────────────────────────────────────────
// RECOMMENDATION EVENTS — AI matching log (no PHI)
// ─────────────────────────────────────────────────────────────

export const recommendationEvents = pgTable(
  "recommendation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").references(() => patients.id), // optional (anonymous requests)
    selectedCategory: text("selected_category").notNull(),
    preferredLanguage: text("preferred_language"),
    preferredMode: consultationModeEnum("preferred_mode"),
    suggestedSpeciality: text("suggested_speciality").notNull(),
    rankedDoctorIds: uuid("ranked_doctor_ids").array().notNull().default([]),
    explanationVersion: text("explanation_version").notNull(), // formula version used
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("recommendation_events_patient_id_idx").on(t.patientId),
    index("recommendation_events_created_at_idx").on(t.createdAt),
  ]
);

// ─────────────────────────────────────────────────────────────
// PHARMACY ORDERS
// ─────────────────────────────────────────────────────────────

export const pharmacyOrderStatusEnum = pgEnum("pharmacy_order_status", [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const pharmacyOrders = pgTable(
  "pharmacy_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescriptions.id),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id),
    totalAmount: integer("total_amount").notNull(), // Amount in INR
    status: pharmacyOrderStatusEnum("status").notNull().default("pending_payment"),
    deliveryAddress: text("delivery_address").notNull(),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("pharmacy_orders_patient_id_idx").on(t.patientId),
    index("pharmacy_orders_prescription_id_idx").on(t.prescriptionId),
  ]
);
