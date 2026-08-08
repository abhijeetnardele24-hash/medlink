import { Pool } from "pg";
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

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Creating notifications table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "metadata_json" jsonb,
        "is_read" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    
    // Check if constraint exists before adding it
    const constraintCheck = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_users_id_fk'
    `);
    if (constraintCheck.rowCount === 0) {
      await pool.query(`
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      `);
    }

    console.log("Notifications table created successfully.");
  } catch (err) {
    console.error("Migration failed", err);
  } finally {
    await pool.end();
  }
}

main();
