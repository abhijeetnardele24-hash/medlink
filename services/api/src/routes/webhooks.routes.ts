import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paymentRecords, appointments, pharmacyOrders, patients } from "../db/schema";
import crypto from "crypto";
import { logger } from "../logger";
import { emitNotification } from "../socket/emitter";

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
      
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.TEST_BYPASS_AUTH === "true" ? "test_secret" : "");
      if (!secret) {
        logger.error("RAZORPAY_WEBHOOK_SECRET is not configured");
        res.status(500).json({ error: "Webhook secret not configured" });
        return;
      }

      const payloadString = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");

      if (expectedSignature !== signature) {
        logger.warn({ expectedSignature, signature }, "Invalid webhook signature");
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
            // Update payment record to success
            await getDb()
              .update(paymentRecords)
              .set({
                state: "success",
                razorpayPaymentId,
                updatedAt: new Date(),
              })
              .where(eq(paymentRecords.appointmentId, appointmentId));

            // Confirm the appointment
            await getDb()
              .update(appointments)
              .set({ status: "confirmed", updatedAt: new Date() })
              .where(eq(appointments.id, appointmentId));

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

            logger.info({ appointmentId, razorpayPaymentId }, "Appointment payment captured via webhook");
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
            await getDb()
              .update(pharmacyOrders)
              .set({
                status: "paid",
                razorpayPaymentId,
                updatedAt: new Date(),
              })
              .where(eq(pharmacyOrders.id, id));

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
