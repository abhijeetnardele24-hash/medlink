import { db } from './src/db';
import { users } from './src/db/schema';
import { ilike } from 'drizzle-orm';

async function main() {
  const result = await db.select().from(users).where(ilike(users.fullName, '%Aarti%'));
  console.log("Found:", result);
  process.exit(0);
}
main();
