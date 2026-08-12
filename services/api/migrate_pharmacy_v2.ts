import 'dotenv/config';
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
import { getDb } from './src/db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running pharmacy migration...');
  
  try {
    await getDb().execute(sql`ALTER TYPE pharmacy_order_status ADD VALUE IF NOT EXISTS 'pending_pharmacist_review' BEFORE 'pending_payment';`);
    console.log('Added pending_pharmacist_review to enum');
  } catch (err: any) {
    console.log('Enum already exists or error:', err.message);
  }

  try {
    await getDb().execute(sql`ALTER TABLE "pharmacy_orders" ADD COLUMN "attachment_url" text;`);
    console.log('Added attachment_url to pharmacy_orders');
  } catch (err: any) {
    console.log('Column already exists or error:', err.message);
  }

  try {
    await getDb().execute(sql`ALTER TABLE "pharmacy_orders" ADD COLUMN "pharmacist_id" uuid;`);
    console.log('Added pharmacist_id to pharmacy_orders');
  } catch (err: any) {
    console.log('Column already exists or error:', err.message);
  }

  // We make pharmacist_id NOT NULL for future entries, but wait we need a default or we can just leave it nullable in SQL and enforce it in application logic, 
  // or we can set it to NOT NULL now since we cleared the table!
  try {
    await getDb().execute(sql`ALTER TABLE "pharmacy_orders" ALTER COLUMN "pharmacist_id" SET NOT NULL;`);
    console.log('Made pharmacist_id NOT NULL');
  } catch (err: any) {
    console.log('Error setting NOT NULL:', err.message);
  }

  try {
    await getDb().execute(sql`
      ALTER TABLE "pharmacy_orders" 
      ADD CONSTRAINT "pharmacy_orders_pharmacist_id_pharmacists_id_fk" 
      FOREIGN KEY ("pharmacist_id") REFERENCES "public"."pharmacists"("id") ON DELETE no action ON UPDATE no action;
    `);
    console.log('Added foreign key for pharmacist_id');
  } catch (err: any) {
    console.log('FK already exists or error:', err.message);
  }

  console.log('Migration complete');
  process.exit(0);
}

main().catch(console.error);
