import 'dotenv/config';
import fetch from 'node-fetch';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Bypass TS errors for fetch
const fetchApi = fetch as any;

const API_URL = 'http://localhost:3000';

async function runTests() {
  console.log("Setting up dummy data...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // 1. Create a dummy patient
  const patientUserId = uuidv4();
  await db.insert(schema.users).values({
    id: patientUserId,
    firebaseUid: patientUserId,
    role: 'patient',
    email: 'testpatient_consent@example.com',
    displayName: 'Test Patient Consent',
  });
  const [patientRecord] = await db.insert(schema.patients).values({
    userId: patientUserId,
    dob: new Date(),
    gender: 'other',
    contactNumber: '1234567890',
    emergencyContact: '0987654321',
    address: 'Test Address'
  }).returning();

  // 2. Create a dummy doctor
  const doctorUserId = uuidv4();
  await db.insert(schema.users).values({
    id: doctorUserId,
    firebaseUid: doctorUserId,
    role: 'doctor',
    email: 'testdoctor_consent@example.com',
    displayName: 'Test Doctor Consent',
  });
  const [doctorRecord] = await db.insert(schema.doctors).values({
    userId: doctorUserId,
    speciality: 'General',
    qualifications: 'MBBS',
    registrationNumber: 'REG1234',
    consultationFee: 500,
    experienceYears: 5,
    facilityName: 'Test Clinic',
    facilityAddress: 'Test Address',
    verificationStatus: 'verified'
  }).returning();

  // 3. Create a dummy prescription for the patient, but issued by a DIFFERENT doctor.
  const otherDoctorUserId = uuidv4();
  await db.insert(schema.users).values({
    id: otherDoctorUserId,
    firebaseUid: otherDoctorUserId,
    role: 'doctor',
    email: 'otherdoctor_consent@example.com',
  });
  const [otherDoctorRecord] = await db.insert(schema.doctors).values({
    userId: otherDoctorUserId,
    speciality: 'General',
    qualifications: 'MBBS',
    registrationNumber: 'REG1235',
    consultationFee: 500,
    experienceYears: 5,
    facilityName: 'Test Clinic 2',
    facilityAddress: 'Test Address 2',
    verificationStatus: 'verified'
  }).returning();

  const [appointment] = await db.insert(schema.appointments).values({
    patientId: patientRecord.id,
    doctorId: otherDoctorRecord.id,
    scheduledAt: new Date(),
    status: 'completed',
    concernCategory: 'general',
  }).returning();

  const [encounter] = await db.insert(schema.encounters).values({
    appointmentId: appointment.id,
    status: 'completed',
  }).returning();

  const [prescription] = await db.insert(schema.prescriptions).values({
    encounterId: encounter.id,
    doctorId: otherDoctorRecord.id,
    medicinesJson: JSON.stringify([{ name: 'Test Med' }]),
  }).returning();

  console.log(`Dummy data created. Patient: ${patientUserId}, Doctor: ${doctorUserId}, Prescription: ${prescription.id}`);

  // Test Case 1: Patient grants consent to the doctor
  console.log("\n--- TEST CASE 1: Patient grants consent ---");
  const postGrantRes = await fetchApi(`${API_URL}/consents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': patientUserId,
      'x-role': 'patient'
    },
    body: JSON.stringify({
      granteeId: doctorUserId,
      purpose: 'test_purpose',
      scope: 'test_scope'
    })
  });
  const postGrantBody = await postGrantRes.json();
  console.log(`POST /consents status: ${postGrantRes.status}`);
  if (postGrantRes.status !== 201) throw new Error("Failed to grant consent");
  const grantId = postGrantBody.data.id;

  // Test Case 2: Doctor fetches prescription, should succeed due to consent
  console.log("\n--- TEST CASE 2: Doctor fetches prescription WITH consent ---");
  const getRxRes = await fetchApi(`${API_URL}/prescriptions/${prescription.id}/pdf`, {
    headers: {
      'x-user-id': doctorUserId,
      'x-role': 'doctor'
    }
  });
  console.log(`GET /prescriptions/:id/pdf status (expected 200): ${getRxRes.status}`);
  if (getRxRes.status !== 200) throw new Error("Failed to fetch prescription with consent");

  // Test Case 3: Patient revokes consent
  console.log("\n--- TEST CASE 3: Patient revokes consent ---");
  const revokeRes = await fetchApi(`${API_URL}/consents/${grantId}/revoke`, {
    method: 'POST',
    headers: {
      'x-user-id': patientUserId,
      'x-role': 'patient'
    }
  });
  console.log(`POST /consents/:id/revoke status (expected 200): ${revokeRes.status}`);
  if (revokeRes.status !== 200) throw new Error("Failed to revoke consent");

  // Test Case 4: Doctor fetches prescription again, should fail due to revoked consent
  console.log("\n--- TEST CASE 4: Doctor fetches prescription WITHOUT active consent ---");
  const getRxFailRes = await fetchApi(`${API_URL}/prescriptions/${prescription.id}/pdf`, {
    headers: {
      'x-user-id': doctorUserId,
      'x-role': 'doctor'
    }
  });
  console.log(`GET /prescriptions/:id/pdf status (expected 403): ${getRxFailRes.status}`);
  if (getRxFailRes.status !== 403) throw new Error("Expected 403 when fetching prescription without consent");

  console.log("\n✅ All consent tests passed!");
  process.exit(0);
}

runTests().catch(console.error);
