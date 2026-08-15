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

import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import { createServer } from "./server";
import { closeDatabasePool, verifyDatabaseConnection } from "./postgres";
import { getFirebaseAdmin } from "./firebase";
import { getDb } from "./db";
import { users, encounters, appointments } from "./db/schema";
import { eq } from "drizzle-orm";
import { startReminderCron } from "./cron/reminders";
import { initSocketServer } from "./socket/server";

// Start reminder cron
startReminderCron();

// Routes are mounted inside server.ts (createServer)

const port = parseInt(process.env.PORT ?? "3000", 10);
const app = createServer();
const httpServer = createHttpServer(app);

// Socket.io WebRTC Signalling Server
const io = initSocketServer(httpServer);

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

  socket.on("ring-patient", async ({ encounterId }) => {
    try {
      if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
      
      const db = getDb();
      const encounterResult = await db.select().from(encounters).where(eq(encounters.id, encounterId)).limit(1);
      if (!encounterResult.length) return;
      
      const apptResult = await db.select().from(appointments).where(eq(appointments.id, encounterResult[0].appointmentId)).limit(1);
      if (!apptResult.length) return;
      
      const appt = apptResult[0];
      const patientId = appt.patientId;
      
      const docResult = await db.select().from(users).where(eq(users.id, appt.doctorId)).limit(1);
      const doctorName = docResult.length && docResult[0].displayName ? docResult[0].displayName : 'Your Doctor';

      io.to(`user_${patientId}`).emit("incoming-call", {
        encounterId,
        doctorName
      });
    } catch (e) {
      console.error("Error ringing patient:", e);
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

  // ─── Google Meet / Zoom In-Meeting Signaling Events ──────────────────────────

  // Recording Status Broadcast (Local / Cloud)
  socket.on("recording-status", ({ encounterId, isRecording, startedBy, type }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("recording-status", { isRecording, startedBy, type, timestamp: new Date().toISOString() });
  });

  // Screen Share Notification
  socket.on("screen-share-toggle", ({ encounterId, isSharing, participantId, participantName }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("screen-share-toggle", { isSharing, participantId, participantName });
  });

  // Raise / Lower Hand
  socket.on("raise-hand", ({ encounterId, isRaised, participantId, participantName }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("raise-hand", { isRaised, participantId, participantName, timestamp: new Date().toISOString() });
  });

  // Floating Emoji Reactions (👍, ❤️, 👏, 🎉, 💡, 😂, etc.)
  socket.on("emoji-reaction", ({ encounterId, emoji, participantName }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    io.to(encounterId).emit("emoji-reaction", { emoji, participantName, id: Math.random().toString(36).substring(7) });
  });

  // Collaborative Whiteboard - Draw Stroke
  socket.on("whiteboard-draw", ({ encounterId, stroke }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("whiteboard-draw", { stroke });
  });

  // Collaborative Whiteboard - Clear Canvas
  socket.on("whiteboard-clear", ({ encounterId }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("whiteboard-clear");
  });

  // Host Control - Mute Remote Participant
  socket.on("mute-participant", ({ encounterId, targetParticipantId, muteType }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("mute-participant", { targetParticipantId, muteType });
  });

  // Host Control - End Meeting For All
  socket.on("end-meeting-all", ({ encounterId, reason }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    io.to(encounterId).emit("end-meeting-all", { reason: reason || "Doctor ended the consultation session" });
  });

  // Participant Audio/Video State Broadcast
  socket.on("media-state-change", ({ encounterId, isAudioMuted, isVideoOff, participantId }) => {
    if (!socket.data.joinedEncounters.has(encounterId)) return socket.emit("error", "Unauthorized");
    socket.to(encounterId).emit("media-state-change", { isAudioMuted, isVideoOff, participantId });
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
