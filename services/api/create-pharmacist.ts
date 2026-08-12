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

const PHARMACIST_EMAIL = 'testpharma@medlink.com';
const PHARMACIST_PASSWORD = 'password123';

async function main() {
  try {
    console.log(`🚀 Creating Firebase Auth User: ${PHARMACIST_EMAIL}...`);
    
    // 1. Create User in Firebase via REST API
    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: PHARMACIST_EMAIL,
        password: PHARMACIST_PASSWORD,
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
            body: JSON.stringify({ email: PHARMACIST_EMAIL, password: PHARMACIST_PASSWORD, returnSecureToken: true })
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
      VALUES ($1, 'pharmacist', $2, 'John Doe Pharmacy')
      ON CONFLICT (firebase_uid) DO UPDATE SET role = 'pharmacist'
      RETURNING id
    `, [firebaseUid, PHARMACIST_EMAIL]);

    const userId = userRes.rows[0].id;

    // 3. Insert Pharmacist Profile (only guaranteed columns)
    const pharmaRes = await pool.query(`
      INSERT INTO "pharmacists" (
        user_id, full_name, shop_name, contact_number, 
        registered_address, verification_status
      ) VALUES (
        $1, 'John Doe', 'MedLink Pharmacy Store', '+919876543210', 
        '123 Main St, Mumbai', 'verified'
      )
      ON CONFLICT (user_id) DO UPDATE SET verification_status = 'verified'
      RETURNING id;
    `, [userId]);

    const pharmacistId = pharmaRes.rows[0].id;

    // 4. Create an already VERIFIED record
    await pool.query(`
      INSERT INTO "pharmacist_verifications" (pharmacist_id, status)
      VALUES ($1, 'verified')
    `, [pharmacistId]);

    console.log('🎉 Pharmacist account fully provisioned and PRE-VERIFIED!');
    console.log('--------------------------------------------------');
    console.log(`📧 Email:    ${PHARMACIST_EMAIL}`);
    console.log(`🔑 Password: ${PHARMACIST_PASSWORD}`);
    console.log('--------------------------------------------------');
    console.log('You can now log directly into the Pharmacist Portal (localhost:5177)');

  } catch (error) {
    console.error('❌ Error creating pharmacist:', error);
  } finally {
    await pool.end();
  }
}

main();
