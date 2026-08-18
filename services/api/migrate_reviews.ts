import { Client } from 'pg';

const connectionString = "postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "doctor_reviews" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "doctor_id" uuid NOT NULL REFERENCES "doctors"("id") ON DELETE CASCADE,
        "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "rating" integer NOT NULL,
        "comment" text NOT NULL,
        "reply" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "doctor_reviews_doctor_id_idx" ON "doctor_reviews" ("doctor_id");
    `);
    console.log("Table created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
}

run();
