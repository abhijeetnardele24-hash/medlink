import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paymentRecords, appointments, availabilitySlots, pharmacyOrders, patients, pharmacyOrderItems, medicines } from "../db/schema";
import crypto from "crypto";
import { logger } from "../logger";
import { emitNotification } from "../socket/emitter";
import { releaseLock } from "../redis";
import { sql } from "drizzle-orm";

const router = Router();

// ─── POST /webhooks/razorpay ───────────────────────────────────────────────
// Validates the Razorpay signature and updates the payment and appointment
router.post(
  "/razorpay",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      if (!signature) {
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.TEST_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production" ? "test_secret" : "");
      if (!secret) {
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured");
        res.status(500).json({ error: "Webhook secret not configured" });
        return;
      }

      const rawBody = (req as any).rawBody 
        ? (req as any).rawBody.toString('utf8')
        : JSON.stringify(req.body);

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const sigBuf = Buffer.from(signature || "", "utf8");
      const expBuf = Buffer.from(expectedSignature, "utf8");

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        logger.warn("Invalid webhook signature");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      const event = req.body.event;

      if (event === "payment.captured") {
        const paymentEntity = req.body.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Check if it's an appointment payment
        const paymentRows = await getDb()
          .select({ appointmentId: paymentRecords.appointmentId, state: paymentRecords.state })
          .from(paymentRecords)
          .where(eq(paymentRecords.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (paymentRows.length > 0) {
          const { appointmentId, state } = paymentRows[0];
          
          if (state !== "success") {
            // Atomic transaction for paymentRecord, appointment status, and slot booking
            await getDb().transaction(async (tx) => {
              await tx
                .update(paymentRecords)
                .set({
                  state: "success",
                  razorpayPaymentId,
                  updatedAt: new Date(),
                })
                .where(eq(paymentRecords.appointmentId, appointmentId));

              const [appt] = await tx
                .update(appointments)
                .set({ status: "confirmed", updatedAt: new Date() })
                .where(eq(appointments.id, appointmentId))
                .returning();

              if (appt?.slotId) {
                await tx
                  .update(availabilitySlots)
                  .set({ status: "booked", updatedAt: new Date() })
                  .where(eq(availabilitySlots.id, appt.slotId));
              }
            });

            // Notify patient
            const userRows = await getDb()
              .select({ userId: patients.userId })
              .from(appointments)
              .innerJoin(patients, eq(patients.id, appointments.patientId))
              .where(eq(appointments.id, appointmentId))
              .limit(1);

            if (userRows[0]?.userId) {
              await emitNotification(
                userRows[0].userId,
                "payment_success",
                "Appointment Confirmed",
                "Your payment was successful and your appointment is confirmed.",
                { appointmentId }
              );
            }

            logger.info({ appointmentId, razorpayPaymentId }, "Appointment payment captured via webhook and slot booked");
          } else {
            logger.info({ appointmentId, razorpayPaymentId }, "Idempotent appointment webhook skip");
          }
        }

        // Check if it's a pharmacy order payment
        const pharmacyRows = await getDb()
          .select({ id: pharmacyOrders.id, status: pharmacyOrders.status })
          .from(pharmacyOrders)
          .where(eq(pharmacyOrders.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (pharmacyRows.length > 0) {
          const { id, status } = pharmacyRows[0];
          
          if (status === "pending_payment") {
            const orderId = id;
            await getDb().transaction(async (tx) => {
              await tx
                .update(pharmacyOrders)
                .set({
                  status: "paid",
                  razorpayPaymentId,
                  updatedAt: new Date(),
                })
                .where(eq(pharmacyOrders.id, orderId));
                
              // Fetch items to decrement stock
              const items = await tx.query.pharmacyOrderItems.findMany({
                where: eq(pharmacyOrderItems.orderId, orderId)
              });
              
              for (const item of items) {
                // Decrement actual stock
                await tx
                  .update(medicines)
                  .set({
                    stockQuantity: sql`${medicines.stockQuantity} - ${item.quantity}`
                  })
                  .where(eq(medicines.id, item.medicineId));
                  
                // Release temporary lock
                await releaseLock(`lock:inventory:${item.medicineId}`, orderId);
              }
            });

            // Notify patient
            const userRows = await getDb()
              .select({ userId: patients.userId })
              .from(pharmacyOrders)
              .innerJoin(patients, eq(patients.id, pharmacyOrders.patientId))
              .where(eq(pharmacyOrders.id, id))
              .limit(1);

            if (userRows[0]?.userId) {
              await emitNotification(
                userRows[0].userId,
                "payment_success",
                "Pharmacy Order Paid",
                "Your payment was successful and your pharmacy order is now processing.",
                { orderId: id }
              );
            }

            logger.info({ orderId: id, razorpayPaymentId }, "Pharmacy order payment captured via webhook");
          } else {
             logger.info({ orderId: id, razorpayPaymentId }, "Idempotent pharmacy webhook skip");
          }
        }
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      logger.error({ err }, "Webhook processing failed");
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

export default router;
