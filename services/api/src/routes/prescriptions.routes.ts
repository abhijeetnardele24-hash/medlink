import { Router, type Request, type Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { prescriptions, doctors, encounters, appointments, patients, users, consentGrants } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { NotFoundError, ForbiddenError } from "../errors";

const router = Router();

async function resolveAuthUserId(firebaseUid: string): Promise<string> {
  const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  return u ? u.id : firebaseUid;
}

// ─── GET /me ─────────────────────────────────────────────────────────────────
router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const firebaseUid = res.locals.user.uid;
    const role = res.locals.user.role;

    if (role !== "patient") {
      throw new ForbiddenError("Only patients can fetch their own prescriptions here");
    }

    const authUserId = await resolveAuthUserId(firebaseUid);

    const [patient] = await getDb().select().from(patients).where(eq(patients.userId, authUserId)).limit(1);
    if (!patient) throw new NotFoundError("Patient profile");

    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const offset = (page - 1) * limit;

    const data = await getDb()
      .select({
        id: prescriptions.id,
        issuedAt: prescriptions.issuedAt,
        medicinesJson: prescriptions.medicinesJson,
        instructionsText: prescriptions.instructionsText,
        doctorName: doctors.fullName,
        doctorSpeciality: doctors.speciality,
        encounterId: prescriptions.encounterId,
      })
      .from(prescriptions)
      .innerJoin(encounters, eq(prescriptions.encounterId, encounters.id))
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.patientId, patient.id))
      .orderBy(desc(prescriptions.issuedAt))
      .limit(limit)
      .offset(offset);

    res.json({ data, page, limit });
  }
);

// ─── GET /prescriptions/pending ──────────────────────────────────────────────
router.get(
  "/pending",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const firebaseUid = res.locals.user.uid;
    const role = res.locals.user.role;

    if (role !== "doctor") {
      throw new ForbiddenError("Only doctors can fetch pending prescriptions");
    }

    const authUserId = await resolveAuthUserId(firebaseUid);

    const [doctor] = await getDb().select().from(doctors).where(eq(doctors.userId, authUserId)).limit(1);
    if (!doctor) throw new NotFoundError("Doctor profile");

    const data = await getDb()
      .select({
        id: prescriptions.id,
        encounterId: prescriptions.encounterId,
        medicinesJson: prescriptions.medicinesJson,
        createdAt: prescriptions.createdAt,
        patientName: users.displayName,
      })
      .from(prescriptions)
      .innerJoin(encounters, eq(prescriptions.encounterId, encounters.id))
      .innerJoin(appointments, eq(encounters.appointmentId, appointments.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .innerJoin(users, eq(patients.userId, users.id))
      .where(
        and(
          eq(prescriptions.doctorId, doctor.id),
          eq(prescriptions.status, "draft")
        )
      )
      .orderBy(prescriptions.createdAt);

    res.json({ data });
  }
);

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


export default router;
