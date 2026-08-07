import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as fs from 'fs';
import * as path from 'path';
import * as schema from "./src/db/schema";
import { sql } from "drizzle-orm";

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
const db = drizzle(pool, { schema });

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur'];
const SPECIALITIES = ['Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'Orthopedics', 'General Medicine', 'Gynecology', 'Ophthalmology', 'Psychiatry', 'Oncology'];
const LANGUAGES = ['en', 'hi', 'mr', 'te', 'ta', 'gu', 'kn', 'bn'];
const DOCTOR_FIRST_NAMES = ['Aarav', 'Priya', 'Vikram', 'Neha', 'Ramesh', 'Sanjay', 'Sneha', 'Rahul', 'Anita', 'Rajesh', 'Pooja', 'Sunil', 'Kiran', 'Amit', 'Divya'];
const LAST_NAMES = ['Sharma', 'Patel', 'Reddy', 'Singh', 'Iyer', 'Gupta', 'Kumar', 'Verma', 'Nair', 'Das', 'Jain', 'Bose', 'Rao', 'Desai'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  try {
    console.log('Clearing old data (Cascade)...');
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);

    console.log('Seeding Database with Realistic Synthetic Data...');

    // 1. Generate Doctors
    console.log('Generating ~50 Doctors...');
    const doctorsList = [];
    for (let i = 1; i <= 50; i++) {
      const fName = randomElement(DOCTOR_FIRST_NAMES);
      const lName = randomElement(LAST_NAMES);
      const fullName = `${fName} ${lName}`;
      const email = `dr.${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`;
      const spec = randomElement(SPECIALITIES);
      const city = randomElement(CITIES);
      const exp = randomNumber(2, 35);
      
      let status: 'verified' | 'pending_verification' | 'rejected' | 'needs_correction' = 'verified';
      const randStat = Math.random();
      if (randStat > 0.95) status = 'rejected';
      else if (randStat > 0.90) status = 'needs_correction';
      else if (randStat > 0.80) status = 'pending_verification';

      const [user] = await db.insert(schema.users).values({
        firebaseUid: `seed_dr_${i}_${Date.now()}`,
        role: 'doctor',
        email: email,
        displayName: `Dr. ${fullName}`
      }).returning();

      const [doctor] = await db.insert(schema.doctors).values({
        userId: user.id,
        fullName: `Dr. ${fullName}`,
        speciality: spec,
        registrationNumber: `MCI-${randomNumber(10000, 99999)}`,
        facilityName: `Care Clinic, ${city}`,
        educationBackground: `MBBS, MD - ${spec}`,
        experienceYears: exp,
        isPartTime: Math.random() > 0.7,
        contactNumber: `+91${randomNumber(9000000000, 9999999999)}`
      }).returning();

      await db.insert(schema.doctorVerifications).values({
        doctorId: doctor.id,
        status: status
      });

      if (status === 'verified') {
        doctorsList.push(doctor);
      }
    }
    console.log(`✅ Added 50 Doctors across ${SPECIALITIES.length} specialities.`);

    // 2. Generate Patients
    console.log('Generating ~30 Patients...');
    const patientsList = [];
    for (let i = 1; i <= 30; i++) {
      const fName = randomElement(DOCTOR_FIRST_NAMES);
      const lName = randomElement(LAST_NAMES);
      const fullName = `${fName} ${lName}`;
      const email = `patient.${fName.toLowerCase()}${i}@example.com`;

      const [user] = await db.insert(schema.users).values({
        firebaseUid: `seed_pt_${i}_${Date.now()}`,
        role: 'patient',
        email: email,
        displayName: fullName
      }).returning();

      const [patient] = await db.insert(schema.patients).values({
        userId: user.id,
        preferredLanguage: randomElement(LANGUAGES),
        locationDistrict: randomElement(CITIES)
      }).returning();

      patientsList.push(patient);
    }
    console.log('✅ Added 30 Patients.');

    // 3. Generate Appointments
    console.log('Generating Appointments...');
    const APPOINTMENT_STATUSES: Array<'requested' | 'confirmed' | 'completed' | 'cancelled' | 'missed'> = [
      'requested', 'confirmed', 'completed', 'cancelled', 'missed'
    ];

    let appointmentsCreated = 0;
    for (let i = 0; i < 150; i++) {
      const patient = randomElement(patientsList);
      const doctor = randomElement(doctorsList); // Only verified doctors
      const status = randomElement(APPOINTMENT_STATUSES);
      
      // Random date between 30 days ago and 30 days in future
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + randomNumber(-30, 30));

      const [apt] = await db.insert(schema.appointments).values({
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt: scheduledDate,
        status: status,
        concernCategory: randomElement(['general_consultation', 'follow_up', 'fever', 'skin_issue', 'routine_check']),
        version: 1
      }).returning();
      appointmentsCreated++;

      // If appointment is confirmed, missing, or completed, maybe create a reminder task
      if (['confirmed', 'missed'].includes(status) && Math.random() > 0.5) {
        await db.insert(schema.reminderTasks).values({
          appointmentId: apt.id,
          taskType: status === 'missed' ? 'no_show_follow_up' : 'pre_appointment_patient',
          dueAt: new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000), // Due 1 day before
          outcome: 'pending'
        });
      }
    }
    console.log(`✅ Added ${appointmentsCreated} Appointments across lifecycle stages.`);

    console.log('🎉 Seeding Complete! Check your Admin Dashboard!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await pool.end();
  }
}

seed();
