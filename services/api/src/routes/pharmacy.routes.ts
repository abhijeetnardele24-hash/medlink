import { Router, type Request, type Response } from "express";
import { getDb } from "../db";
import { medicines, pharmacyOrders, pharmacyOrderItems, prescriptions, patients, users, prescriptionReconciliationAudit, pharmacists, pharmacistVerifications, pharmacyDispenseAudit, orderComplaints } from "../db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { verifyPharmacistSchema, uploadPrescriptionSchema, buildOrderSchema, createOrderSchema, fileComplaintSchema, verifyPaymentSchema } from "../schemas/pharmacy.schema";
import { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from "../errors";

import Razorpay from "razorpay";
import { logger } from "../logger";
import crypto from "crypto";

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
router.post("/verify", authenticate, validateBody(verifyPharmacistSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      drugLicenseNumber,
      drugLicenseDocumentUrl,
      pharmacyCouncilRegistrationNumber,
      licenseIssuingState,
      licenseExpiryDate
    } = req.body;

    if (!drugLicenseNumber || !pharmacyCouncilRegistrationNumber) {
      throw new ValidationError("drugLicenseNumber and pharmacyCouncilRegistrationNumber are required");
    }

    const { uid } = res.locals.user;
    
    // Find pharmacist by user uid
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      throw new ForbiddenError("Only pharmacists can submit verification");
    }

    const pharmacistId = pharmacistRows[0].id;

    await getDb().transaction(async (tx) => {
      // Update license number on pharmacist
      await tx.update(pharmacists)
        .set({ 
          drugLicenseNumber,
          drugLicenseDocumentUrl,
          pharmacyCouncilRegistrationNumber,
          licenseIssuingState,
          licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null
        })
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



// GET /pharmacy/pharmacists
router.get("/pharmacists", async (req: Request, res: Response): Promise<void> => {
  try {
    const dbPharmacists = await getDb()
      .select({
        id: pharmacists.id,
        fullName: pharmacists.fullName,
        shopName: pharmacists.shopName,
        registeredAddress: pharmacists.registeredAddress,
      })
      .from(pharmacists)
      .where(eq(pharmacists.verificationStatus, "verified"));
    res.json(dbPharmacists);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch pharmacists");
    res.status(500).json({ error: "Failed to fetch pharmacists" });
  }
});

// GET /pharmacy/inventory
router.get("/inventory", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    
    // Find pharmacist by user uid
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      throw new ForbiddenError("Only pharmacists have inventory");
    }

    const pharmacistId = pharmacistRows[0].id;

    const inventory = await getDb()
      .select()
      .from(medicines)
      .where(eq(medicines.pharmacistId, pharmacistId))
      .orderBy(medicines.name);

    res.json(inventory);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch inventory");
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// GET /pharmacy/orders/incoming
router.get("/orders/incoming", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!userRows.length) { throw new UnauthorizedError("User not found"); }
    
    const pharmacistRows = await getDb().select({ id: pharmacists.id }).from(pharmacists).where(eq(pharmacists.userId, userRows[0].id)).limit(1);
    if (!pharmacistRows.length) { throw new ForbiddenError("Only pharmacists can view incoming orders"); }
    
    const pharmacistId = pharmacistRows[0].id;
    
    const orders = await getDb()
      .select({
        id: pharmacyOrders.id,
        patientId: pharmacyOrders.patientId,
        totalAmount: pharmacyOrders.totalAmount,
        status: pharmacyOrders.status,
        attachmentUrl: pharmacyOrders.attachmentUrl,
        createdAt: pharmacyOrders.createdAt,
        patientName: users.displayName,
      })
      .from(pharmacyOrders)
      .innerJoin(patients, eq(patients.id, pharmacyOrders.patientId))
      .innerJoin(users, eq(users.id, patients.userId))
      .where(eq(pharmacyOrders.pharmacistId, pharmacistId));
      
    res.json(orders);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch incoming orders");
    res.status(500).json({ error: "Failed to fetch incoming orders" });
  }
});

