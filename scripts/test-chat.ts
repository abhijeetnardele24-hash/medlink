import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../services/api/.env"), override: true });

import { io } from "socket.io-client";
import { getDb } from "../services/api/src/db";
import { users, appointments, encounters, doctors, patients, messages } from "../services/api/src/db/schema";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";


// Force test bypass auth mode for the test run so we can inject headers
process.env.TEST_BYPASS_AUTH = "true";

async function runTests() {
  console.log("Setting up dummy data...");
  const db = getDb();
  
  const doctorId = uuidv4();
  const patientId = uuidv4();
  const randomUserId = uuidv4();
  
  const doctorDbId = uuidv4();
  const patientDbId = uuidv4();

  const appointmentId = uuidv4();
  const encounterId = uuidv4();

  await db.insert(users).values([
    { id: doctorId, email: `doc_${doctorId}@example.com`, role: "doctor", firebaseUid: doctorId },
    { id: patientId, email: `pat_${patientId}@example.com`, role: "patient", firebaseUid: patientId },
    { id: randomUserId, email: `rand_${randomUserId}@example.com`, role: "patient", firebaseUid: randomUserId }
  ]);

  await db.insert(doctors).values({
    id: doctorDbId,
    userId: doctorId,
    fullName: "Dr. Chat Test",
  });

  await db.insert(patients).values([
    { id: patientDbId, userId: patientId },
  ]);

  await db.insert(appointments).values({
    id: appointmentId,
    doctorId: doctorDbId,
    patientId: patientDbId,
    concernCategory: "general_consultation",
    scheduledAt: new Date(),
  });

  await db.insert(encounters).values({
    id: encounterId,
    appointmentId,
  });

  console.log("Dummy data created. Encounter ID:", encounterId);

  const PORT = "3000";
  const url = `http://localhost:${PORT}`;
  const apiUrl = `${url}/encounters/${encounterId}/messages`;

  console.log("\n--- TEST CASE 1: Valid participant POST and GET message ---");
  const postRes = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": doctorId },
    body: JSON.stringify({ body: "Hello from doctor" })
  });
  console.log("POST status (expected 201):", postRes.status);
  
  const getRes = await fetch(apiUrl, {
    method: "GET",
    headers: { "x-user-id": patientId }
  });
  console.log("GET status (expected 200):", getRes.status);
  const getJson = await getRes.json();
  console.log("GET response messages count (expected 1):", getJson.messages?.length);
  if (getJson.messages?.length) {
    console.log("Message body:", getJson.messages[0].body);
  }

  console.log("\n--- TEST CASE 2: Non-participant gets 403 on POST and GET ---");
  const postRes403 = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": randomUserId },
    body: JSON.stringify({ body: "I shouldn't be here" })
  });
  console.log("POST status (expected 403):", postRes403.status);

  const getRes403 = await fetch(apiUrl, {
    method: "GET",
    headers: { "x-user-id": randomUserId }
  });
  console.log("GET status (expected 403):", getRes403.status);


  console.log("\n--- TEST CASE 3: Socket rejected on message/typing without join-encounter ---");
  await new Promise<void>((resolve) => {
    const socket = io(url, { extraHeaders: { "x-user-id": doctorId } });
    
    socket.on("connect", () => {
      // Do NOT emit join-encounter
      // Try emitting message
      socket.emit("message", { encounterId, body: "Sneaky message" });
    });

    socket.on("error", (msg: any) => {
      console.log("✅ Case 3 Expected Error received:", msg);
      socket.disconnect();
      resolve();
    });
  });

  console.log("Tests completed.");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
