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
    const patientUid = await createFirebaseUser('patient@medlink.com');
    const patientUserRes = await pool.query(`
      INSERT INTO "users" (firebase_uid, role, email, display_name)
      VALUES ($1, 'patient', $2, 'John Doe')
      RETURNING id
    `, [patientUid, 'patient@medlink.com']);
    
    await pool.query(`
      INSERT INTO "patients" (user_id, preferred_language)
      VALUES ($1, 'en');
    `, [patientUserRes.rows[0].id]);

    // --- Create Doctors ---
    const doctors = [
      { name: 'Sarah Mitchell', spec: 'Neurologist', bio: 'Expert in treating headaches, migraines, seizures, and nervous system disorders.', email: 'sarah@medlink.com', languages: ['English', 'Spanish'] },
      { name: 'David Chen', spec: 'Cardiologist', bio: 'Specializing in heart conditions, chest pain, hypertension, and cardiac care.', email: 'david@medlink.com', languages: ['English', 'Mandarin'] },
      { name: 'Priya Sharma', spec: 'Dermatologist', bio: 'Treats skin rashes, acne, psoriasis, and other dermatological issues.', email: 'priya@medlink.com', languages: ['English', 'Hindi'] },
      { name: 'James Wilson', spec: 'General Physician', bio: 'Primary care for fevers, colds, flu, and general health checkups.', email: 'james@medlink.com', languages: ['English'] },
      { name: 'Emily White', spec: 'Pediatrician', bio: 'Specialist in child health, vaccinations, and infant care.', email: 'emily@medlink.com', languages: ['English', 'French'] },
      { name: 'Michael Brown', spec: 'Orthopedist', bio: 'Treats bone, joint, and muscle issues including fractures and arthritis.', email: 'michael@medlink.com', languages: ['English'] },
      { name: 'Lisa Taylor', spec: 'Gastroenterologist', bio: 'Specialist in digestive system, stomach pains, and gastric disorders.', email: 'lisa@medlink.com', languages: ['English', 'Spanish'] },
      { name: 'Robert Lee', spec: 'Ophthalmologist', bio: 'Expert in eye care, vision issues, cataracts, and glaucoma.', email: 'robert@medlink.com', languages: ['English', 'Korean'] },
      { name: 'Amanda Davis', spec: 'Dentist', bio: 'General dentistry, tooth pain, cavity treatment, and oral hygiene.', email: 'amanda@medlink.com', languages: ['English'] },
      { name: 'Daniel Clark', spec: 'ENT Specialist', bio: 'Treatment for ear infections, sinus issues, and throat disorders.', email: 'daniel@medlink.com', languages: ['English'] },
      { name: 'Jessica Moore', spec: 'Psychiatrist', bio: 'Mental health specialist focusing on anxiety, depression, and stress management.', email: 'jessica@medlink.com', languages: ['English'] },
      { name: 'Maria Garcia', spec: 'Gynecologist', bio: "Women's health, maternity care, and reproductive health.", email: 'maria@medlink.com', languages: ['English', 'Spanish'] },
      { name: 'Original Doctor', spec: 'General Physician', bio: 'Original test doctor account for backwards compatibility.', email: 'doctor@medlink.com', languages: ['English'] }
    ];

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
          'City Care Hospital', $5, 10, 500, $6, 'verified'
        )
        RETURNING id;
      `, [userRes.rows[0].id, doc.name, doc.spec, `GMC-${Math.floor(Math.random() * 90000) + 10000}`, doc.bio, doc.languages]);

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