// POST /pharmacy/orders/upload
router.post("/orders/upload", authenticate, validateBody(uploadPrescriptionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { pharmacistId: providedPharmacistId, attachmentUrl, deliveryAddress } = req.body;
    if (!attachmentUrl || !deliveryAddress) {
      throw new ValidationError("Missing required fields (attachmentUrl, deliveryAddress)");
    }
    
    const { uid } = res.locals.user;
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!userRows.length) { throw new UnauthorizedError("User not found"); }
    
    const patientRows = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, userRows[0].id)).limit(1);
    if (!patientRows.length) { throw new ForbiddenError("Only patients can upload prescriptions"); }
    
    // Auto-assign pharmacist if not provided
    let pharmacistId = providedPharmacistId;
    if (!pharmacistId) {
      const available = await getDb().select({ id: pharmacists.id }).from(pharmacists).where(eq(pharmacists.verificationStatus, "verified")).limit(1);
      if (available.length > 0) pharmacistId = available[0].id;
    }

    if (!pharmacistId) {
      throw new ValidationError("No verified pharmacist available to assign this prescription");
    }
    
    const [order] = await getDb().insert(pharmacyOrders).values({
      patientId: patientRows[0].id,
      pharmacistId,
      totalAmount: 0,
      deliveryAddress,
      attachmentUrl,
      status: "pending_pharmacist_review",
    }).returning();
    
    res.status(201).json({ success: true, order });
  } catch (err: any) {
    logger.error({ err }, "Failed to upload prescription");
    res.status(500).json({ error: "Failed to upload prescription" });
  }
});


// POST /pharmacy/orders/:orderId/build
router.post("/orders/:orderId/build", authenticate, validateBody(buildOrderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const { items } = req.body; // { medicineId, quantity }[]
    if (!items || !items.length) { throw new ValidationError("Items are required"); }
    
    const { uid } = res.locals.user;
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!userRows.length) { throw new UnauthorizedError("User not found"); }
    
    const pharmacistRows = await getDb().select({ id: pharmacists.id }).from(pharmacists).where(eq(pharmacists.userId, userRows[0].id)).limit(1);
    if (!pharmacistRows.length) { throw new ForbiddenError("Only pharmacists can build orders"); }
    
    const pharmacistId = pharmacistRows[0].id;
    
    // Verify order
    const orderRows = await getDb().select().from(pharmacyOrders).where(eq(pharmacyOrders.id, orderId)).limit(1);
    if (!orderRows.length || orderRows[0].pharmacistId !== pharmacistId) {
      throw new NotFoundError("Order not found");
    }
    
    if (orderRows[0].status !== "pending_pharmacist_review") {
      throw new ValidationError("Order is not pending review");
    }
    
    // Fetch medicines
    const medIds = items.map((i: any) => i.medicineId);
    const dbMedicines = await getDb().select().from(medicines).where(inArray(medicines.id, medIds));
    const medMap = new Map();
    for (const m of dbMedicines) medMap.set(m.id, m);
    
    let totalAmount = 0;
    const orderItemsToInsert: { orderId: string, medicineId: string, quantity: number, unitPrice: number }[] = [];
    
    for (const item of items) {
      const med = medMap.get(item.medicineId);
      if (!med || med.pharmacistId !== pharmacistId) {
        throw new ValidationError("Invalid medicine");
      }
      totalAmount += med.price * item.quantity;
      orderItemsToInsert.push({ orderId, medicineId: med.id, quantity: item.quantity, unitPrice: med.price });
    }
    
    // Create Razorpay Order
    let rzpOrderId = null;
    let rzpAmount = totalAmount * 100;
    
    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: 100, // DEMO: Force ₹1
        currency: "INR",
        receipt: `pharmacy_build_${Date.now()}`
      });
      rzpOrderId = rzpOrder.id;
      rzpAmount = rzpOrder.amount as number;
    }
    
    const idToUpdate = orderId as string;
    await getDb().transaction(async (tx) => {
      await tx.insert(pharmacyOrderItems).values(orderItemsToInsert);
      await tx.update(pharmacyOrders).set({ 
        totalAmount, 
        status: "pending_payment",
        razorpayOrderId: rzpOrderId
      }).where(eq(pharmacyOrders.id, idToUpdate));
    });
    
    res.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to build order");
    res.status(500).json({ error: "Failed to build order" });
  }
});


