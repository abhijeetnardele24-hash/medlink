import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { prescriptions, doctors, encounters, appointments, patients, users } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { NotFoundError, ForbiddenError } from "../errors";

const router = Router();

// ─── GET /prescriptions/:id/pdf ──────────────────────────────────────────────
router.get(
  "/:id/pdf",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;

    // Join prescriptions with doctor, encounter, appointment, patient, and user
    // to get all the data needed for a receipt
    const data = await getDb()
      .select({
        prescriptionId: prescriptions.id,
        issuedAt: prescriptions.issuedAt,
        medicinesJson: prescriptions.medicinesJson,
        instructionsText: prescriptions.instructionsText,
        doctorName: doctors.fullName,
        doctorSpeciality: doctors.speciality,
        doctorReg: doctors.registrationNumber,
        facility: doctors.facilityName,
        patientName: users.displayName,
        patientId: patients.id,
        patientUserId: patients.userId,
        doctorUserId: doctors.userId,
      })
      .from(prescriptions)
      .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
      .innerJoin(encounters, eq(prescriptions.encounterId, encounters.id))
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(patients.userId, users.id))
      .where(eq(prescriptions.id, id))
      .limit(1);

    if (data.length === 0) {
      throw new NotFoundError("Prescription");
    }

    const rx = data[0];

    const firebaseUid = res.locals.user.uid;
    const role = res.locals.user.role;
    let authUserId = firebaseUid;
    
    if (process.env.TEST_BYPASS_AUTH !== "true") {
      const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
      if (!u) throw new ForbiddenError("User not found in db");
      authUserId = u.id;
    }

    if (role === "patient" && rx.patientUserId !== authUserId) {
      throw new ForbiddenError("You do not have permission to view this prescription");
    }

    if (role === "doctor" && rx.doctorUserId !== authUserId) {
      // @ts-ignore
      const { consentGrants } = await import("../db/schema");
      const { and } = await import("drizzle-orm");
      const [grant] = await getDb()
        .select()
        .from(consentGrants)
        .where(
           and(
             eq(consentGrants.patientId, rx.patientId),
             eq(consentGrants.granteeId, authUserId),
             eq(consentGrants.status, "active")
           )
        )
        .limit(1);
        
      if (!grant) {
        throw new ForbiddenError("You do not have consent to view this patient's medical records");
      }
    }
    
    // Parse medicines json if it's stored as string, though Drizzle handles jsonb natively
    let medicines: any[] = [];
    if (typeof rx.medicinesJson === 'string') {
      try {
        medicines = JSON.parse(rx.medicinesJson);
      } catch (e) {
        medicines = [];
      }
    } else if (Array.isArray(rx.medicinesJson)) {
      medicines = rx.medicinesJson;
    }

    const medicinesHtml = medicines.map((m: any) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${m.name || 'Unknown'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${m.dosage || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${m.frequency || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${m.duration || '-'}</td>
      </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Prescription ${rx.prescriptionId}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .clinic-info { text-align: right; }
        h1 { margin: 0; color: #2563eb; }
        h2 { margin-top: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f8fafc; text-align: left; padding: 12px 8px; border: 1px solid #ddd; }
        .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>MedLink</h1>
          <p>Digital Prescription Receipt</p>
        </div>
        <div class="clinic-info">
          <h2>${rx.doctorName}</h2>
          <p>${rx.doctorSpeciality}<br>
          Reg No: ${rx.doctorReg}<br>
          ${rx.facility}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong>Patient:</strong> ${rx.patientName || 'Unknown'}<br>
        <strong>Date Issued:</strong> ${new Date(rx.issuedAt || Date.now()).toLocaleDateString()}
      </div>

      <h3>Medicines Prescribed</h3>
      <table>
        <thead>
          <tr>
            <th>Medicine Name</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${medicinesHtml || '<tr><td colspan="4" style="text-align: center; padding: 10px;">No medicines listed</td></tr>'}
        </tbody>
      </table>

      ${rx.instructionsText ? `
      <div style="margin-top: 30px;">
        <h3>Doctor's Instructions:</h3>
        <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px;">${rx.instructionsText}</p>
      </div>
      ` : ''}

      <div class="footer">
        Prescription ID: ${rx.prescriptionId}<br>
        Electronically signed and issued via MedLink Platform.
      </div>
    </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }
);

// ─── POST /prescriptions/:id/order ─────────────────────────────────────────
router.post(
  "/:id/order",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { deliveryAddress } = req.body;

    if (!deliveryAddress) {
      res.status(400).json({ error: "Delivery address is required" });
      return;
    }

    const { uid } = res.locals.user;
    
    // Find patient ID
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const patientRows = await getDb()
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userRows[0].id))
      .limit(1);

    if (patientRows.length === 0) {
      res.status(403).json({ error: "Only patients can place pharmacy orders" });
      return;
    }
    const patientId = patientRows[0].id;

    // Verify prescription exists
    const rxRows = await getDb()
      .select({ medicinesJson: prescriptions.medicinesJson })
      .from(prescriptions)
      .where(eq(prescriptions.id, id))
      .limit(1);

    if (rxRows.length === 0) {
      res.status(404).json({ error: "Prescription not found" });
      return;
    }

    // Calculate total amount (mock logic: Rs. 150 per medicine)
    let medicines: any[] = [];
    if (typeof rxRows[0].medicinesJson === "string") {
      try {
        medicines = JSON.parse(rxRows[0].medicinesJson);
      } catch (e) {
        medicines = [];
      }
    } else if (Array.isArray(rxRows[0].medicinesJson)) {
      medicines = rxRows[0].medicinesJson;
    }

    if (medicines.length === 0) {
      res.status(400).json({ error: "Prescription has no medicines" });
      return;
    }

    const totalAmount = medicines.length * 150; // Mock fixed cost

    // Create Pharmacy Order
    // @ts-ignore
    const { pharmacyOrders } = await import("../db/schema");
    const [order] = await getDb()
      .insert(pharmacyOrders)
      .values({
        prescriptionId: id,
        patientId,
        totalAmount,
        deliveryAddress,
        status: "pending_payment"
      })
      .returning();

    res.status(201).json({ 
      order, 
      message: "Pharmacy order created successfully, proceed to payment" 
    });
  }
);

export default router;
