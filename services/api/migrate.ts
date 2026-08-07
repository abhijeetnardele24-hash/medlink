import { Pool } from "pg";
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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log("Adding razorpay_order_id to payment_records...");
    await pool.query('ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "razorpay_order_id" text;');

    console.log("Adding razorpay_payment_id to payment_records...");
    await pool.query('ALTER TABLE "payment_records" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" text;');

    console.log("Adding consultation_fee to doctors...");
    await pool.query('ALTER TABLE "doctors" ADD COLUMN IF NOT EXISTS "consultation_fee" integer DEFAULT 500 NOT NULL;');

    console.log("Migration completed successfully! You can now start the API.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
