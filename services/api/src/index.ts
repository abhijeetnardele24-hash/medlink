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
import { getFirebaseAdmin } from "./firebase";
import { getDb } from "./db";
import { users, encounters, appointments } from "./db/schema";
import { eq } from "drizzle-orm";
import { startReminderCron } from "./cron/reminders";

// Start reminder cron
startReminderCron();

// Routes are mounted inside server.ts (createServer)

const port = parseInt(process.env.PORT ?? "3000", 10);
const app = createServer();
const httpServer = createHttpServer(app);

// Socket.io WebRTC Signalling Server
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()) : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3001"],
    credentials: true,
  }
});

io.use(async (socket, next) => {
  if (process.env.TEST_BYPASS_AUTH === "true") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: TEST_BYPASS_AUTH is active in production environment");
    }
    socket.data.userId = socket.handshake.headers["x-user-id"] || "test-id";
    socket.data.joinedEncounters = new Set<string>();
    return next();
  }

  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: No token provided"));
  
  try {
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(token);
    const db = getDb();
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, decodedToken.uid)).limit(1);
    
    if (!userResult.length) return next(new Error("Authentication error: User not found in DB"));
    
    socket.data.userId = userResult[0].id;
    socket.data.joinedEncounters = new Set<string>();
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Connected: ${socket.id}, User: ${socket.data.userId}`);
  
  // Join user's personal room for notifications
  socket.join(`user_${socket.data.userId}`);
  
  socket.on("join-encounter", async (encounterId: string) => {
    try {
      const db = getDb();
      const encounterResult = await db.select().from(encounters).where(eq(encounters.id, encounterId)).limit(1);
      if (!encounterResult.length) return socket.emit("error", "Encounter not found");
      
      const apptResult = await db.select().from(appointments).where(eq(appointments.id, encounterResult[0].appointmentId)).limit(1);
      if (!apptResult.length) return socket.emit("error", "Appointment not found");
      
      const appt = apptResult[0];
      if (appt.patientId !== socket.data.userId && appt.doctorId !== socket.data.userId) {
        return socket.emit("error", "Unauthorized to join this encounter");
      }
      
      socket.join(encounterId);
      socket.data.joinedEncounters.add(encounterId);
      console.log(`[Socket.io] ${socket.id} joined encounter room: ${encounterId}`);
    } catch (e) {
      console.error(e);
      socket.emit("error", "Internal server error during join");
    }
  });

  socket.on("webrtc-offer", ({ encounterId, offer }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ encounterId, answer }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ encounterId, candidate }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("webrtc-ice-candidate", { candidate });
  });

  socket.on("message", ({ encounterId, message }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("message", { message });
  });

  socket.on("typing", ({ encounterId, isTyping, senderId }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("typing", { isTyping, senderId });
  });

  socket.on("read-receipt", ({ encounterId, messageId, readerId }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("read-receipt", { messageId, readerId });
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
