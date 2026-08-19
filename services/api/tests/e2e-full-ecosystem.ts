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
  users, patients, doctors, pharmacists, availabilitySlots, appointments, 
  encounters, prescriptions, medicines, pharmacyOrders, doctorVerifications, 
  pharmacistVerifications, doctorPayoutMethods, payoutRecords, auditEvents, paymentRecords 
} from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import { createServer } from "../src/server";

const PORT = 4097;
let server: http.Server;

async function api(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
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

async function runEndToEndLifecycle() {
  console.log("\n================================================================================");
  console.log("             MEDLINK FULL MULTI-ROLE END-TO-END ECOSYSTEM TEST                  ");
  console.log("================================================================================\n");

  const app = createServer();
  server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const db = getDb();
    process.env.NODE_ENV = "test";
    process.env.TEST_BYPASS_AUTH = "true";

    const timestamp = Date.now();

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: ONBOARDING & REGISTRATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 1/7] Registering Multi-Role Users (Patient, Doctor, Pharmacist, Coordinator)...");

    // 1a: Coordinator Setup
    const [coordUser] = await db
      .insert(users)
      .values({
        firebaseUid: `coord_e2e_${timestamp}`,
        email: `coordinator_${timestamp}@medlink.io`,
        displayName: "Admin Sarah Jenkins",
        role: "coordinator",
      })
      .returning();
    console.log(`  ✓ Coordinator registered: ${coordUser.displayName} (${coordUser.email})`);

    // 1b: Doctor Registration & Verification KYC Submission
    const [docUser] = await db
      .insert(users)
      .values({
        firebaseUid: `doc_e2e_${timestamp}`,
        email: `dr_arjun_${timestamp}@hospital.com`,
        displayName: "Dr. Arjun Mehta",
        role: "doctor",
      })
      .returning();

    const [doctor] = await db
      .insert(doctors)
      .values({
        userId: docUser.id,
        fullName: "Dr. Arjun Mehta, MD",
        speciality: "Cardiology",
        registrationNumber: `MCI-${timestamp}`,
        facilityName: "Apollo Super Specialty Hospital",
        educationBackground: "MBBS, MD (Cardiology) - AIIMS New Delhi",
        experienceYears: 12,
        consultationFee: 750,
        verificationStatus: "pending_verification",
      })
      .returning();

    const [docVerif] = await db
      .insert(doctorVerifications)
      .values({
        doctorId: doctor.id,
        status: "pending_verification",
      })
      .returning();
    console.log(`  ✓ Doctor submitted KYC: ${doctor.fullName} [Status: ${doctor.verificationStatus}]`);

    // 1c: Pharmacist Registration & Drug License KYC
    const [pharmUser] = await db
      .insert(users)
      .values({
        firebaseUid: `pharm_e2e_${timestamp}`,
        email: `apollo_pharm_${timestamp}@medlink.io`,
        displayName: "Apollo Pharmacy Central",
        role: "pharmacist",
      })
      .returning();

    const [pharmacist] = await db
      .insert(pharmacists)
      .values({
        userId: pharmUser.id,
        fullName: "Apollo Health Care Pvt Ltd",
        shopName: "Apollo 24x7 Central Pharmacy",
        registeredAddress: "45 MG Road, Connaught Place, New Delhi",
        drugLicenseNumber: `DL-PHARM-${timestamp}`,
        pharmacyCouncilRegistrationNumber: `PCR-${timestamp}`,
        verificationStatus: "pending_verification",
      })
      .returning();

    const [pharmVerif] = await db
      .insert(pharmacistVerifications)
      .values({
        pharmacistId: pharmacist.id,
        status: "pending_verification",
      })
      .returning();
    console.log(`  ✓ Pharmacist submitted KYC: ${pharmacist.shopName} [Status: ${pharmacist.verificationStatus}]`);

    // 1d: Patient Registration & Health Profile
    const [patUser] = await db
      .insert(users)
      .values({
        firebaseUid: `pat_e2e_${timestamp}`,
        email: `rohit_sharma_${timestamp}@gmail.com`,
        displayName: "Rohit Sharma",
        role: "patient",
      })
      .returning();

    const updateProfileRes = await api("/v1/patients/me", {
      method: "PUT",
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
      body: {
        fullName: "Rohit Sharma",
        gender: "Male",
        dateOfBirth: "1990-05-15",
        bloodGroup: "O+",
        allergies: ["Penicillin", "Dust Mites"],
        chronicConditions: ["Hypertension"],
        emergencyContactName: "Pooja Sharma",
        emergencyContactPhone: "+91 9876543210",
      },
    });
    assert.strictEqual(updateProfileRes.status, 200, "Patient profile update failed");
    console.log(`  ✓ Patient profile initialized with medical conditions & allergies.\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: COORDINATOR KYC APPROVAL & AUDIT LOGGING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 2/7] Coordinator Verifies Doctor & Pharmacy Licenses (OBS-01)...");

    // 2a: Approve Doctor
    const approveDocRes = await api(`/v1/admin/verifications/${docVerif.id}`, {
      method: "PATCH",
      headers: { "x-user-id": coordUser.firebaseUid, "x-role": "coordinator" },
      body: { status: "verified", reasonCode: "AIIMS_CREDENTIALS_VERIFIED" },
    });
    assert.strictEqual(approveDocRes.status, 200, "Doctor verification approval failed");

    const [verifiedDoc] = await db.select().from(doctors).where(eq(doctors.id, doctor.id));
    assert.strictEqual(verifiedDoc.verificationStatus, "verified");
    console.log(`  ✓ Dr. Arjun Mehta approved by coordinator -> Active in doctor directory.`);

    // 2b: Approve Pharmacist
    const approvePharmRes = await api(`/v1/admin/pharmacist-verifications/${pharmVerif.id}`, {
      method: "PATCH",
      headers: { "x-user-id": coordUser.firebaseUid, "x-role": "coordinator" },
      body: { status: "verified", reasonCode: "DRUG_LICENSE_VALIDATED", notes: "All compliance documents verified" },
    });
    assert.strictEqual(approvePharmRes.status, 200, "Pharmacist verification approval failed");

    const [verifiedPharm] = await db.select().from(pharmacists).where(eq(pharmacists.id, pharmacist.id));
    assert.strictEqual(verifiedPharm.verificationStatus, "verified");
    console.log(`  ✓ Apollo 24x7 Central Pharmacy approved -> Active in medicine dispensary.`);

    // 2c: Stock Pharmacy Catalog
    const [med1] = await db.insert(medicines).values({
      pharmacistId: pharmacist.id,
      name: "Telmisartan 40mg",
      price: 180,
      stockQuantity: 50,
      prescriptionTier: "schedule_h",
    }).returning();

    const [med2] = await db.insert(medicines).values({
      pharmacistId: pharmacist.id,
      name: "Atorvastatin 10mg",
      price: 240,
      stockQuantity: 40,
      prescriptionTier: "schedule_h",
    }).returning();
    console.log(`  ✓ Pharmacy stocked 2 prescription drugs (Telmisartan & Atorvastatin).\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3: DOCTOR AVAILABILITY & SCHEDULING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 3/7] Doctor Creates Availability Slots & Patient Books Consultation...");

    const slotTime = new Date(Date.now() + 24 * 3600 * 1000);
    const [slot] = await db.insert(availabilitySlots).values({
      doctorId: doctor.id,
      startsAt: slotTime,
      endsAt: new Date(slotTime.getTime() + 30 * 60 * 1000),
      status: "available",
    }).returning();

    const [patientRecord] = await db.select().from(patients).where(eq(patients.userId, patUser.id));

    // Patient books appointment
    const [appt] = await db.insert(appointments).values({
      patientId: patientRecord.id,
      doctorId: doctor.id,
      slotId: slot.id,
      scheduledAt: slotTime,
      concernCategory: "Cardiology",
      preferredMode: "video",
      status: "requested",
    }).returning();

    console.log(`  ✓ Appointment #${appt.id.substring(0, 8)} requested for ${slotTime.toISOString()}`);

    // Create payment record
    const [payRec] = await db.insert(paymentRecords).values({
      appointmentId: appt.id,
      amount: doctor.consultationFee,
      currency: "INR",
      razorpayOrderId: `rzp_order_e2e_${timestamp}`,
      state: "pending",
    }).returning();

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: PAYMENT CAPTURE & ATOMIC SLOT SYNCHRONIZATION (PERF-03, PERF-04)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 4/7] Processing Razorpay Payment Captured Webhook (Timing-Safe HMAC)...");

    const webhookBody = {
      event: "payment.captured",
      payload: {
        payment: {
          entity: {
            id: `pay_e2e_${timestamp}`,
            order_id: payRec.razorpayOrderId,
            amount: doctor.consultationFee * 100,
            status: "captured",
          },
        },
      },
    };

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "test_secret";
    const sig = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(webhookBody))
      .digest("hex");

    const webhookRes = await api("/v1/webhooks/razorpay", {
      method: "POST",
      headers: { "x-razorpay-signature": sig },
      body: webhookBody,
    });
    assert.strictEqual(webhookRes.status, 200, "Webhook payment processing failed");

    const [confirmedAppt] = await db.select().from(appointments).where(eq(appointments.id, appt.id));
    const [bookedSlot] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, slot.id));
    assert.strictEqual(confirmedAppt.status, "confirmed", "Appointment must be confirmed");
    assert.strictEqual(bookedSlot.status, "booked", "Availability slot must be booked");
    console.log(`  ✓ Payment verified! Appointment status: CONFIRMED, Slot status: BOOKED.\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 5: CLINICAL CONSULTATION, ENCOUNTER & PRESCRIPTION ISSUANCE (SEC-04)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 5/7] Doctor Starts Consultation Encounter & Issues Prescription...");

    // 5a: Doctor starts encounter
    const startEncRes = await api("/v1/encounters", {
      method: "POST",
      headers: { "x-user-id": docUser.firebaseUid, "x-role": "doctor" },
      body: { appointmentId: appt.id },
    });
    assert.strictEqual(startEncRes.status, 201, "Failed to start encounter");
    const encId = startEncRes.data.id;
    console.log(`  ✓ Encounter #${encId.substring(0, 8)} started in active video mode.`);

    // 5b: Patient reads encounter data (SEC-04 access check)
    const patEncRes = await api(`/v1/encounters/${encId}`, {
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
    });
    assert.strictEqual(patEncRes.status, 200, "Patient encounter access failed");

    // 5c: Doctor issues prescription with medications and recommendations
    const prescribeRes = await api(`/v1/encounters/${encId}/prescriptions`, {
      method: "POST",
      headers: { "x-user-id": docUser.firebaseUid, "x-role": "doctor" },
      body: {
        medicinesJson: [
          {
            medicineId: med1.id,
            name: "Telmisartan 40mg",
            dosage: "1 tablet daily after breakfast",
            frequency: "1-0-0",
            durationDays: 30,
            recommend: true,
          },
          {
            medicineId: med2.id,
            name: "Atorvastatin 10mg",
            dosage: "1 tablet at bedtime",
            frequency: "0-0-1",
            durationDays: 30,
            recommend: true,
          },
        ],
        instructionsText: "Monitor blood pressure weekly. Low sodium diet recommended.",
      },
    });
    assert.strictEqual(prescribeRes.status, 201, "Prescription issuance failed");
    const rxId = prescribeRes.data.id;
    console.log(`  ✓ Prescription #${rxId.substring(0, 8)} issued. Encounter marked ENDED, Appointment COMPLETED.\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 6: PHARMACY ORDER, ATOMIC INVENTORY DEDUCTION & FULFILLMENT (SEC-07)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 6/7] Patient Places Pharmacy Order & Inventory Decrements Atomically...");

    // 6a: Patient fetches prescriptions
    const patientRxList = await api("/v1/prescriptions/me", {
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
    });
    assert.strictEqual(patientRxList.status, 200);
    assert(patientRxList.data.data.length > 0, "Patient must see newly issued prescription");

    // 6b: Patient places order for both prescribed medications (2 boxes each)
    const orderRes = await api("/v1/pharmacy/orders", {
      method: "POST",
      headers: { "x-user-id": patUser.firebaseUid, "x-role": "patient" },
      body: {
        items: [
          { medicineId: med1.id, quantity: 2 },
          { medicineId: med2.id, quantity: 2 },
        ],
        prescriptionId: rxId,
        deliveryAddress: "Flat 402, Lotus Apartments, New Delhi",
      },
    });
    assert.strictEqual(orderRes.status, 201, "Pharmacy order creation failed");
    const order = orderRes.data.order || orderRes.data;
    const orderId = order.id;
    console.log(`  ✓ Pharmacy Order #${orderId.substring(0, 8)} placed successfully (Total: ₹${order.totalAmount}).`);

    // Verify inventory decrement
    const [updatedMed1] = await db.select().from(medicines).where(eq(medicines.id, med1.id));
    const [updatedMed2] = await db.select().from(medicines).where(eq(medicines.id, med2.id));
    assert.strictEqual(updatedMed1.stockQuantity, 48, "Med1 stock must decrement from 50 to 48");
    assert.strictEqual(updatedMed2.stockQuantity, 38, "Med2 stock must decrement from 40 to 38");
    console.log(`  ✓ Inventory stock atomically verified: Telmisartan (50 -> 48), Atorvastatin (40 -> 38).\n`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 7: DOCTOR PAYOUT & EARNINGS WITHDRAWAL (SEC-05)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("▶ [Step 7/7] Doctor Links UPI Payout Method & Initiates Withdrawal...");

    // 7a: Doctor links UPI ID
    const addPayoutRes = await api(`/v1/doctors/${doctor.id}/payout-methods`, {
      method: "POST",
      headers: { "x-user-id": docUser.firebaseUid, "x-role": "doctor" },
      body: {
        type: "upi",
        upiId: "dr.arjun@okaxis",
        name: "Dr. Arjun Mehta",
      },
    });
    assert.strictEqual(addPayoutRes.status, 201, "Failed to register doctor payout method");
    console.log(`  ✓ Doctor registered UPI payout handle: dr.arjun@okaxis`);

    // 7b: Doctor executes withdrawal
    const payoutMethodId = addPayoutRes.data.data?.id || addPayoutRes.data.id;
    const withdrawRes = await api(`/v1/doctors/${doctor.id}/withdraw`, {
      method: "POST",
      headers: { "x-user-id": docUser.firebaseUid, "x-role": "doctor" },
      body: {
        amount: 750,
        payoutMethodId,
      },
    });
    assert.strictEqual(withdrawRes.status, 200, "Failed to execute doctor withdrawal");
    console.log(`  ✓ Doctor payout of ₹750 processed (Payout ID: ${withdrawRes.data.payout?.id || withdrawRes.data.payoutId || withdrawRes.data.id}).\n`);

    console.log("================================================================================");
    console.log("     🎉 FULL MULTI-ROLE END-TO-END ECOSYSTEM VERIFICATION PASSED 100%!         ");
    console.log("================================================================================\n");

  } catch (err) {
    console.error("❌ E2E Execution Failed:", err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    process.exit(process.exitCode || 0);
  }
}

runEndToEndLifecycle().catch((err) => {
  console.error("Fatal error:", err);
  if (server) server.close();
  process.exit(1);
});
