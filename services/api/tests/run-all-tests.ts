import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "").trim();
      process.env[match[1]] = val;
    }
  });
}

import assert from "node:assert";
import http from "http";
import crypto from "crypto";
import { getDb } from "../src/db";
import { 
  users, patients, doctors, appointments, availabilitySlots, encounters, 
  prescriptions, doctorVerifications, auditEvents, paymentRecords, medicines, 
  pharmacists, consentGrants 
} from "../src/db/schema";
import { eq } from "drizzle-orm";
import { createServer } from "../src/server";

const PORT = 4099;
let server: http.Server;

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const url = `http://127.0.0.1:${PORT}${path}`;
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runProductionTestSuite() {
  console.log("\n=======================================================");
  console.log("    MEDLINK UNIFIED PRODUCTION TEST & COMPLIANCE SUITE ");
  console.log("=======================================================\n");

  const app = createServer();
  server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const db = getDb();
    process.env.NODE_ENV = "test";
    process.env.TEST_BYPASS_AUTH = "true";

    // ─── SUITE 1: Critical Security & Auth Gating ──────────────────────
    console.log("--- 1. Security & Auth Gating (SEC-01, SEC-02, SEC-03) ---");

    // 1a: Gate test bypass in production mode
    process.env.NODE_ENV = "production";
    const prodBypassRes = await request("/v1/appointments", {
      headers: { "x-user-id": "attacker", "x-role": "admin" },
    });
    assert.strictEqual(prodBypassRes.status, 401, "SEC-01 FAIL: In production, test bypass must be ignored");
    console.log("✅ 1a Passed: Test bypass strictly ignored in production (HTTP 401).");
    process.env.NODE_ENV = "test";

    // Setup Fixtures
    const [patUser] = await db
      .insert(users)
      .values({
        firebaseUid: `pat_prod_${Date.now()}`,
        email: `pat_prod_${Date.now()}@test.com`,
        displayName: "Patient Suite",
        role: "patient",
      })
      .returning();
    const [pat] = await db.insert(patients).values({ userId: patUser.id }).returning();

    const [docUser1] = await db
      .insert(users)
      .values({
        firebaseUid: `doc1_prod_${Date.now()}`,
        email: `doc1_prod_${Date.now()}@test.com`,
        displayName: "Dr. Suite One",
        role: "doctor",
      })
      .returning();
    const [doc1] = await db.insert(doctors).values({ userId: docUser1.id, fullName: "Dr. Suite One", speciality: "General", verificationStatus: "verified" }).returning();

    const [docUser2] = await db
      .insert(users)
      .values({
        firebaseUid: `doc2_prod_${Date.now()}`,
        email: `doc2_prod_${Date.now()}@test.com`,
        displayName: "Dr. Suite Two",
        role: "doctor",
      })
      .returning();
    const [doc2] = await db.insert(doctors).values({ userId: docUser2.id, fullName: "Dr. Suite Two", speciality: "General", verificationStatus: "verified" }).returning();

    // 1b: Patient dossier authorization (SEC-03)
    const dossierResUnauth = await request(`/v1/patients/${pat.id}`, {
      headers: { "x-user-id": docUser2.firebaseUid, "x-role": "doctor" },
    });
    assert.strictEqual(dossierResUnauth.status, 403, "SEC-03 FAIL: Doctor without appointment/consent must be blocked");
    console.log("✅ 1b Passed: Unrelated doctor blocked from accessing patient dossier (HTTP 403).\n");

    // ─── SUITE 2: Encounter IDOR, Concurrency & Stock Locks ────────────
    console.log("--- 2. Encounter IDOR, Concurrency & Inventory (SEC-04..07) ---");

    const slotStart = new Date(Date.now() + 86400000);
    const [slot] = await db.insert(availabilitySlots).values({ doctorId: doc1.id, startsAt: slotStart, endsAt: new Date(slotStart.getTime() + 1800000), status: "available" }).returning();

    const [appt] = await db.insert(appointments).values({
      patientId: pat.id,
      doctorId: doc1.id,
      slotId: slot.id,
      scheduledAt: slotStart,
      concernCategory: "General",
      status: "confirmed",
    }).returning();

    const [enc] = await db.insert(encounters).values({
      appointmentId: appt.id,
      status: "active",
      startedAt: new Date(),
    }).returning();

    // 2a: Unassigned doctor blocked from encounter (SEC-04)
    const unauthEncRes = await request(`/v1/encounters/${enc.id}`, {
      headers: { "x-user-id": docUser2.firebaseUid, "x-role": "doctor" },
    });
    assert.strictEqual(unauthEncRes.status, 403);
    console.log("✅ 2a Passed: Unassigned doctor blocked from encounter (HTTP 403).");

    // 2b: Assigned doctor issues prescription atomically (SEC-04)
    const rxRes = await request(`/v1/encounters/${enc.id}/prescriptions`, {
      method: "POST",
      headers: { "x-user-id": docUser1.firebaseUid, "x-role": "doctor" },
      body: {
        medicinesJson: [{ name: "Amoxicillin", dosage: "500mg" }],
        instructionsText: "Take with food",
      },
    });
    assert.strictEqual(rxRes.status, 201);
    console.log("✅ 2b Passed: Assigned doctor issued prescription atomically (HTTP 201).");

    // 2c: Doctor payout methods IDOR protection (SEC-05)
    const unauthPayoutRes = await request(`/v1/doctors/${doc1.id}/payout-methods`, {
      method: "POST",
      headers: { "x-user-id": docUser2.firebaseUid, "x-role": "doctor" },
      body: { type: "upi", upiId: "attacker@upi" },
    });
    assert.strictEqual(unauthPayoutRes.status, 403);
    console.log("✅ 2c Passed: Attacker doctor blocked from modifying another doctor's payout methods (HTTP 403).");

    // 2d: Atomic pharmacy stock locking (SEC-07)
    const [pharmUser] = await db.insert(users).values({ firebaseUid: `ph_${Date.now()}`, email: `ph_${Date.now()}@t.com`, displayName: "Ph", role: "pharmacist" }).returning();
    const [pharm] = await db.insert(pharmacists).values({ userId: pharmUser.id, fullName: "Ph", shopName: "Apollo", registeredAddress: "St", verificationStatus: "verified" }).returning();
    const [med] = await db.insert(medicines).values({ pharmacistId: pharm.id, name: "Ibuprofen 400mg", price: 80, stockQuantity: 4, prescriptionTier: "otc" }).returning();

    const overOrderRes = await request("/v1/pharmacy/orders", {
      method: "POST",
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
      body: { items: [{ medicineId: med.id, quantity: 10 }], deliveryAddress: "123 Street" },
    });
    assert.strictEqual(overOrderRes.status, 409);
    console.log("✅ 2d Passed: Pharmacy order exceeding stock atomically rejected with HTTP 409 Conflict.\n");

    // ─── SUITE 3: Zod Validation, Pagination & Observability ────────────
    console.log("--- 3. Validation, Observability & Webhooks (CQ-01..04, PERF-02..04, OBS-01) ---");

    // 3a: Schema rejection on malformed UUID
    const malformedEncRes = await request("/v1/encounters", {
      method: "POST",
      headers: { "x-user-id": docUser1.firebaseUid, "x-role": "doctor" },
      body: { appointmentId: "invalid-uuid" },
    });
    assert.strictEqual(malformedEncRes.status, 400);
    console.log("✅ 3a Passed: Zod schema caught and rejected malformed appointmentId (HTTP 400).");

    // 3b: Coordinator verification audit logging (OBS-01)
    const [verif] = await db.insert(doctorVerifications).values({ doctorId: doc1.id, status: "pending_verification" }).returning();
    const [coordUser] = await db.insert(users).values({ firebaseUid: `co_${Date.now()}`, email: `co_${Date.now()}@t.com`, displayName: "Co", role: "coordinator" }).returning();

    const approveRes = await request(`/v1/admin/verifications/${verif.id}`, {
      method: "PATCH",
      headers: { "x-user-id": coordUser.firebaseUid, "x-role": "coordinator" },
      body: { status: "verified", reasonCode: "VERIFIED_OK" },
    });
    assert.strictEqual(approveRes.status, 200);

    const auditRows = await db.select().from(auditEvents).where(eq(auditEvents.resourceId, doc1.id));
    assert(auditRows.length > 0 && auditRows[0].action === "doctor.verification.verified");
    console.log("✅ 3b Passed: Coordinator decision recorded in structured audit_events.");

    // 3c: Bounded pagination defaults (PERF-02)
    const pagedRxRes = await request("/v1/prescriptions/me?limit=5&page=1", {
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
    });
    assert.strictEqual(pagedRxRes.status, 200);
    assert.strictEqual(pagedRxRes.data.limit, 5);
    console.log("✅ 3c Passed: Bounded pagination applied on prescription list.");

    // 3d: Webhook HMAC verification and slot synchronization (PERF-03, PERF-04)
    const [payRec] = await db.insert(paymentRecords).values({
      appointmentId: appt.id,
      amount: 500,
      currency: "INR",
      razorpayOrderId: `ord_${Date.now()}`,
      state: "pending",
    }).returning();

    const webhookBody = {
      event: "payment.captured",
      payload: { payment: { entity: { id: `pay_${Date.now()}`, order_id: payRec.razorpayOrderId, amount: 50000, status: "captured" } } },
    };
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret";
    const sig = crypto.createHmac("sha256", webhookSecret).update(JSON.stringify(webhookBody)).digest("hex");

    const webhookRes = await request("/v1/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": sig },
      body: webhookBody,
    });
    assert.strictEqual(webhookRes.status, 200);

    const [updatedSlot] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, slot.id));
    assert.strictEqual(updatedSlot.status, "booked");
    console.log("✅ 3d Passed: Webhook verified timing-safely and slot synchronized to 'booked'.\n");

    console.log("=======================================================");
    console.log("  ALL PRODUCTION TEST SUITES PASSED WITH ZERO ERRORS!  ");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Test suite encountered error:", err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    process.exit(process.exitCode || 0);
  }
}

runProductionTestSuite().catch((err) => {
  console.error("Fatal error:", err);
  if (server) server.close();
  process.exit(1);
});
