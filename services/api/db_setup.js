const { Client } = require('pg');

const dbUrl = 'postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = new Client({
  connectionString: dbUrl,
});

async function main() {
  await client.connect();
  
  try {
    console.log("Creating enums...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE payout_method_type AS ENUM ('bank_account', 'upi', 'card');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      DO $$ BEGIN
        CREATE TYPE payout_status AS ENUM ('processing', 'processed', 'reversed', 'cancelled', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log("Creating tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_payout_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        type payout_method_type NOT NULL,
        razorpay_fund_account_id TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        upi_id TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS doctor_payout_methods_doctor_id_idx ON doctor_payout_methods(doctor_id);

      CREATE TABLE IF NOT EXISTS payout_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        payout_method_id UUID NOT NULL REFERENCES doctor_payout_methods(id),
        amount INTEGER NOT NULL,
        status payout_status NOT NULL DEFAULT 'processing',
        razorpay_payout_id TEXT,
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS payout_records_doctor_id_idx ON payout_records(doctor_id);
      CREATE INDEX IF NOT EXISTS payout_records_status_idx ON payout_records(status);
    `);
    console.log("Success!");
  } catch (err) {
    console.error("Error", err);
  } finally {
    await client.end();
  }
}

main();
