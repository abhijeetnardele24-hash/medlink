import { getDb } from "./src/db";
import { sql } from "drizzle-orm";
import encountersRouter from "./src/routes/encounters.routes";
import prescriptionsRouter from "./src/routes/prescriptions.routes";
import express from "express";
import fs from "fs";
import path from "path";
import * as schema from "./src/db/schema";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

process.env.TEST_BYPASS_AUTH = "true";

async function test() {
  const app = express();
  app.use(express.json());
  
  app.use("/encounters", encountersRouter);
  app.use("/prescriptions", prescriptionsRouter);

  const server = app.listen(3098, async () => {
    console.log("Testing Phase 3: Prescriptions...");

    try {
      const db = getDb();

      // 1. Find a doctor, a patient, and create a fake appointment to start an encounter
      console.log("Setting up dummy appointment...");
      const doc = (await db.select().from(schema.doctors).limit(1))[0];
      const pat = (await db.select().from(schema.patients).limit(1))[0];
      const userDoc = (await db.select().from(schema.users).where(sql`id = ${doc.userId}`).limit(1))[0];

      const [appt] = await db.insert(schema.appointments).values({
        patientId: pat.id,
        doctorId: doc.id,
        scheduledAt: new Date(),
        status: "confirmed",
        concernCategory: "general_consultation",
        version: 1
      }).returning();

      // 2. POST /encounters to create an encounter
      console.log("Calling POST /encounters...");
      let res = await fetch("http://localhost:3098/encounters", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": userDoc.id,
          "x-role": "doctor"
        },
        body: JSON.stringify({ appointmentId: appt.id })
      });
      if (!res.ok) throw new Error(await res.text());
      const encounter = await res.json();
      console.log("✅ Encounter created:", encounter.id);

      // 3. POST /encounters/:id/prescriptions
      console.log("Calling POST /encounters/:id/prescriptions...");
      res = await fetch(`http://localhost:3098/encounters/${encounter.id}/prescriptions`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": userDoc.id,
          "x-role": "doctor"
        },
        body: JSON.stringify({
          doctorId: doc.id,
          medicinesJson: [
            { name: "Paracetamol 500mg", dosage: "1 tablet", frequency: "Twice a day", duration: "5 days" },
            { name: "Amoxicillin", dosage: "250mg", frequency: "Thrice a day", duration: "7 days" }
          ],
          instructionsText: "Drink plenty of water and rest."
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const prescription = await res.json();
      console.log("✅ Prescription created:", prescription.id);

      // Verify Appointment Status
      const updatedAppt = (await db.select().from(schema.appointments).where(sql`id = ${appt.id}`))[0];
      console.log(`✅ Appointment status is now: ${updatedAppt.status}`);

      // 4. GET /prescriptions/:id/pdf
      console.log("Calling GET /prescriptions/:id/pdf...");
      res = await fetch(`http://localhost:3098/prescriptions/${prescription.id}/pdf`, {
        method: "GET",
        headers: { 
          "x-user-id": userDoc.id,
          "x-role": "doctor"
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const html = await res.text();
      console.log("✅ Received HTML Receipt! (Length: " + html.length + " bytes)");
      console.log(html);

      console.log("\n🎉 Phase 3 flow complete!");
    } catch (e) {
      console.error("Test failed:", e);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

test();
