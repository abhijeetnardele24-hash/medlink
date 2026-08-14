import 'dotenv/config';
import { getDb } from './src/db';
import { sql } from 'drizzle-orm';

async function clearData() {
  console.log('Clearing fake appointments, encounters, prescriptions, and pharmacy orders...');
  
  try {
    const db = getDb();
    await db.execute(sql.raw(`TRUNCATE TABLE pharmacy_order_items CASCADE;`));
    await db.execute(sql.raw(`TRUNCATE TABLE pharmacy_orders CASCADE;`));
    await db.execute(sql.raw(`TRUNCATE TABLE prescriptions CASCADE;`));
    await db.execute(sql.raw(`TRUNCATE TABLE encounters CASCADE;`));
    await db.execute(sql.raw(`TRUNCATE TABLE appointments CASCADE;`));
    
    console.log('✅ Successfully cleared all transactional data!');
    console.log('✅ Retained users (doctors, patients) and medicines.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to clear data:', error);
    process.exit(1);
  }
}

clearData();
