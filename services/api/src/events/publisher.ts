import { getRedisClient, isRedisAvailable } from "../redis";
import { logger } from "../logger";
import { sendEmail } from "../utils/resend";

export async function publishEvent(channel: string, payload: any): Promise<void> {
  const redis = getRedisClient();
  
  if (!redis || !isRedisAvailable()) {
    logger.warn({ channel }, "Redis unavailable. Executing event synchronously as fallback.");
    try {
      if (channel === "email:send") {
        await sendEmail(payload.to, payload.subject, payload.html);
      }
    } catch (e) {
      logger.error({ err: e }, "Fallback execution failed");
    }
    return;
  }

  try {
    const message = JSON.stringify(payload);
    await redis.publish(channel, message);
    logger.debug({ channel }, "Event published successfully");
  } catch (err) {
    logger.error({ err, channel }, "Failed to publish event to Redis");
  }
}
