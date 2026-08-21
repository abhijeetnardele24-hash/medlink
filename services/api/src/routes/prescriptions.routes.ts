import { Router, type Request, type Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import { prescriptions, doctors, encounters, appointments, patients, users, consentGrants } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { NotFoundError, ForbiddenError } from "../errors";
import PDFDocument from "pdfkit";

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

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=prescription-${rx.prescriptionId.substring(0, 8)}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#2563eb').text('MedLink', { align: 'left' });
    doc.fontSize(10).fillColor('#666666').text('Digital Prescription Receipt', { align: 'left' });
    
    // Doctor Info
    doc.moveUp(2);
    doc.fontSize(14).fillColor('#333333').text(rx.doctorName || 'Doctor', { align: 'right' });
    doc.fontSize(10).fillColor('#666666').text(rx.doctorSpeciality || '', { align: 'right' });
    if (rx.doctorReg) doc.text(`Reg No: ${rx.doctorReg}`, { align: 'right' });
    if (rx.facility) doc.text(rx.facility, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
    doc.moveDown(2);

    // Patient Info
    doc.fontSize(12).fillColor('#333333');
    doc.font('Helvetica-Bold').text('Patient: ', { continued: true }).font('Helvetica').text(rx.patientName || 'Unknown');
    doc.font('Helvetica-Bold').text('Date Issued: ', { continued: true }).font('Helvetica').text(new Date(rx.issuedAt || Date.now()).toLocaleDateString());
    
    doc.moveDown(2);

    // Medicines Table
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text('Medicines Prescribed');
    doc.moveDown(1);
    
    // Table Headers
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold');
    doc.text('Medicine Name', 50, tableTop);
    doc.text('Dosage', 250, tableTop);
    doc.text('Frequency', 350, tableTop);
    doc.text('Duration', 450, tableTop);
    
    doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor('#dddddd').lineWidth(1).stroke();
    
    // Table Rows
    let rowY = doc.y + 15;
    doc.font('Helvetica');
    if (medicines.length === 0) {
      doc.text('No medicines listed', 50, rowY);
    } else {
      for (const m of medicines) {
        doc.text(m.name || 'Unknown', 50, rowY);
        doc.text(m.dosage || '-', 250, rowY);
        doc.text(m.frequency || '-', 350, rowY);
        doc.text(m.duration || '-', 450, rowY);
        rowY += 20;
      }
    }
    
    doc.y = rowY;
    doc.moveDown(2);

    // Instructions
    if (rx.instructionsText) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text("Doctor's Instructions:");
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#444444').text(rx.instructionsText, {
        align: 'left',
        indent: 10
      });
      doc.moveDown(2);
    }

    // Footer
    const bottom = doc.page.height - 100;
    doc.y = bottom;
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').lineWidth(1).stroke();
    doc.moveDown();
    doc.fontSize(8).fillColor('#888888').text(`Prescription ID: ${rx.prescriptionId}`, { align: 'center' });
    doc.text('Electronically signed and issued via MedLink Platform.', { align: 'center' });

    doc.end();
  }
);


export default router;
