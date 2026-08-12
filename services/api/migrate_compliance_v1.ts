import 'dotenv/config';
import { getDb } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running compliance migration (Section 2.6)...');

  // Add drug_license_number
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacists" ADD COLUMN IF NOT EXISTS "drug_license_number" text;`);
    console.log('✅ Added drug_license_number');
  } catch (err: any) { console.log('⚠️  drug_license_number:', err.message); }

  // Add drug_license_document_url
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacists" ADD COLUMN IF NOT EXISTS "drug_license_document_url" text;`);
    console.log('✅ Added drug_license_document_url');
  } catch (err: any) { console.log('⚠️  drug_license_document_url:', err.message); }

  // Add pharmacy_council_registration_number
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacists" ADD COLUMN IF NOT EXISTS "pharmacy_council_registration_number" text;`);
    console.log('✅ Added pharmacy_council_registration_number');
  } catch (err: any) { console.log('⚠️  pharmacy_council_registration_number:', err.message); }

  // Add license_issuing_state
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacists" ADD COLUMN IF NOT EXISTS "license_issuing_state" text;`);
    console.log('✅ Added license_issuing_state');
  } catch (err: any) { console.log('⚠️  license_issuing_state:', err.message); }

  // Add license_expiry_date
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacists" ADD COLUMN IF NOT EXISTS "license_expiry_date" timestamptz;`);
    console.log('✅ Added license_expiry_date');
  } catch (err: any) { console.log('⚠️  license_expiry_date:', err.message); }

  // Add pharmacist_verification_history table
  try {
    await getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS "pharmacist_verification_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "pharmacist_id" uuid NOT NULL REFERENCES "pharmacists"("id") ON DELETE CASCADE,
        "coordinator_id" uuid REFERENCES "users"("id"),
        "action" text NOT NULL,
        "notes" text,
        "timestamp" timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Created pharmacist_verification_history table');
  } catch (err: any) { console.log('⚠️  pharmacist_verification_history:', err.message); }

  // Add prescriptionTier enum and column to medicines
  try {
    await getDb().execute(sql`
      DO $$ BEGIN
        CREATE TYPE prescription_tier AS ENUM ('otc', 'schedule_h', 'restricted');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Created prescription_tier enum');
  } catch (err: any) { console.log('⚠️  prescription_tier enum:', err.message); }

  try {
    await getDb().execute(sql`ALTER TABLE "medicines" ADD COLUMN IF NOT EXISTS "prescription_tier" prescription_tier NOT NULL DEFAULT 'otc';`);
    console.log('✅ Added prescription_tier to medicines');
  } catch (err: any) { console.log('⚠️  prescription_tier column:', err.message); }

  // Add pharmacy_dispense_audit table
  try {
    await getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS "pharmacy_dispense_audit" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "pharmacy_order_id" uuid NOT NULL REFERENCES "pharmacy_orders"("id") ON DELETE CASCADE,
        "pharmacist_id" uuid REFERENCES "pharmacists"("id"),
        "dispensed_at" timestamptz NOT NULL DEFAULT now(),
        "notes" text
      );
    `);
    console.log('✅ Created pharmacy_dispense_audit table');
  } catch (err: any) { console.log('⚠️  pharmacy_dispense_audit:', err.message); }

  // Add order_complaints table
  try {
    await getDb().execute(sql`
      CREATE TABLE IF NOT EXISTS "order_complaints" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "pharmacy_order_id" uuid NOT NULL REFERENCES "pharmacy_orders"("id") ON DELETE CASCADE,
        "patient_id" uuid REFERENCES "patients"("id"),
        "description" text NOT NULL,
        "status" text NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    console.log('✅ Created order_complaints table');
  } catch (err: any) { console.log('⚠️  order_complaints:', err.message); }

  console.log('\n🎉 Compliance migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
