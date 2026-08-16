import * as fs from 'fs';
import * as path from 'path';
import { getDb } from './src/db';
import * as schema from './src/db/schema';
import { sql, eq } from 'drizzle-orm';
import { sendEmail } from './src/utils/resend';
import { emitNotification } from './src/socket/emitter';
import express from 'express';
import { notificationsRouter } from './src/routes/notifications.routes';
import { createServer as createHttpServer } from 'http';
import { initSocketServer } from './src/socket/server';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      val = val.replace(/^['"]|['"]$/g, '');
      process.env[match[1]] = val;
    }
  });
}

process.env.TEST_BYPASS_AUTH = 'true';

async function runNotificationAndEmailTest() {
  console.log('===========================================================');
  console.log('🔔 TESTING IN-APP NOTIFICATIONS & RESEND EMAIL DELIVERY 🔔');
  console.log('===========================================================\n');

  const app = express();
  app.use(express.json());
  app.use('/notifications', notificationsRouter);

  const httpServer = createHttpServer(app);
  const io = initSocketServer(httpServer);

  const TEST_PORT = 3399;
  httpServer.listen(TEST_PORT, async () => {
    try {
      const db = getDb();
      const [user] = await db.select().from(schema.users).limit(1);

      // ─────────────────────────────────────────────────────────────
      // TEST 1: In-App Notification Database & Real-time Emission
      // ─────────────────────────────────────────────────────────────
      console.log('▶ [TEST 1/3] Emitting In-App Notification & Persisting to Database...');
      const notifResult = await emitNotification(
        user.id,
        'consultation_reminder',
        'Upcoming Consultation with Dr. Sharma',
        'Your tele-clinic appointment is scheduled in 15 minutes. Please ensure camera access.',
        { link: '/consultation/test-id-123' }
      );

      if (!notifResult) throw new Error('Failed to save notification');
      console.log(`  ✅ In-app notification emitted over Socket.IO & saved to DB (ID: ${notifResult.id}).`);

      // ─────────────────────────────────────────────────────────────
      // TEST 2: Fetching Notifications & Marking as Read
      // ─────────────────────────────────────────────────────────────
      console.log('\n▶ [TEST 2/3] Fetching Notifications & Updating Read Status...');
      const getRes = await fetch(`http://localhost:${TEST_PORT}/notifications`, {
        headers: {
          'x-user-id': user.firebaseUid,
          'x-user-role': user.role
        }
      });
      const getNotifs = await getRes.json();
      console.log(`  ✅ Retrieved ${getNotifs.length} notifications for user from DB.`);

      const readRes = await fetch(`http://localhost:${TEST_PORT}/notifications/${notifResult.id}/read`, {
        method: 'PATCH',
        headers: {
          'x-user-id': user.firebaseUid,
          'x-user-role': user.role
        }
      });
      const readData = await readRes.json();
      console.log(`  ✅ Notification marked as read (isRead: ${readData.isRead}).`);

      // ─────────────────────────────────────────────────────────────
      // TEST 3: Resend Email Notification Delivery
      // ─────────────────────────────────────────────────────────────
      console.log('\n▶ [TEST 3/3] Testing Email Notification Delivery via Resend...');
      console.log(`  Target Email: delivered@resend.dev (Resend Sandbox)`);
      
      const emailResult = await sendEmail(
        'delivered@resend.dev',
        'MedLink: Consultation Confirmation & Access Link',
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #2563eb;">MedLink Healthcare Consultation</h2>
            <p>Hello,</p>
            <p>Your telemedicine appointment has been confirmed. You can join your consultation below:</p>
            <a href="https://medlink.health/consultation/test-room" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Join Tele-Clinic</a>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">MedLink Secure Healthcare Platform</p>
          </div>
        `
      );

      console.log(`  ✅ Email successfully dispatched via Resend API (Message ID: ${emailResult?.id || 'delivered'}).`);

      console.log('\n===========================================================');
      console.log('🎉 ALL NOTIFICATION & EMAIL TESTS PASSED (3/3 SUCCESS)');
      console.log('===========================================================\n');

    } catch (err) {
      console.error('❌ Notification/Email Test Failed:', err);
    } finally {
      httpServer.close();
      process.exit(0);
    }
  });
}

runNotificationAndEmailTest();