// GET /pharmacy/orders (for patient)
router.get("/orders", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = res.locals.user;
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (!userRows.length) { throw new UnauthorizedError("User not found"); }
    
    const patientRows = await getDb().select({ id: patients.id }).from(patients).where(eq(patients.userId, userRows[0].id)).limit(1);
    if (!patientRows.length) { throw new ForbiddenError("Only patients can view orders"); }
    
    const orders = await getDb()
      .select({
        id: pharmacyOrders.id,
        totalAmount: pharmacyOrders.totalAmount,
        status: pharmacyOrders.status,
        attachmentUrl: pharmacyOrders.attachmentUrl,
        createdAt: pharmacyOrders.createdAt,
        pharmacistName: pharmacists.shopName,
        razorpayOrderId: pharmacyOrders.razorpayOrderId,
      })
      .from(pharmacyOrders)
      .innerJoin(pharmacists, eq(pharmacists.id, pharmacyOrders.pharmacistId))
      .where(eq(pharmacyOrders.patientId, patientRows[0].id))
      .orderBy(pharmacyOrders.createdAt);
      
    res.json(orders);
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch orders");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST /pharmacy/orders
router.post("/orders", authenticate, validateBody(createOrderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, prescriptionId, deliveryAddress, pharmacistId: providedPharmacistId } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError("Order must have items");
    }
    if (!deliveryAddress) {
      throw new ValidationError("Delivery address is required");
    }

    const { uid } = res.locals.user;
    
    // Find patient ID
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
    
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }

    const patientRows = await getDb()
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userRows[0].id))
      .limit(1);

    if (patientRows.length === 0) {
      throw new ForbiddenError("Only patients can place pharmacy orders");
    }
    const patientId = patientRows[0].id;

    // Resolve pharmacistId: use provided one or auto-assign first verified pharmacist
    let pharmacistId = providedPharmacistId;
    if (!pharmacistId) {
      const availablePharmacists = await getDb()
        .select({ id: pharmacists.id })
        .from(pharmacists)
        .where(eq(pharmacists.verificationStatus, "verified"))
        .limit(1);
      if (availablePharmacists.length > 0) {
        pharmacistId = availablePharmacists[0].id;
      }
    }

    if (!pharmacistId) {
      throw new ValidationError("No verified pharmacist available to assign this order");
    }

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
        throw new NotFoundError("Prescription not found");
      }
    }

    let totalAmount = 0;
    const orderItemsToInsert: { medicineId: string, quantity: number, unitPrice: number }[] = [];
    const auditLogsToInsert: { patientId: string, prescriptionId: string, medicineId: string, matched: boolean, reason: string }[] = [];

    // Validation & Reconciliation
    for (const item of items) {
      const med = medMap.get(item.medicineId);
      if (!med) {
        throw new ValidationError(`Medicine not found: ${item.medicineId}`);
      }
      
      const qty = parseInt(item.quantity, 10);
      if (qty <= 0) {
        throw new ValidationError("Invalid quantity");
      }

      if (med.prescriptionTier === "restricted") {
        throw new ForbiddenError(`Medicine '${med.name}' is restricted and cannot be ordered online.`);
      }

      if (med.prescriptionTier === "schedule_h") {
        if (!prescriptionId) {
          throw new ForbiddenError(`Medicine '${med.name}' requires a prescription, but none was provided.`);
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
      // If any failed, reject order before creating transaction
      const failed = auditLogsToInsert.filter(a => !a.matched);
      if (failed.length > 0) {
        await getDb().insert(prescriptionReconciliationAudit).values(auditLogsToInsert);
        throw new ForbiddenError(`Reconciliation failed: ${JSON.stringify(failed)}`);
      }
    }

    if (!razorpay && process.env.TEST_BYPASS_AUTH !== "true") {
      throw new ValidationError("Payment gateway not configured");
    }

    // Create Razorpay Order
    let rzpOrderId = `test_order_${Date.now()}`;
    let rzpAmount = totalAmount * 100;
    let rzpCurrency = "INR";
    
    if (razorpay) {
      const rzpOrder = await razorpay.orders.create({
        amount: 100, // DEMO: Force ₹1
        currency: "INR",
        receipt: `pharmacy_order_${Date.now()}`
      });
      rzpOrderId = rzpOrder.id;
      rzpAmount = rzpOrder.amount as number;
      rzpCurrency = rzpOrder.currency;
    }

    // Atomic stock check, decrement, audit insert, and order creation
    const { order } = await getDb().transaction(async (tx) => {
      // Lock medicine rows and verify sufficient stock
      for (const item of orderItemsToInsert) {
        const lockedMedRows = await tx.execute(
          sql`SELECT id, name, stock_quantity as "stockQuantity" FROM ${medicines} WHERE id = ${item.medicineId} FOR UPDATE`
        );

        if (!lockedMedRows.rows || lockedMedRows.rows.length === 0) {
          throw new NotFoundError(`Medicine ${item.medicineId}`);
        }

        const medRow = lockedMedRows.rows[0] as { id: string; name: string; stockQuantity: number };
        if (medRow.stockQuantity < item.quantity) {
          throw new ConflictError(
            `Insufficient stock for medicine '${medRow.name}'. Available: ${medRow.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        await tx
          .update(medicines)
          .set({
            stockQuantity: sql`${medicines.stockQuantity} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(medicines.id, item.medicineId));
      }

      if (auditLogsToInsert.length > 0) {
        await tx.insert(prescriptionReconciliationAudit).values(auditLogsToInsert);
      }

      const [newOrder] = await tx
        .insert(pharmacyOrders)
        .values({
          prescriptionId: prescriptionId || null,
          patientId,
          pharmacistId,
          totalAmount,
          deliveryAddress,
          status: "pending_payment",
          razorpayOrderId: rzpOrderId,
        })
        .returning();

      const itemsData = orderItemsToInsert.map(i => ({
        orderId: newOrder.id,
        ...i,
      }));
      await tx.insert(pharmacyOrderItems).values(itemsData);

      return { order: newOrder };
    });

    res.status(201).json({ 
      order,
      razorpayOrderId: rzpOrderId,
      amount: rzpAmount,
      currency: rzpCurrency,
      message: "Pharmacy order created successfully" 
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      throw err;
    }
    logger.error({ err }, "Failed to create pharmacy order");
    res.status(500).json({ error: "Failed to create order" });
  }
});

// PATCH /pharmacy/orders/:orderId/dispense
router.patch("/orders/:orderId/dispense", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const { uid } = res.locals.user;
    
    const userRows = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, uid)).limit(1);
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }

    const pharmacistRows = await getDb()
      .select({ id: pharmacists.id })
      .from(pharmacists)
      .where(eq(pharmacists.userId, userRows[0].id))
      .limit(1);

    if (pharmacistRows.length === 0) {
      throw new ForbiddenError("Only pharmacists can dispense orders");
    }
    const pharmacistId = pharmacistRows[0].id;

    const idToUpdate = orderId as string;
    const orderRows = await getDb()
      .select()
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.id, idToUpdate))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundError("Order not found");
    }

    const order = orderRows[0];
    if (order.pharmacistId !== pharmacistId) {
      throw new ForbiddenError("Not authorized to dispense this order");
    }

    await getDb().transaction(async (tx) => {
      // Update order status
      await tx.update(pharmacyOrders)
        .set({ status: "processing" })
        .where(eq(pharmacyOrders.id, idToUpdate));

      // Log to dispense audit
      await tx.insert(pharmacyDispenseAudit)
        .values({
          orderId,
          pharmacistId,
        });
    });

    res.json({ success: true, message: "Order dispensed successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to dispense order");
    res.status(500).json({ error: "Failed to dispense order" });
  }
});

