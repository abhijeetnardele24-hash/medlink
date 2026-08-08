CREATE TYPE "public"."appointment_status" AS ENUM('draft', 'queued_offline', 'requested', 'pending_doctor', 'confirmed', 'in_progress', 'completed', 'rescheduled', 'rejected', 'cancelled', 'missed', 'follow_up_needed');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."consultation_mode" AS ENUM('video', 'audio', 'async_chat', 'offline');--> statement-breakpoint
CREATE TYPE "public"."doctor_verification_status" AS ENUM('draft', 'pending_verification', 'needs_correction', 'verified', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."encounter_status" AS ENUM('waiting', 'active', 'ended', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."payment_state" AS ENUM('free_demo', 'pending', 'success', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."pharmacy_order_status" AS ENUM('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('draft', 'issued', 'amended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."reminder_outcome" AS ENUM('pending', 'attempted', 'reached', 'confirmed', 'rescheduled', 'no_response');--> statement-breakpoint
CREATE TYPE "public"."reminder_task_type" AS ENUM('pre_appointment_patient', 'pre_appointment_doctor', 'no_show_follow_up', 'booking_confirmation', 'cancellation_notice');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('available', 'booked', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."sync_operation_status" AS ENUM('pending', 'sent', 'acknowledged', 'failed', 'conflict');--> statement-breakpoint
CREATE TYPE "public"."sync_operation_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'doctor', 'coordinator', 'admin');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"slot_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'requested' NOT NULL,
	"concern_category" text NOT NULL,
	"preferred_mode" "consultation_mode",
	"patient_notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"encounter_id" uuid,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"checksum" text NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_role" "user_role",
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" uuid,
	"outcome" text NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"supported_modes" text[] DEFAULT '{"video","audio"}' NOT NULL,
	"status" "slot_status" DEFAULT 'available' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"grantee_id" uuid,
	"purpose" text NOT NULL,
	"scope" text NOT NULL,
	"status" "consent_status" DEFAULT 'active' NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "doctor_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"status" "doctor_verification_status" DEFAULT 'pending_verification' NOT NULL,
	"submitted_documents_meta" jsonb,
	"reviewer_id" uuid,
	"reason_code" text,
	"reviewer_comment" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"contact_number" text,
	"speciality" text,
	"registration_number" text,
	"education_background" text,
	"experience_years" integer,
	"is_part_time" boolean,
	"facility_name" text,
	"languages_spoken" text[] DEFAULT '{}' NOT NULL,
	"supported_modes" text[] DEFAULT '{"video","audio","async_chat"}' NOT NULL,
	"consultation_fee" integer DEFAULT 500 NOT NULL,
	"verification_status" "doctor_verification_status" DEFAULT 'draft' NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"current_mode" "consultation_mode" DEFAULT 'video' NOT NULL,
	"status" "encounter_status" DEFAULT 'waiting' NOT NULL,
	"network_event_summary" jsonb,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"generic_name" text,
	"price" integer NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"requires_prescription" boolean DEFAULT false NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text,
	"attachment_id" uuid,
	"is_system_event" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"age_group" text,
	"gender_self_described" text,
	"location_district" text,
	"consent_teleconsultation" boolean DEFAULT false NOT NULL,
	"consent_granted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"state" "payment_state" DEFAULT 'free_demo' NOT NULL,
	"demo_reference" text,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid,
	"patient_id" uuid NOT NULL,
	"total_amount" integer NOT NULL,
	"status" "pharmacy_order_status" DEFAULT 'pending_payment' NOT NULL,
	"delivery_address" text NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_reconciliation_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"prescription_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"matched" boolean NOT NULL,
	"reason" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"encounter_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"medicines_json" jsonb NOT NULL,
	"instructions_text" text,
	"status" "prescription_status" DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"supersedes_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid,
	"selected_category" text NOT NULL,
	"preferred_language" text,
	"preferred_mode" "consultation_mode",
	"suggested_speciality" text NOT NULL,
	"ranked_doctor_ids" uuid[] DEFAULT '{}' NOT NULL,
	"explanation_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"assigned_coordinator_id" uuid,
	"task_type" "reminder_task_type" NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"outcome" "reminder_outcome" DEFAULT 'pending' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"coordinator_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_operations" (
	"operation_id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"operation_type" "sync_operation_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"base_version" integer,
	"status" "sync_operation_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledged_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"profile_status" "profile_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_availability_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."availability_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_grantee_id_users_id_fk" FOREIGN KEY ("grantee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_verifications" ADD CONSTRAINT "doctor_verifications_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_verifications" ADD CONSTRAINT "doctor_verifications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_order_id_pharmacy_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pharmacy_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_orders" ADD CONSTRAINT "pharmacy_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_encounter_id_encounters_id_fk" FOREIGN KEY ("encounter_id") REFERENCES "public"."encounters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_tasks" ADD CONSTRAINT "reminder_tasks_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_tasks" ADD CONSTRAINT "reminder_tasks_assigned_coordinator_id_users_id_fk" FOREIGN KEY ("assigned_coordinator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_patient_id_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_doctor_id_idx" ON "appointments" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "attachments_owner_id_idx" ON "attachments" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "attachments_encounter_id_idx" ON "attachments" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_events_resource_idx" ON "audit_events" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "availability_slots_doctor_id_idx" ON "availability_slots" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "availability_slots_starts_at_idx" ON "availability_slots" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "availability_slots_status_idx" ON "availability_slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consent_grants_patient_id_idx" ON "consent_grants" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "consent_grants_grantee_id_idx" ON "consent_grants" USING btree ("grantee_id");--> statement-breakpoint
CREATE INDEX "consent_grants_status_idx" ON "consent_grants" USING btree ("status");--> statement-breakpoint
CREATE INDEX "doctor_verifications_doctor_id_idx" ON "doctor_verifications" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "doctor_verifications_status_idx" ON "doctor_verifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_user_id_idx" ON "doctors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "doctors_speciality_idx" ON "doctors" USING btree ("speciality");--> statement-breakpoint
CREATE INDEX "doctors_verification_status_idx" ON "doctors" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "encounters_appointment_id_idx" ON "encounters" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "encounters_status_idx" ON "encounters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "messages_encounter_id_idx" ON "messages" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "messages_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_user_id_idx" ON "patients" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_records_appointment_id_idx" ON "payment_records" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "pharmacy_orders_patient_id_idx" ON "pharmacy_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "pharmacy_orders_prescription_id_idx" ON "pharmacy_orders" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "prescriptions_encounter_id_idx" ON "prescriptions" USING btree ("encounter_id");--> statement-breakpoint
CREATE INDEX "prescriptions_doctor_id_idx" ON "prescriptions" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "prescriptions_status_idx" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recommendation_events_patient_id_idx" ON "recommendation_events" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "recommendation_events_created_at_idx" ON "recommendation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reminder_tasks_appointment_id_idx" ON "reminder_tasks" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "reminder_tasks_due_at_idx" ON "reminder_tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "reminder_tasks_outcome_idx" ON "reminder_tasks" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "sync_operations_actor_id_idx" ON "sync_operations" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "sync_operations_entity_type_id_idx" ON "sync_operations" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "sync_operations_status_idx" ON "sync_operations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_operations_received_at_idx" ON "sync_operations" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_firebase_uid_idx" ON "users" USING btree ("firebase_uid");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");