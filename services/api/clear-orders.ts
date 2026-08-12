import 'dotenv/config';
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
import { getDb } from './src/db';
import { pharmacyOrders, pharmacyOrderItems } from './src/db/schema';

async function main() {
  await getDb().delete(pharmacyOrderItems);
  await getDb().delete(pharmacyOrders);
  console.log('Orders cleared');
  process.exit(0);
}

main().catch(console.error);
