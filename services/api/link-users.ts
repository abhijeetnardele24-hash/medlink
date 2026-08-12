import 'dotenv/config';
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_vqUO9gL8TxzY@ep-muddy-cherry-aycbxeyl-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getDb } from './src/db';
import { users, patients } from './src/db/schema';
import { eq } from 'drizzle-orm';

const firebaseConfig = {
  apiKey: "AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M",
  authDomain: "medlink-f0762.firebaseapp.com",
  projectId: "medlink-f0762",
  storageBucket: "medlink-f0762.firebasestorage.app",
  messagingSenderId: "749505680778",
  appId: "1:749505680778:web:581e5221e6b56d55d1a473"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function linkUsers() {
  console.log("DB URL IS: " + process.env.DATABASE_URL);
  const accounts = [
    { email: 'pharmacist@medlink.com', pass: 'Password123!' },
    { email: 'testpatient@medlink.com', pass: 'Password123!' }
  ];

  for (const acc of accounts) {
    try {
      console.log(`Authenticating ${acc.email}...`);
      const cred = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
      const uid = cred.user.uid;
      
      console.log(`Got UID: ${uid}. Updating Postgres...`);
      
      // Update or insert into Postgres
      const existing = await getDb().select().from(users).where(eq(users.email, acc.email)).limit(1);
      
      if (existing.length > 0) {
        await getDb().update(users).set({ firebaseUid: uid }).where(eq(users.id, existing[0].id));
        console.log(`Updated existing Postgres user.`);
      } else {
        const [newUser] = await getDb().insert(users).values({
          firebaseUid: uid,
          email: acc.email,
          role: acc.email.includes('pharmacist') ? 'pharmacist' : 'patient'
        }).returning();
        
        if (acc.email.includes('patient')) {
          await getDb().insert(patients).values({ userId: newUser.id });
        }
        console.log(`Created new Postgres user.`);
      }
    } catch (err: any) {
      console.error(`Error processing ${acc.email}:`, err);
    }
  }
  process.exit(0);
}

linkUsers();
