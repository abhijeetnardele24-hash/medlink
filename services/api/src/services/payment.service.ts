import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { 
  paymentRecords, 
  appointments, 
  availabilitySlots, 
  pharmacyOrders, 
  patients, 
  pharmacyOrderItems, 
  medicines 
} from "../db/schema";
import { emitNotification } from "../socket/emitter";
import { releaseLock } from "../redis";
import { logger } from "../logger";

/**
 * Safely confirms a pharmacy order payment.
 * Decrements actual database stock exactly once.
 */
export async function confirmPharmacyOrder(orderId: string, razorpayPaymentId: string): Promise<void> {
  const pharmacyRows = await getDb()
    .select({ id: pharmacyOrders.id, status: pharmacyOrders.status })
    .from(pharmacyOrders)
    .where(eq(pharmacyOrders.id, orderId))
    .limit(1);

  if (pharmacyRows.length === 0) {
    logger.warn({ orderId }, "Confirm pharmacy order called on non-existent order");
    return;
  }

  const { status } = pharmacyRows[0];
  
  if (status !== "pending_payment") {
    logger.info({ orderId, status }, "Idempotent pharmacy payment confirm skip");
    return;
  }

  await getDb().transaction(async (tx) => {
    await tx
      .update(pharmacyOrders)
      .set({
        status: "paid",
        razorpayPaymentId,
        updatedAt: new Date(),
      })
      .where(eq(pharmacyOrders.id, orderId));
      
    // Fetch items to decrement real database stock exactly once
    const items = await tx.query.pharmacyOrderItems.findMany({
      where: eq(pharmacyOrderItems.orderId, orderId)
    });
    
    for (const item of items) {
      // Decrement actual stock
      await tx
        .update(medicines)
        .set({
          stockQuantity: sql`${medicines.stockQuantity} - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(medicines.id, item.medicineId));
        
      // Release temporary lock immediately so we don't have to wait 10 mins
      await releaseLock(`lock:inventory:${item.medicineId}`, orderId);
    }
  });

  // Notify patient
  const userRows = await getDb()
    .select({ userId: patients.userId })
    .from(pharmacyOrders)
    .innerJoin(patients, eq(patients.id, pharmacyOrders.patientId))
    .where(eq(pharmacyOrders.id, orderId))
    .limit(1);

  if (userRows[0]?.userId) {
    await emitNotification(
      userRows[0].userId,
      "payment_success",
      "Pharmacy Order Paid",
      "Your payment was successful and your pharmacy order is now processing.",
      { orderId }
    );
  }

  logger.info({ orderId, razorpayPaymentId }, "Pharmacy order payment successfully captured");
}

/**
 * Safely confirms an appointment payment.
 */
export async function confirmAppointmentPayment(appointmentId: string, razorpayPaymentId: string): Promise<void> {
  const paymentRows = await getDb()
    .select({ appointmentId: paymentRecords.appointmentId, state: paymentRecords.state })
    .from(paymentRecords)
    .where(eq(paymentRecords.appointmentId, appointmentId))
    .limit(1);

  if (paymentRows.length === 0) {
    logger.warn({ appointmentId }, "Confirm appointment payment called on non-existent record");
    return;
  }

  const { state } = paymentRows[0];
  
  if (state === "success") {
    logger.info({ appointmentId }, "Idempotent appointment payment confirm skip");
    return;
  }

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

  logger.info({ appointmentId, razorpayPaymentId }, "Appointment payment successfully captured");
}
