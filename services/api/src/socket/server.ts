import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

let io: Server | null = null;

export function initSocketServer(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3001"],
      credentials: true,
    }
  });

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();

    pubClient.on("error", (err) => console.error("Redis Pub Client Error", err));
    subClient.on("error", (err) => console.error("Redis Sub Client Error", err));

    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis Adapter for Socket.IO initialized");
  } else {
    console.log("No REDIS_URL provided. Using in-memory adapter for Socket.IO");
  }

  return io;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
}
