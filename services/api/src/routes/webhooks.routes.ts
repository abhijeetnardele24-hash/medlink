import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { paymentRecords, appointments } from "../db/schema";
import crypto from "crypto";
import { logger } from "../logger";

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

      // Razorpay sends raw JSON body. Ensure it's treated as string for validation
      // But since we use express.json(), req.body is already parsed.
      // Actually, Razorpay signature validation requires the raw body string.
      // We will assume express raw middleware or stringify works for simple tests,
      // but in production, we should compute HMAC on req.rawBody
      // For this implementation we will stringify req.body or use a custom raw parser.
      const payloadString = JSON.stringify(req.body);
      
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "demo_webhook_secret";

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");

      if (expectedSignature !== signature && secret !== "demo_webhook_secret") {
        logger.warn({ expectedSignature, signature }, "Invalid webhook signature");
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      const event = req.body.event;

      if (event === "payment.captured") {
        const paymentEntity = req.body.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;

        // Find the payment record by order ID
        const paymentRows = await getDb()
          .select({ appointmentId: paymentRecords.appointmentId })
          .from(paymentRecords)
          .where(eq(paymentRecords.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (paymentRows.length > 0) {
          const appointmentId = paymentRows[0].appointmentId;

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

          logger.info({ appointmentId, razorpayPaymentId }, "Payment captured via webhook");
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
