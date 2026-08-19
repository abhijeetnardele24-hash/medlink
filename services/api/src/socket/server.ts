import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { registerWebRTCHandlers } from "./handlers";
import { logger } from "../logger";

let io: Server | null = null;

export function initSocketServer(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3001"],
      credentials: true,
    }
  });

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn("Socket.IO Redis Pub Client retry exhausted.");
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => logger.warn({ err: err.message }, "Socket.IO Redis Pub Client Error"));
    subClient.on("error", (err) => logger.warn({ err: err.message }, "Socket.IO Redis Sub Client Error"));

    pubClient.on("ready", () => {
      logger.info("Socket.IO Redis Pub Client connected");
    });
    subClient.on("ready", () => {
      logger.info("Socket.IO Redis Sub Client connected");
    });

    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Redis Adapter for Socket.IO initialized");
  } else {
    logger.info("No REDIS_URL provided. Using in-memory adapter for Socket.IO");
  }

  // Handle client connections
  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "New Socket.IO connection established");

    // Register WebRTC signaling handlers
    registerWebRTCHandlers(io!, socket);
  });

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
}
