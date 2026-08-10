import { Pool } from 'pg';
import { getFirebaseAdmin } from './src/firebase';
import * as fs from 'fs';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const args = process.argv.slice(2);
const email = args[0];

if (!email) {
  console.error('Usage: npx tsx create-coordinator.ts <email>');
  process.exit(1);
}

async function run() {
  console.log(`Setting up coordinator account for: ${email}`);
  
  const admin = getFirebaseAdmin();
  let firebaseUid = '';
  
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    firebaseUid = userRecord.uid;
    console.log(`User found in Firebase. UID: ${firebaseUid}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`User not found in Firebase. Creating new user...`);
      const newUser = await admin.auth().createUser({
        email,
        emailVerified: true,
        password: 'ChangeMe123!',
      });
      firebaseUid = newUser.uid;
      console.log(`Created Firebase user. UID: ${firebaseUid}. Default password: ChangeMe123!`);
    } else {
      console.error('Error interacting with Firebase Auth:', err);
      process.exit(1);
    }
  }

  // 2. Insert into PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  
  const existingUser = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  if (existingUser.length > 0) {
    console.log(`User already exists in PostgreSQL database. Updating role to coordinator...`);
    await db.update(users)
      .set({ role: 'COORDINATOR' })
      .where(eq(users.firebaseUid, firebaseUid));
  } else {
    console.log(`Inserting new user into PostgreSQL as coordinator...`);
    await db.insert(users).values({
      firebaseUid,
      email,
      name: 'Coordinator Admin',
      role: 'COORDINATOR',
    });
  }

  // 3. Set custom claims in Firebase for consistency
  await admin.auth().setCustomUserClaims(firebaseUid, { role: 'coordinator' });
  console.log(`Successfully set 'coordinator' custom claim on Firebase user.`);
  
  console.log(`Done! ${email} is now a Coordinator.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
