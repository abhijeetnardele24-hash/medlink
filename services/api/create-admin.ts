import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
let firebaseApiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
      
      // Attempt to grab API key if stored in API .env
      if (key === 'FIREBASE_API_KEY' || key === 'VITE_FIREBASE_API_KEY') {
        firebaseApiKey = value;
      }
    }
  });
}

// Fallback to the one we wrote in coordinator-web if not found
if (!firebaseApiKey) {
  firebaseApiKey = 'AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const ADMIN_EMAIL = 'admin@medlink.com';
const ADMIN_PASSWORD = 'password123';

async function main() {
  try {
    console.log(`🚀 Creating Firebase Auth User: ${ADMIN_EMAIL}...`);
    
    // 1. Create User in Firebase via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        returnSecureToken: true
      })
    });

    const authData = await authRes.json();
    
    if (!authRes.ok) {
      if (authData.error?.message === 'EMAIL_EXISTS') {
        console.log('⚠️ Firebase user already exists! We will still ensure it is in the database.');
        // We can't get the UID easily if it already exists without signing in.
        // Let's just sign in to get the UID!
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, returnSecureToken: true })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Failed to login existing user: ${loginData.error?.message}`);
        authData.localId = loginData.localId;
      } else {
        throw new Error(`Firebase Auth Error: ${authData.error?.message}`);
      }
    }

    const firebaseUid = authData.localId;
    console.log(`✅ Firebase User ready! UID: ${firebaseUid}`);

    // 2. Insert into PostgreSQL
    console.log('📥 Inserting into PostgreSQL "users" table...');
    
    await pool.query(`
      INSERT INTO "users" (firebase_uid, role, email, display_name)
      VALUES ($1, 'coordinator', $2, 'System Admin')
      ON CONFLICT (firebase_uid) DO UPDATE SET role = 'coordinator'
    `, [firebaseUid, ADMIN_EMAIL]);

    console.log('🎉 Admin account fully provisioned!');
    console.log('--------------------------------------------------');
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log('--------------------------------------------------');
    console.log('You can now log in directly on localhost:5175/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await pool.end();
  }
}

main();
