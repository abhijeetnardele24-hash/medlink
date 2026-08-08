import fs from "fs";
import path from "path";

// Ensure .env is loaded before anything else
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"]|['"]$/g, "");
      process.env[match[1]] = val;
    }
  });
}

import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { createServer } from "./server";
import { closeDatabasePool, verifyDatabaseConnection } from "./postgres";

// Routes are mounted inside server.ts (createServer)

const port = parseInt(process.env.PORT ?? "3000", 10);
const app = createServer();
const httpServer = createHttpServer(app);

// Socket.io WebRTC Signalling Server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3001"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Connected: ${socket.id}`);
  
  socket.on("join-encounter", (encounterId: string) => {
    socket.join(encounterId);
    console.log(`[Socket.io] ${socket.id} joined encounter room: ${encounterId}`);
  });

  socket.on("webrtc-offer", ({ encounterId, offer }) => {
    socket.to(encounterId).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ encounterId, answer }) => {
    socket.to(encounterId).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ encounterId, candidate }) => {
    socket.to(encounterId).emit("webrtc-ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`medlink-api listening on port ${port} (HTTP & WebSockets)`);
});

void verifyDatabaseConnection()
  .then(() => {
    console.log("postgres connection established");
  })
  .catch((error: unknown) => {
    console.error("postgres connection failed", error);
  });

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  try {
    await closeDatabasePool();
    console.log(`medlink-api closed database pool after ${signal}`);
    process.exit(0);
  } catch (error: unknown) {
    console.error("error while closing database pool", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
