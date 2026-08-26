import * as fs from 'fs';
import * as path from 'path';

// Ensure .env is loaded before anything else
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line: string) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { getRedisClient, isRedisAvailable } from "./redis";
import { logger } from "./logger";
import { sendEmail } from "./utils/resend";

async function startWorker() {
  logger.info("Starting Background Worker...");

  // Wait for redis to connect
  let attempts = 0;
  while (!isRedisAvailable() && attempts < 10) {
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }

  const redis = getRedisClient();
  if (!redis || !isRedisAvailable()) {
    logger.error("Redis is not available. Worker cannot start.");
    process.exit(1);
  }

  // Create a dedicated subscriber client
  const subscriber = redis.duplicate();

  subscriber.on("error", (err) => {
    logger.error({ err }, "Redis Subscriber Error");
  });

  subscriber.subscribe("email:send", (err, count) => {
    if (err) {
      logger.error({ err }, "Failed to subscribe to channels");
      return;
    }
    logger.info(`Worker subscribed to ${count} channels.`);
  });

  subscriber.on("message", async (channel, message) => {
    logger.info({ channel }, "Received job");
    try {
      if (channel === "email:send") {
        const payload = JSON.parse(message);
        await handleEmailJob(payload);
      }
    } catch (err) {
      logger.error({ err, channel, message }, "Failed to process job");
    }
  });
}

async function handleEmailJob(payload: any) {
  const { to, subject, html } = payload;
  if (!to || !subject || !html) {
    logger.warn("Invalid email job payload");
    return;
  }
  
  logger.info({ to, subject }, "Processing email job");
  try {
    await sendEmail(to, subject, html);
    logger.info({ to }, "Email job completed successfully");
  } catch (err) {
    logger.error({ err, to }, "Email job failed");
  }
}

startWorker();
