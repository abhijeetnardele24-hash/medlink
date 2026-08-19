import { Server } from "socket.io";
import { createSocketRedisAdapter } from "../redis";
import { logger } from "../logger";

let io: Server | null = null;

export function setIo(serverInstance: Server): void {
  io = serverInstance;
}

export function getIo(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return io;
}
