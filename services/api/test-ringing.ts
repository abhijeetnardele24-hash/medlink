import * as fs from 'fs';
import * as path from 'path';

// Load .env explicitly to ensure DATABASE_URL is set to Neon and not localhost fallback
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { io } from "socket.io-client";
import { getDb } from "./src/db";
import { users, appointments, encounters, doctors, patients } from "./src/db/schema";
import { v4 as uuidv4 } from "uuid";

// Force test bypass auth mode for the test run so we can inject headers
process.env.TEST_BYPASS_AUTH = "true";

async function runTests() {
  console.log("Setting up dummy data for Ringing Test...");
  const db = getDb();
  
  const doctorId = uuidv4();
  const patientId = uuidv4();
  const appointmentId = uuidv4();
  const encounterId = uuidv4();

  // Create dummy users
  await db.insert(users).values([
    { id: doctorId, email: `doc_${doctorId}@example.com`, role: "doctor", firebaseUid: doctorId, firstName: "Test", lastName: "Doctor" },
    { id: patientId, email: `pat_${patientId}@example.com`, role: "patient", firebaseUid: patientId, firstName: "Test", lastName: "Patient" }
  ]);

  await db.insert(doctors).values({
    userId: doctorId,
    fullName: "Dr. Test Doctor",
    specialization: "General Practice",
    medicalLicense: "LIC-" + doctorId,
    bio: "Test doctor",
    fee: "100"
  });

  await db.insert(patients).values([
    { userId: patientId, dateOfBirth: new Date("1990-01-01"), gender: "other" }
  ]);

  await db.insert(appointments).values({
    id: appointmentId,
    doctorId,
    patientId,
    concernCategory: "general_consultation",
    scheduledAt: new Date(),
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    status: "confirmed",
    consultationMode: "video"
  });

  await db.insert(encounters).values({
    id: encounterId,
    appointmentId,
    status: "in_progress",
    joinUrl: "test",
    notes: ""
  });

  console.log("Dummy data created. Encounter ID:", encounterId);

  const PORT = process.env.PORT || "3005";
  const url = `http://localhost:${PORT}`;

  console.log(`\n--- TEST: Doctor Rings Patient via Socket on ${url} ---`);

  await new Promise<void>((resolve, reject) => {
    let testPassed = false;
    
    // Connect Patient
    const patientSocket = io(url, { extraHeaders: { "x-user-id": patientId } });
    
    // Connect Doctor
    const doctorSocket = io(url, { extraHeaders: { "x-user-id": doctorId } });

    // Set timeout to fail test
    const timeout = setTimeout(() => {
      if (!testPassed) {
        console.error("❌ Test Failed: Patient did not receive incoming-call within 5 seconds.");
        patientSocket.disconnect();
        doctorSocket.disconnect();
        process.exit(1);
      }
    }, 5000);

    // Patient listens for the call
    patientSocket.on("incoming-call", (data) => {
      console.log(`✅ SUCCESS: Patient received incoming-call!`);
      console.log(`   - Encounter ID: ${data.encounterId}`);
      console.log(`   - Doctor Name: ${data.doctorName}`);
      
      if (data.encounterId === encounterId && data.doctorName === "Test Doctor") {
         console.log("✅ Data validation passed.");
         testPassed = true;
         clearTimeout(timeout);
         patientSocket.disconnect();
         doctorSocket.disconnect();
         resolve();
      } else {
         console.error("❌ Data validation failed. Got:", data);
         clearTimeout(timeout);
         process.exit(1);
      }
    });

    patientSocket.on("connect", () => {
      console.log(`Patient connected to socket. Waiting for call...`);
    });

    // Doctor connects, joins room, and rings
    doctorSocket.on("connect", () => {
      console.log(`Doctor connected to socket. Joining encounter...`);
      doctorSocket.emit("join-encounter", encounterId);
      
      // Give server a tiny fraction of a second to process join, then ring
      setTimeout(() => {
        console.log(`Doctor emitting 'ring-patient'...`);
        doctorSocket.emit("ring-patient", { encounterId });
      }, 500);
    });

    doctorSocket.on("error", (msg) => {
      console.error("❌ Doctor received Socket Error:", msg);
    });
  });

  console.log("\n🎉 Ringing test completed successfully!");
  process.exit(0);
}

runTests().catch(console.error);
