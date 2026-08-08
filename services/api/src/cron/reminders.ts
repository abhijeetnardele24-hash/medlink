import { eq, and, isNull, lte } from "drizzle-orm";
import { getDb } from "../db";
import { reminderTasks, appointments, patients, doctors } from "../db/schema";
import { emitNotification } from "../socket/emitter";
import { logger } from "../logger";

export const startReminderCron = () => {
  logger.info("Starting reminder cron service...");

  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find due reminders that haven't been sent yet
      const dueReminders = await getDb()
        .select({
          reminder: reminderTasks,
          appointment: appointments,
          patient: patients,
        })
        .from(reminderTasks)
        .innerJoin(appointments, eq(appointments.id, reminderTasks.appointmentId))
        .innerJoin(patients, eq(patients.id, appointments.patientId))
        .where(
          and(
            eq(reminderTasks.outcome, "pending"),
            lte(reminderTasks.dueAt, now)
          )
        );

      for (const row of dueReminders) {
        const { reminder, appointment, patient } = row;
        
        try {
          if (reminder.taskType === "pre_appointment_patient") {
            await emitNotification(
              patient.userId,
              "appointment_reminder",
              "Appointment Reminder",
              `Reminder: You have an upcoming appointment scheduled for ${appointment.scheduledAt}`,
              { appointmentId: appointment.id }
            );
          } else if (reminder.taskType === "pre_appointment_doctor") {
             const doctorRows = await getDb().select({ userId: doctors.userId }).from(doctors).where(eq(doctors.id, appointment.doctorId)).limit(1);
             if (doctorRows[0]?.userId) {
                await emitNotification(
                  doctorRows[0].userId,
                  "appointment_reminder",
                  "Appointment Reminder",
                  `Reminder: You have an upcoming appointment scheduled for ${appointment.scheduledAt}`,
                  { appointmentId: appointment.id }
                );
             }
          }

          // Mark as sent
          await getDb()
            .update(reminderTasks)
            .set({ outcome: "attempted", resolvedAt: new Date() })
            .where(eq(reminderTasks.id, reminder.id));
            
          logger.info({ reminderId: reminder.id }, "Reminder sent successfully");
        } catch (innerErr) {
          logger.error({ err: innerErr, reminderId: reminder.id }, "Failed to send individual reminder");
        }
      }
    } catch (err) {
      logger.error({ err }, "Reminder cron check failed");
    }
  }, 60 * 1000); // run every 1 minute
};
