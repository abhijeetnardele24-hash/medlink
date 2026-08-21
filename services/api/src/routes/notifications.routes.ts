import { Router, type Request, type Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { users, pushSubscriptions, notifications } from "../db/schema";
import { getDb } from "../db";
import { authenticate } from "../middleware/auth";
import { NotFoundError } from "../errors";

const router = Router();

// GET /notifications - Get all notifications for the authenticated user
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const firebaseUid = res.locals.user?.uid;
  if (!firebaseUid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userRecord = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  if (userRecord.length === 0) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = userRecord[0].id;

  const userNotifications = await getDb()
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  res.json(userNotifications);
});

// PATCH /notifications/:id/read - Mark a notification as read
router.patch("/:id/read", authenticate, async (req: Request, res: Response): Promise<void> => {
  const firebaseUid = res.locals.user?.uid;
  const id = req.params.id as string;

  if (!firebaseUid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const userRecord = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  if (userRecord.length === 0) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = userRecord[0].id;

  const [notification] = await getDb()
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  res.json(notification);
});

// POST /notifications/subscribe - Subscribe to web push notifications
router.post("/subscribe", authenticate, async (req: Request, res: Response): Promise<void> => {
  const firebaseUid = res.locals.user?.uid;
  if (!firebaseUid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    res.status(400).json({ error: "Invalid subscription object" });
    return;
  }

  const userRecord = await getDb().select({ id: users.id }).from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
  if (userRecord.length === 0) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = userRecord[0].id;

  // Save or update subscription
  await getDb()
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

  res.status(201).json({ success: true });
});

export { router as notificationsRouter };
