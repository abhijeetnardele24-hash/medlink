import { getDb } from "./src/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Load .env
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

async function run() {
  const db = getDb();
  console.log("Adding pharmacy_orders table to DB...");
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "pharmacy_order_status" AS ENUM ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✅ Enum pharmacy_order_status ready.");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pharmacy_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "prescription_id" uuid NOT NULL REFERENCES "prescriptions"("id"),
        "patient_id" uuid NOT NULL REFERENCES "patients"("id"),
        "total_amount" integer NOT NULL,
        "status" "pharmacy_order_status" DEFAULT 'pending_payment' NOT NULL,
        "delivery_address" text NOT NULL,
        "razorpay_order_id" text,
        "razorpay_payment_id" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "pharmacy_orders_patient_id_idx" ON "pharmacy_orders" ("patient_id");
      CREATE INDEX IF NOT EXISTS "pharmacy_orders_prescription_id_idx" ON "pharmacy_orders" ("prescription_id");
    `);

    console.log("✅ Successfully created pharmacy_orders table and indexes.");
  } catch (err) {
    console.error("❌ Failed to create table:", err);
  }
  process.exit(0);
}

run();
