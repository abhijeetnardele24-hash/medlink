import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { medicines, pharmacyOrders, pharmacyOrderItems, prescriptions, patients, users, prescriptionReconciliationAudit, pharmacists, pharmacistVerifications } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import Razorpay from "razorpay";
import { logger } from "../logger";

const router = Router();

let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function normalizeText(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
}

// POST /pharmacy/verify
router.post("/verify", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { licenseNumber } = req.body;
    if (!licenseNumber) {
      res.status(400).json({ error: "licenseNumber is required" });
      return;
    }

    const { uid } = res.locals.user;
    
    // Find pharmacist by user uid
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      res.status(403).json({ error: "Only pharmacists can submit verification" });
      return;
    }

    const pharmacistId = pharmacistRows[0].id;

    await getDb().transaction(async (tx) => {
      // Update license number on pharmacist
      await tx.update(pharmacists)
        .set({ licenseNumber })
        .where(eq(pharmacists.id, pharmacistId));

      // Create verification request
      await tx.insert(pharmacistVerifications).values({
        pharmacistId,
        status: "pending_verification",
      });
    });

    res.status(201).json({ success: true, message: "Verification submitted successfully" });
  } catch (err: any) {
    logger.error({ err }, "Failed to submit pharmacist verification");
    res.status(500).json({ error: "Failed to submit verification" });
  }
});

// POST /pharmacy/orders
router.post("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, prescriptionId, deliveryAddress } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Order must have items" });
      return;
    }
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

    // Fetch the requested medicines
    const medicineIds = items.map((i: any) => i.medicineId);
    const dbMedicines = await getDb()
      .select()
      .from(medicines)
      .where(inArray(medicines.id, medicineIds));
    
    const medMap = new Map();
    for (const m of dbMedicines) medMap.set(m.id, m);

    let rxJsonStr = "";
    let rxTokenSet = new Set<string>();

    // If there is a prescription, fetch it
    if (prescriptionId) {
      const rxRows = await getDb()
        .select({ medicinesJson: prescriptions.medicinesJson })
        .from(prescriptions)
        .where(eq(prescriptions.id, prescriptionId))
        .limit(1);

      if (rxRows.length > 0) {
        rxJsonStr = typeof rxRows[0].medicinesJson === 'string' 
          ? rxRows[0].medicinesJson 
          : JSON.stringify(rxRows[0].medicinesJson);
        rxTokenSet = new Set(normalizeText(rxJsonStr));
      } else {
        res.status(404).json({ error: "Prescription not found" });
        return;
      }
    }

    let totalAmount = 0;
    const orderItemsToInsert = [];
    const auditLogsToInsert = [];

    // Validation & Reconciliation
    for (const item of items) {
      const med = medMap.get(item.medicineId);
      if (!med) {
        res.status(400).json({ error: `Medicine not found: ${item.medicineId}` });
        return;
      }
      
      const qty = parseInt(item.quantity, 10);
      if (qty <= 0) {
        res.status(400).json({ error: "Invalid quantity" });
        return;
      }

      if (med.requiresPrescription) {
        if (!prescriptionId) {
          res.status(403).json({ error: `Medicine '${med.name}' requires a prescription, but none was provided.` });
          return;
        }

        const medTokens = normalizeText(med.name);
        
        let matched = false;
        let reason = "";

        if (medTokens.length === 0) {
          matched = false;
          reason = "Empty medicine name format";
        } else {
          // Strict requirement: EVERY token of the medicine name must appear in the prescription text
          const allTokensMatch = medTokens.every(t => rxTokenSet.has(t));
          if (allTokensMatch) {
            matched = true;
            reason = "Strict token match successful";
          } else {
            matched = false;
            const missing = medTokens.filter(t => !rxTokenSet.has(t));
            reason = `Missing tokens in prescription: ${missing.join(', ')}`;
          }
        }

        auditLogsToInsert.push({
          patientId,
          prescriptionId,
          medicineId: med.id,
          matched,
          reason
        });

        if (!matched) {
          // Do not fail the whole request immediately if we want to log the audit?
          // Actually, we should log it, then fail. We can log them all first.
        }
      }

      totalAmount += (med.price * qty);
      orderItemsToInsert.push({
        medicineId: med.id,
        quantity: qty,
        unitPrice: med.price,
      });
    }

    // Insert audit logs first if any
    if (auditLogsToInsert.length > 0) {
      await getDb().insert(prescriptionReconciliationAudit).values(auditLogsToInsert);
      
      // If any failed, reject order
      const failed = auditLogsToInsert.filter(a => !a.matched);
      if (failed.length > 0) {
        res.status(403).json({ 
          error: "Reconciliation failed for some prescription medicines", 
          details: failed 
        });
        return;
      }
    }

    if (!razorpay && process.env.TEST_BYPASS_AUTH !== "true") {
      res.status(500).json({ error: "Payment gateway not configured" });
      return;
    }

    // Create Razorpay Order
    let rzpOrderId = `test_order_${Date.now()}`;
    let rzpAmount = totalAmount * 100;
    let rzpCurrency = "INR";
    
    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // in paise
        currency: "INR",
        receipt: `pharmacy_order_${Date.now()}`
      });
      rzpOrderId = rzpOrder.id;
      rzpAmount = rzpOrder.amount as number;
      rzpCurrency = rzpOrder.currency;
    }

    // Create Pharmacy Order in DB
    const [order] = await getDb()
      .insert(pharmacyOrders)
      .values({
        prescriptionId: prescriptionId || null,
        patientId,
        totalAmount,
        deliveryAddress,
        status: "pending_payment",
        razorpayOrderId: rzpOrderId
      })
      .returning();

    // Create Order Items
    const itemsData = orderItemsToInsert.map(i => ({
      orderId: order.id,
      ...i
    }));
    await getDb().insert(pharmacyOrderItems).values(itemsData);

    res.status(201).json({ 
      order,
      razorpayOrderId: rzpOrderId,
      amount: rzpAmount,
      currency: rzpCurrency,
      message: "Pharmacy order created successfully" 
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to create pharmacy order");
    res.status(500).json({ error: "Failed to create order" });
  }
});

export default router;
