import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually to avoid dependency issues
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const DOCTORS = [
  {
    firebaseUid: 'seed_firebase_uid_d1',
    email: 'dr.sharma@example.com',
    fullName: 'Aarav Sharma',
    speciality: 'Cardiologist',
    registrationNumber: 'MCI-10293',
    facilityName: 'Apollo Hospital, Delhi',
    educationBackground: 'MBBS, MD - Cardiology (AIIMS Delhi)',
    experienceYears: 12,
    isPartTime: true,
    contactNumber: '+919876543210'
  },
  {
    firebaseUid: 'seed_firebase_uid_d2',
    email: 'dr.patel@example.com',
    fullName: 'Priya Patel',
    speciality: 'Dermatologist',
    registrationNumber: 'GMC-45921',
    facilityName: 'Skin Care Clinic, Mumbai',
    educationBackground: 'MBBS, DDVL (KEM Hospital)',
    experienceYears: 8,
    isPartTime: false,
    contactNumber: '+919876543211'
  },
  {
    firebaseUid: 'seed_firebase_uid_d3',
    email: 'dr.reddy@example.com',
    fullName: 'Vikram Reddy',
    speciality: 'Neurologist',
    registrationNumber: 'SMC-88321',
    facilityName: 'Care Hospitals, Hyderabad',
    educationBackground: 'MBBS, DM - Neurology',
    experienceYears: 15,
    isPartTime: false,
    contactNumber: '+919876543212'
  },
  {
    firebaseUid: 'seed_firebase_uid_d4',
    email: 'dr.singh@example.com',
    fullName: 'Neha Singh',
    speciality: 'Pediatrician',
    registrationNumber: 'MCI-99211',
    facilityName: 'Child Care Center, Pune',
    educationBackground: 'MBBS, MD - Pediatrics',
    experienceYears: 5,
    isPartTime: true,
    contactNumber: '+919876543213'
  },
  {
    firebaseUid: 'seed_firebase_uid_d5',
    email: 'dr.iyer@example.com',
    fullName: 'Ramesh Iyer',
    speciality: 'Orthopedic Surgeon',
    registrationNumber: 'TMC-22341',
    facilityName: 'Fortis Hospital, Chennai',
    educationBackground: 'MBBS, MS - Orthopedics',
    experienceYears: 20,
    isPartTime: false,
    contactNumber: '+919876543214'
  }
];

const PATIENTS = [
  {
    firebaseUid: 'seed_firebase_uid_p1',
    email: 'rahul.verma@example.com',
    fullName: 'Rahul Verma',
    preferredLanguage: 'hi'
  },
  {
    firebaseUid: 'seed_firebase_uid_p2',
    email: 'sneha.gupta@example.com',
    fullName: 'Sneha Gupta',
    preferredLanguage: 'en'
  },
  {
    firebaseUid: 'seed_firebase_uid_p3',
    email: 'amit.kumar@example.com',
    fullName: 'Amit Kumar',
    preferredLanguage: 'mr'
  }
];

async function seed() {
  try {
    console.log('Seeding Database with Dummy Data...');

    // 1. Seed Doctors
    for (const doc of DOCTORS) {
      // Create User
      const userRes = await pool.query(`
        INSERT INTO "users" (firebase_uid, role, email, display_name)
        VALUES ($1, 'doctor', $2, $3)
        ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email
        RETURNING id;
      `, [doc.firebaseUid, doc.email, doc.fullName]);
      
      const userId = userRes.rows[0]?.id;

      if (userId) {
        // Create Doctor profile
        const docRes = await pool.query(`
          INSERT INTO "doctors" (
            user_id, full_name, speciality, registration_number, 
            facility_name, education_background, experience_years, is_part_time, contact_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (user_id) DO NOTHING
          RETURNING id;
        `, [userId, doc.fullName, doc.speciality, doc.registrationNumber, 
            doc.facilityName, doc.educationBackground, doc.experienceYears, doc.isPartTime, doc.contactNumber]);
        
        const docId = docRes.rows[0]?.id;
        
        if (docId) {
          // Create verification request
          await pool.query(`
            INSERT INTO "doctor_verifications" (doctor_id, status)
            VALUES ($1, 'pending_verification')
          `, [docId]);
        }
      }
    }
    console.log('✅ Added Dummy Doctors (with pending verifications)');

    // 2. Seed Patients
    for (const pat of PATIENTS) {
      const userRes = await pool.query(`
        INSERT INTO "users" (firebase_uid, role, email, display_name)
        VALUES ($1, 'patient', $2, $3)
        ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email
        RETURNING id;
      `, [pat.firebaseUid, pat.email, pat.fullName]);

      const userId = userRes.rows[0]?.id;

      if (userId) {
        await pool.query(`
          INSERT INTO "patients" (user_id, preferred_language)
          VALUES ($1, $2)
          ON CONFLICT (user_id) DO NOTHING;
        `, [userId, pat.preferredLanguage]);
      }
    }
    console.log('✅ Added Dummy Patients');

    console.log('🎉 Seeding Complete! Check your Admin Dashboard!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seed();
