import { Router, type Request, type Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { users } from "../db/schema";
import { getDb } from "../db";
import { notifications } from "../db/schema";
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

export { router as notificationsRouter };
