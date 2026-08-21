import webpush from "web-push";
import { getDb } from "../db";
import { pushSubscriptions } from "../db/schema";
import { eq } from "drizzle-orm";

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@medlink.app";

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(vapidSubject, publicVapidKey, privateVapidKey);
} else {
  console.warn("VAPID keys are not configured. Web push notifications will not work.");
}

export const sendPushNotification = async (userId: string, payload: any) => {
  if (!publicVapidKey || !privateVapidKey) return;

  const subscriptions = await getDb()
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const promises = subscriptions.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    } catch (error: any) {
      console.error(`Failed to send push notification to ${sub.endpoint}:`, error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, delete it
        await getDb().delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
      }
    }
  });

  await Promise.allSettled(promises);
};
