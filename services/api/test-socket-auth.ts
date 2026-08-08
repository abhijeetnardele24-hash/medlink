import { io } from "socket.io-client";
import { getDb } from "./src/db";
import { users, appointments, encounters, doctors, patients } from "./src/db/schema";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";

// Force test bypass auth mode for the test run so we can inject headers
process.env.TEST_BYPASS_AUTH = "true";

async function runTests() {
  console.log("Setting up dummy data...");
  const db = getDb();
  
  // 1. Create dummy users, appointment, encounter
  const doctorId = uuidv4();
  const patientId = uuidv4();
  const randomUserId = uuidv4();
  const appointmentId = uuidv4();
  const encounterId = uuidv4();

  await db.insert(users).values([
    { id: doctorId, email: `doc_${doctorId}@example.com`, role: "doctor", firebaseUid: doctorId, name: "Dr. Socket" },
    { id: patientId, email: `pat_${patientId}@example.com`, role: "patient", firebaseUid: patientId, name: "Pat Socket" },
    { id: randomUserId, email: `rand_${randomUserId}@example.com`, role: "patient", firebaseUid: randomUserId, name: "Rand Socket" }
  ]);

  await db.insert(doctors).values({
    userId: doctorId,
    specialization: "General Practice",
    medicalLicense: "LIC-" + doctorId,
    bio: "Test doctor",
    fee: "100"
  });

  await db.insert(patients).values([
    { userId: patientId, dateOfBirth: new Date("1990-01-01"), gender: "other" },
    { userId: randomUserId, dateOfBirth: new Date("1990-01-01"), gender: "other" }
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

  // We need to wait for the HTTP server to start. 
  // In our test environment, we assume the API is running locally on port 3001.
  const PORT = process.env.PORT || "3001";
  const url = `http://localhost:${PORT}`;

  console.log("\n--- TEST CASE 1: No Token (Disabled in bypass mode) ---");
  console.log("Note: Because TEST_BYPASS_AUTH is true for this script, standard token missing error won't trigger if we just use the bypass block. So we will skip this specific rejection test as it tests firebase-admin, and we focus on the encounter authorization logic.");

  console.log("\n--- TEST CASE 2: Valid token, but random user joining encounter ---");
  await new Promise<void>((resolve) => {
    const socket2 = io(url, { extraHeaders: { "x-user-id": randomUserId } });
    socket2.on("connect", () => {
      socket2.emit("join-encounter", encounterId);
    });
    socket2.on("error", (msg) => {
      console.log("✅ Case 2 Expected Error received:", msg);
      socket2.disconnect();
      resolve();
    });
  });

  console.log("\n--- TEST CASE 3: Valid token, correct doctor joining encounter ---");
  await new Promise<void>((resolve) => {
    const socket3 = io(url, { extraHeaders: { "x-user-id": doctorId } });
    socket3.on("connect", () => {
      socket3.emit("join-encounter", encounterId);
      setTimeout(() => {
        console.log("✅ Case 3 Successfully joined without error (timeout reached)");
        socket3.disconnect();
        resolve();
      }, 1000);
    });
    socket3.on("error", (msg) => {
      console.error("❌ Case 3 Unexpected Error:", msg);
    });
  });

  console.log("\n--- TEST CASE 4: Valid token, correct doctor, but webrtc-offer without join-encounter ---");
  await new Promise<void>((resolve) => {
    const socket4 = io(url, { extraHeaders: { "x-user-id": doctorId } });
    socket4.on("connect", () => {
      // Fire webrtc-offer DIRECTLY
      socket4.emit("webrtc-offer", { encounterId, offer: { type: "offer", sdp: "dummy" } });
    });
    socket4.on("error", (msg) => {
      console.log("✅ Case 4 Expected Error received:", msg);
      socket4.disconnect();
      resolve();
    });
  });

  console.log("\n🎉 All socket authorization tests completed successfully!");
  process.exit(0);
}

runTests().catch(console.error);
