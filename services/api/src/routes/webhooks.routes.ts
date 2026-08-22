import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paymentRecords, appointments, availabilitySlots, pharmacyOrders, patients, pharmacyOrderItems, medicines } from "../db/schema";
import crypto from "crypto";
import { logger } from "../logger";
import { confirmAppointmentPayment, confirmPharmacyOrder } from "../services/payment.service";

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
          await confirmAppointmentPayment(paymentRows[0].appointmentId, razorpayPaymentId);
        }

        // Check if it's a pharmacy order payment
        const pharmacyRows = await getDb()
          .select({ id: pharmacyOrders.id, status: pharmacyOrders.status })
          .from(pharmacyOrders)
          .where(eq(pharmacyOrders.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (pharmacyRows.length > 0) {
          await confirmPharmacyOrder(pharmacyRows[0].id, razorpayPaymentId);
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
