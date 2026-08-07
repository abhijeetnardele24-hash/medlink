/**
 * Seed appointment using raw pg (no Drizzle abstraction layer)
 * Uses the DATABASE_URL directly from .env
 */
import * as fs from "fs";
import * as path from "path";

// Manually parse .env since we can't trust auto-loading in tsx
const envPath = path.join(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
  envVars[key] = val;
}

const DATABASE_URL = envVars["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("❌ Could not read DATABASE_URL from .env");
  process.exit(1);
}

// Strip channel_binding param as pg driver doesn't support it
const cleanUrl = DATABASE_URL.replace(/[&?]channel_binding=require/, "");
console.log("✅ Connecting to:", cleanUrl.replace(/\/\/.*?@/, "//[credentials]@"));

import { Client } from "pg";

const client = new Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log("✅ Connected to Neon database!");

  // Get first doctor
  const doctorRes = await client.query(
    `SELECT d.id, d.full_name FROM doctors d LIMIT 1`
  );
  if (doctorRes.rows.length === 0) {
    console.error("❌ No doctors found. Please run seed-users.bat first.");
    await client.end();
    process.exit(1);
  }

  // Get first patient
  const patientRes = await client.query(
    `SELECT p.id FROM patients p LIMIT 1`
  );
  if (patientRes.rows.length === 0) {
    console.error("❌ No patients found. Please run seed-users.bat first.");
    await client.end();
    process.exit(1);
  }

  const doctor = doctorRes.rows[0];
  const patient = patientRes.rows[0];

  console.log(`Found Doctor : Dr. ${doctor.full_name} (${doctor.id})`);
  console.log(`Found Patient: (${patient.id})`);
  console.log("Creating confirmed appointment...");

  const insertRes = await client.query(
    `INSERT INTO appointments (id, patient_id, doctor_id, scheduled_at, status, concern_category, version, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW(), 'confirmed', 'general_consultation', 1, NOW(), NOW())
     RETURNING id`,
    [patient.id, doctor.id]
  );

  const apptId = insertRes.rows[0].id;

  await client.end();

  console.log("");
  console.log("✅ Appointment created successfully!");
  console.log("─────────────────────────────────────────────────────");
  console.log(`  Appointment ID : ${apptId}`);
  console.log(`  Doctor         : Dr. ${doctor.full_name}`);
  console.log(`  Status         : CONFIRMED`);
  console.log("─────────────────────────────────────────────────────");
  console.log("");
  console.log("  ▶  Patient Portal  →  http://localhost:5176");
  console.log("  ▶  Doctor Portal   →  http://localhost:5174");
  console.log("");
  console.log("Log in on both portals and click 'Join Consultation'!");
}

main().catch((e) => {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
});
