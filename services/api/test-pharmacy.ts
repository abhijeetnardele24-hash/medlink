import { getDb } from "./src/db";
import { sql } from "drizzle-orm";
import express from "express";
import fs from "fs";
import path from "path";
import * as schema from "./src/db/schema";
import prescriptionsRouter from "./src/routes/prescriptions.routes";

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
  
  app.use("/prescriptions", prescriptionsRouter);

  const server = app.listen(3102, async () => {
    console.log("Testing Phase 5: Pharmacy Marketplace...");

    try {
      const db = getDb();
      
      // 1. Find an existing prescription
      const rx = (await db.select().from(schema.prescriptions).limit(1))[0];
      if (!rx) {
        throw new Error("No prescriptions found in DB to order from!");
      }

      // 2. We need the patient's Firebase UID to act as them
      const encounter = (await db.select().from(schema.encounters).where(sql`id = ${rx.encounterId}`))[0];
      const appt = (await db.select().from(schema.appointments).where(sql`id = ${encounter.appointmentId}`))[0];
      const patient = (await db.select().from(schema.patients).where(sql`id = ${appt.patientId}`))[0];
      const userDoc = (await db.select().from(schema.users).where(sql`id = ${patient.userId}`))[0];

      console.log(`Placing Pharmacy Order for Prescription: ${rx.id}`);
      
      // 3. POST /prescriptions/:id/order
      const res = await fetch(`http://localhost:3102/prescriptions/${rx.id}/order`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": userDoc.firebaseUid, // Our test bypass uses x-user-id as UID
          "x-role": "patient"
        },
        body: JSON.stringify({
          deliveryAddress: "123 Healing St, Wellness City"
        })
      });

      if (!res.ok) throw new Error(await res.text());
      const responseBody = await res.json();
      
      console.log("✅ Pharmacy Order Response:", responseBody);
      console.log("Total Amount to Pay: INR", responseBody.order.totalAmount);
      
      console.log("\n🎉 Phase 5 flow complete!");
    } catch (e) {
      console.error("❌ Test failed:", e);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

test();
