import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually to avoid dependency issues
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    console.log("Applying safe schema updates...");

    // 1. Update doctors table
    await pool.query(`
      ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "contact_number" text;
      ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "education_background" text;
      ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "experience_years" integer;
      ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "is_part_time" boolean;
      ALTER TABLE "doctors" ALTER COLUMN "speciality" DROP NOT NULL;
      ALTER TABLE "doctors" ALTER COLUMN "registration_number" DROP NOT NULL;
    `);
    console.log("✅ Updated doctors table.");

    // 2. Create availability_slots table
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "slot_status" AS ENUM('available', 'booked', 'cancelled', 'completed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      CREATE TABLE IF NOT EXISTS "availability_slots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
        "starts_at" timestamp with time zone NOT NULL,
        "ends_at" timestamp with time zone NOT NULL,
        "supported_modes" text[] DEFAULT '{"video","audio"}' NOT NULL,
        "status" "slot_status" DEFAULT 'available' NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Ensured availability_slots table exists.");

    // 3. Create appointments table if it's missing too
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "consultation_mode" AS ENUM('video', 'audio', 'async_chat', 'offline');
        CREATE TYPE "appointment_status" AS ENUM('draft', 'queued_offline', 'requested', 'pending_doctor', 'confirmed', 'in_progress', 'completed', 'rescheduled', 'rejected', 'cancelled', 'missed', 'follow_up_needed');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
      
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "patient_id" uuid NOT NULL REFERENCES "patients"("id"),
        "doctor_id" uuid NOT NULL REFERENCES "doctors"("id"),
        "slot_id" uuid REFERENCES "availability_slots"("id"),
        "scheduled_at" timestamp with time zone NOT NULL,
        "status" "appointment_status" DEFAULT 'requested' NOT NULL,
        "concern_category" text NOT NULL,
        "preferred_mode" "consultation_mode",
        "patient_notes" text,
        "version" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ Ensured appointments table exists.");

    console.log("🎉 Database successfully updated without data loss!");
  } catch (error) {
    console.error("❌ Error updating database:", error);
  } finally {
    await pool.end();
  }
}

main();
