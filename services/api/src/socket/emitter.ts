import { io } from "../index";
import { getDb } from "../db";
import { notifications } from "../db/schema";

export async function emitNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata?: any
) {
  try {
    // 1. Save to database
    const [savedNotification] = await getDb()
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        metadataJson: metadata || null,
      })
      .returning();

    // 2. Emit via socket.io
    io.to(`user_${userId}`).emit("notification", savedNotification);
    
    return savedNotification;
  } catch (error) {
    console.error(`Failed to emit notification to ${userId}:`, error);
  }
}
