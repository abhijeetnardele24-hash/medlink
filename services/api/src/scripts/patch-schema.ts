import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { verifyDatabaseConnection, closeDatabasePool } from "../postgres";

async function main() {
  console.log("Starting manual schema patch...");
  try {
    await verifyDatabaseConnection();
    const db = getDb();

    console.log("Applying patches...");
    
    // Pharmacists missing columns
    await db.execute(sql`ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS drug_license_number text;`);
    await db.execute(sql`ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS drug_license_document_url text;`);
    await db.execute(sql`ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS pharmacy_council_registration_number text;`);
    await db.execute(sql`ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS license_issuing_state text;`);
    await db.execute(sql`ALTER TABLE pharmacists ADD COLUMN IF NOT EXISTS license_expiry_date timestamp with time zone;`);

    // Medicines rename and type fix
    try {
      await db.execute(sql`ALTER TABLE medicines DROP COLUMN IF EXISTS requires_prescription;`);
      await db.execute(sql`ALTER TABLE medicines DROP COLUMN IF EXISTS prescription_tier;`);
      await db.execute(sql`DROP TYPE IF EXISTS prescription_tier;`);
      await db.execute(sql`CREATE TYPE prescription_tier AS ENUM ('otc', 'schedule_h', 'restricted');`);
      await db.execute(sql`ALTER TABLE medicines ADD COLUMN prescription_tier prescription_tier NOT NULL DEFAULT 'otc';`);
    } catch (e: any) {
      console.log("Error fixing prescription_tier:", e.message);
    }
    
    // Patients missing demographic columns
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender text;`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth text;`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS blood_group text;`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS height integer;`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight integer;`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergies text[];`);
    await db.execute(sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS chronic_conditions text[];`);

    console.log("Schema patches applied successfully.");

  } catch (error) {
    console.error("Patch failed:", error);
  } finally {
    await closeDatabasePool();
    process.exit(0);
  }
}

main();
