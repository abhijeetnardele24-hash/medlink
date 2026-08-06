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
  firebaseApiKey = 'AIzaSyDqf5K_5jsz4VEILbcXQzSrabda39pIy-M';
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const DOCTOR_EMAIL = 'doctor@medlink.com';
const DOCTOR_PASSWORD = 'password123';

async function main() {
  try {
    console.log(`🚀 Creating Firebase Auth User: ${DOCTOR_EMAIL}...`);
    
    // 1. Create User in Firebase via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: DOCTOR_EMAIL,
        password: DOCTOR_PASSWORD,
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
            body: JSON.stringify({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD, returnSecureToken: true })
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
      VALUES ($1, 'doctor', $2, 'Dr. Sarah Mitchell')
      ON CONFLICT (firebase_uid) DO UPDATE SET role = 'doctor'
      RETURNING id
    `, [firebaseUid, DOCTOR_EMAIL]);

    const userId = userRes.rows[0].id;

    // 3. Insert Doctor Profile
    const docRes = await pool.query(`
      INSERT INTO "doctors" (
        user_id, full_name, speciality, registration_number, 
        facility_name, education_background, experience_years, is_part_time, contact_number, verification_status
      ) VALUES (
        $1, 'Sarah Mitchell', 'Neurologist', 'GMC-77812', 
        'City Care Hospital', 'MBBS, MD - Neurology', 10, false, '+919876500000', 'verified'
      )
      ON CONFLICT (user_id) DO UPDATE SET verification_status = 'verified'
      RETURNING id;
    `, [userId]);

    const doctorId = docRes.rows[0].id;

    // 4. Create an already VERIFIED record (so they bypass the pending screen)
    await pool.query(`
      INSERT INTO "doctor_verifications" (doctor_id, status)
      VALUES ($1, 'verified')
    `, [doctorId]);

    console.log('🎉 Doctor account fully provisioned and PRE-VERIFIED!');
    console.log('--------------------------------------------------');
    console.log(`📧 Email:    ${DOCTOR_EMAIL}`);
    console.log(`🔑 Password: ${DOCTOR_PASSWORD}`);
    console.log('--------------------------------------------------');
    console.log('You can now log directly into the Doctor Portal (localhost:5174)');

  } catch (error) {
    console.error('❌ Error creating doctor:', error);
  } finally {
    await pool.end();
  }
}

main();
