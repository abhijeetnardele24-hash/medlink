CREATE TYPE "public"."medicine_listing_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."pharmacist_verification_status" AS ENUM('draft', 'pending_verification', 'needs_correction', 'verified', 'rejected', 'suspended');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'pharmacist' BEFORE 'coordinator';--> statement-breakpoint
CREATE TABLE "doctor_medicine_recommendations" (
	"doctor_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacist_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pharmacist_id" uuid NOT NULL,
	"status" "pharmacist_verification_status" DEFAULT 'pending_verification' NOT NULL,
	"submitted_documents_meta" jsonb,
	"reviewer_id" uuid,
	"reason_code" text,
	"reviewer_comment" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"contact_number" text,
	"shop_name" text NOT NULL,
	"registered_address" text NOT NULL,
	"license_number" text,
	"verification_status" "pharmacist_verification_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medicines" ADD COLUMN "pharmacist_id" uuid;--> statement-breakpoint
ALTER TABLE "medicines" ADD COLUMN "listing_status" "medicine_listing_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_medicine_recommendations" ADD CONSTRAINT "doctor_medicine_recommendations_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_medicine_recommendations" ADD CONSTRAINT "doctor_medicine_recommendations_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacist_verifications" ADD CONSTRAINT "pharmacist_verifications_pharmacist_id_pharmacists_id_fk" FOREIGN KEY ("pharmacist_id") REFERENCES "public"."pharmacists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacist_verifications" ADD CONSTRAINT "pharmacist_verifications_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacists" ADD CONSTRAINT "pharmacists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doc_med_recommendation_idx" ON "doctor_medicine_recommendations" USING btree ("doctor_id","medicine_id");--> statement-breakpoint
CREATE INDEX "pharmacist_verifications_pharmacist_id_idx" ON "pharmacist_verifications" USING btree ("pharmacist_id");--> statement-breakpoint
CREATE INDEX "pharmacist_verifications_status_idx" ON "pharmacist_verifications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "pharmacists_user_id_idx" ON "pharmacists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pharmacists_verification_status_idx" ON "pharmacists" USING btree ("verification_status");--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_pharmacist_id_pharmacists_id_fk" FOREIGN KEY ("pharmacist_id") REFERENCES "public"."pharmacists"("id") ON DELETE cascade ON UPDATE no action;