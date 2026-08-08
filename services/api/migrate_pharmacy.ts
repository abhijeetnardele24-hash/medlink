import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}
import { getDb } from './src/db/index';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    console.log("DB URL:", process.env.DATABASE_URL);
    const db = getDb();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "medicines" (
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
      
      CREATE TABLE IF NOT EXISTS "pharmacy_order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "order_id" uuid NOT NULL,
        "medicine_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price" integer NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "prescription_reconciliation_audit" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "patient_id" uuid NOT NULL,
        "prescription_id" uuid NOT NULL,
        "medicine_id" uuid NOT NULL,
        "matched" boolean NOT NULL,
        "reason" text NOT NULL,
        "occurred_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      
      ALTER TABLE "pharmacy_order_items" DROP CONSTRAINT IF EXISTS "pharmacy_order_items_order_id_pharmacy_orders_id_fk";
      ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_order_id_pharmacy_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pharmacy_orders"("id") ON DELETE cascade ON UPDATE no action;
      
      ALTER TABLE "pharmacy_order_items" DROP CONSTRAINT IF EXISTS "pharmacy_order_items_medicine_id_medicines_id_fk";
      ALTER TABLE "pharmacy_order_items" ADD CONSTRAINT "pharmacy_order_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;
      
      ALTER TABLE "prescription_reconciliation_audit" DROP CONSTRAINT IF EXISTS "prescription_reconciliation_audit_patient_id_patients_id_fk";
      ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;
      
      ALTER TABLE "prescription_reconciliation_audit" DROP CONSTRAINT IF EXISTS "prescription_reconciliation_audit_prescription_id_prescriptions_id_fk";
      ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE no action ON UPDATE no action;
      
      ALTER TABLE "prescription_reconciliation_audit" DROP CONSTRAINT IF EXISTS "prescription_reconciliation_audit_medicine_id_medicines_id_fk";
      ALTER TABLE "prescription_reconciliation_audit" ADD CONSTRAINT "prescription_reconciliation_audit_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;

      ALTER TABLE "pharmacy_orders" ALTER COLUMN "prescription_id" DROP NOT NULL;
    `);
    console.log('Migration successful');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

run();
