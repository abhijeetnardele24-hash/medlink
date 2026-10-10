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

async function createFirebaseUser(email: string, password = 'password123') {
  console.log(`Creating Firebase User: ${email}`);
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });

  const authData = await authRes.json();
  
  if (!authRes.ok) {
    if (authData.error?.message === 'EMAIL_EXISTS') {
      const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(`Failed to login existing user: ${loginData.error?.message}`);
      return loginData.localId;
    } else {
      throw new Error(`Firebase Auth Error: ${authData.error?.message}`);
    }
  }

  return authData.localId;
}

async function main() {
  try {
    console.log('🗑️  Truncating existing database tables...');
    await pool.query(`TRUNCATE "users" CASCADE;`);
    
    console.log('🚀 Provisioning realistic test data...');

    // --- Create Patient ---
    const patientUid = await createFirebaseUser('rahul.sharma@medlink.com');
    const patientUserRes = await pool.query(`
      INSERT INTO "users" (firebase_uid, role, email, display_name)
      VALUES ($1, 'patient', $2, 'Rahul Sharma')
      RETURNING id
    `, [patientUid, 'rahul.sharma@medlink.com']);
    
    await pool.query(`
      INSERT INTO "patients" (
        user_id, preferred_language, age_group, gender, gender_self_described,
        date_of_birth, blood_group, height, weight, allergies, chronic_conditions,
        emergency_contact_name, emergency_contact_phone, address, smoking_status,
        alcohol_status, diet_preference, location_district
      )
      VALUES (
        $1, 'hi', 'adult', 'male', 'Male',
        '1985-06-15', 'O+', 175, 70, ARRAY['Dust', 'Pollen'], ARRAY['Mild Asthma'],
        'Priya Sharma', '+91-9876543210', 'Andheri West, Mumbai, Maharashtra 400053', 'never',
        'occasional', 'vegetarian', 'Mumbai'
      );
    `, [patientUserRes.rows[0].id]);

    const doctorsJson = require('fs').readFileSync('C:\\\\Users\\\\Abhijeet Nardele\\\\.gemini\\\\antigravity-ide\\\\brain\\\\03424fcf-552b-49ec-b97b-6fc54c7ee458\\\\scratch\\\\generated_doctors.json', 'utf8');
    const doctors = JSON.parse(doctorsJson);
    
    // Add the original doctor back with realistic Indian details
    doctors.push({ name: 'Vikram Patel', spec: 'Cardiologist', bio: 'Senior Consultant Cardiologist with 20 years of experience in diagnosing and treating complex heart conditions. Awarded the National Medical Excellence Award in 2021.', email: 'dr.vikram.patel@medlink.com', languages: ['English', 'Hindi', 'Gujarati'], city: 'Mumbai', experience: 20, fee: 1500 });

    for (const doc of doctors) {
      const docUid = await createFirebaseUser(doc.email);
      const userRes = await pool.query(`
        INSERT INTO "users" (firebase_uid, role, email, display_name)
        VALUES ($1, 'doctor', $2, $3)
        RETURNING id
      `, [docUid, doc.email, `Dr. ${doc.name}`]);

      const docRes = await pool.query(`
        INSERT INTO "doctors" (
          user_id, full_name, speciality, registration_number, 
          facility_name, bio, experience_years, consultation_fee, languages_spoken, verification_status
        ) VALUES (
          $1, $2, $3, $4, 
          $5, $6, $7, $8, $9, 'verified'
        )
        RETURNING id;
      `, [userRes.rows[0].id, doc.name, doc.spec, `GMC-${Math.floor(Math.random() * 90000) + 10000}`, `${doc.city || 'City'} Care Hospital`, doc.bio, doc.experience || 10, doc.fee || 500, doc.languages]);

      await pool.query(`
        INSERT INTO "doctor_verifications" (doctor_id, status)
        VALUES ($1, 'verified')
      `, [docRes.rows[0].id]);
      
      // Add some open slots for each doctor
      const now = new Date();
      now.setHours(now.getHours() + 1);
      
      const later = new Date(now);
      later.setHours(later.getHours() + 1);
      
      await pool.query(`
        INSERT INTO "availability_slots" (doctor_id, starts_at, ends_at, status)
        VALUES ($1, $2, $3, 'available')
      `, [docRes.rows[0].id, now, later]);
    }

    console.log('🎉 Seed complete! Real testing data has been injected.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

main();
