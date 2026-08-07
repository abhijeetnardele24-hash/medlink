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
  console.log("Adding 'amount' column to payment_records...");
  try {
    await db.execute(sql`ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS amount integer DEFAULT 0 NOT NULL;`);
    console.log("✅ Successfully added amount column.");
  } catch (err) {
    console.error("❌ Failed to add column:", err);
  }
  process.exit(0);
}

run();