// POST /pharmacy/complaints
router.post("/complaints", authenticate, validateBody(fileComplaintSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, issueDescription } = req.body;
    const { uid } = res.locals.user;

    if (!orderId || !issueDescription) {
      throw new ValidationError("orderId and issueDescription are required");
    }

    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }
    const patientId = userRows[0].id;

    const orderRows = await getDb()
      .select()
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.id, orderId))
      .limit(1);

    if (orderRows.length === 0) {
      throw new NotFoundError("Order not found");
    }

    if (orderRows[0].patientId !== patientId) {
      throw new ForbiddenError("Not authorized to file complaint for this order");
    }

    await getDb().insert(orderComplaints).values({
      orderId,
      patientId,
      issueDescription,
      status: "open"
    });

    res.status(201).json({ success: true, message: "Complaint filed successfully" });
  } catch (error) {
    logger.error({ error }, "Failed to file complaint");
    res.status(500).json({ error: "Failed to file complaint" });
  }
});

// POST /pharmacy/orders/:orderId/verify-payment
router.post("/orders/:orderId/verify-payment", authenticate, validateBody(verifyPaymentSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.orderId as string;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    const { uid } = res.locals.user;
    
    // Check if user is patient
    const userRows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);
      
    if (userRows.length === 0) {
      throw new UnauthorizedError("User not found");
    }
    
    const patientRows = await getDb()
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.userId, userRows[0].id))
      .limit(1);
      
    if (patientRows.length === 0) {
      throw new ForbiddenError("Only patients can verify payments");
    }

    const orderRows = await getDb()
      .select()
      .from(pharmacyOrders)
      .where(eq(pharmacyOrders.id, orderId))
      .limit(1);
      
    if (orderRows.length === 0) {
      throw new NotFoundError("Order not found");
    }

    if (orderRows[0].patientId !== patientRows[0].id) {
      throw new ForbiddenError("Not authorized to verify payment for this order");
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isTestBypass = process.env.NODE_ENV !== "production" && process.env.TEST_BYPASS_AUTH === "true";

    if (secret) {
      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigBuffer = Buffer.from(razorpay_signature || "", "utf8");
      const genBuffer = Buffer.from(generated_signature, "utf8");

      if (sigBuffer.length !== genBuffer.length || !crypto.timingSafeEqual(sigBuffer, genBuffer)) {
        throw new ForbiddenError("Invalid payment signature");
      }
    } else if (!isTestBypass) {
      throw new ForbiddenError("Payment gateway configuration missing");
    }

    // Update order status
    await getDb()
      .update(pharmacyOrders)
      .set({ 
        status: "paid",
        razorpayPaymentId: razorpay_payment_id,
        updatedAt: new Date(),
      })
      .where(eq(pharmacyOrders.id, orderId));

    logger.info({ orderId, paymentId: razorpay_payment_id }, "Pharmacy order payment verified successfully");

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (err: any) {
    logger.error({ err, orderId: req.params.orderId }, "Failed to verify payment");
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;
