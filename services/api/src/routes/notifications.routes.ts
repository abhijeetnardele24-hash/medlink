import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { notifications } from "../db/schema";
import { authenticate } from "../middleware/auth";
import { NotFoundError } from "../errors";

const router = Router();

// GET /notifications - Get all notifications for the authenticated user
router.get("/", authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

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
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [notification] = await getDb()
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  // Ensure user owns the notification
  if (notification.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.json(notification);
});

export { router as notificationsRouter };
