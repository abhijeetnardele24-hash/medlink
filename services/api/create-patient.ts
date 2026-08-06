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
      
      if (key === 'FIREBASE_API_KEY' || key === 'VITE_FIREBASE_API_KEY') {
        firebaseApiKey = value;
      }
    }
  });
}

if (!firebaseApiKey) {
  firebaseApiKey = 'AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M'; // default test key
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const PATIENT_EMAIL = 'patient@medlink.com';
const PATIENT_PASSWORD = 'password123';

async function main() {
  try {
    console.log(`🚀 Creating Firebase Auth User: ${PATIENT_EMAIL}...`);
    
    // 1. Create User in Firebase via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: PATIENT_EMAIL,
        password: PATIENT_PASSWORD,
        returnSecureToken: true
      })
    });

    const authData = await authRes.json();
    
    if (!authRes.ok) {
      if (authData.error?.message === 'EMAIL_EXISTS') {
        console.log('⚠️ Firebase user already exists! Getting UID via login...');
        const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: PATIENT_EMAIL, password: PATIENT_PASSWORD, returnSecureToken: true })
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

    console.log('📥 Provisioning PostgreSQL database records...');
    
    // 2. Insert User
    const userRes = await pool.query(`
      INSERT INTO "users" (firebase_uid, role, email, display_name)
      VALUES ($1, 'patient', $2, 'John Doe')
      ON CONFLICT (firebase_uid) DO UPDATE SET role = 'patient'
      RETURNING id
    `, [firebaseUid, PATIENT_EMAIL]);

    const userId = userRes.rows[0].id;

    // 3. Insert Patient Profile
    await pool.query(`
      INSERT INTO "patients" (
        user_id, preferred_language
      ) VALUES (
        $1, 'en'
      )
      ON CONFLICT (user_id) DO NOTHING;
    `, [userId]);

    console.log('🎉 Patient account fully provisioned!');
    console.log('--------------------------------------------------');
    console.log(`📧 Email:    ${PATIENT_EMAIL}`);
    console.log(`🔑 Password: ${PATIENT_PASSWORD}`);
    console.log('--------------------------------------------------');
    console.log('You can now log directly into the Patient Portal (localhost:5176)');

  } catch (error) {
    console.error('❌ Error creating patient:', error);
  } finally {
    await pool.end();
  }
}

main();
