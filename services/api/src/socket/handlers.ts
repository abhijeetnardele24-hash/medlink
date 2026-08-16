import { type Socket, type Server } from "socket.io";
import { logger } from "../logger";

export function registerWebRTCHandlers(io: Server, socket: Socket) {
  // Join a specific consultation room
  socket.on("join-encounter", (encounterId: string) => {
    socket.join(encounterId);
    logger.info({ encounterId, socketId: socket.id }, "User joined encounter");
    socket.to(encounterId).emit("user-connected", { socketId: socket.id });
  });

  socket.on("ring-patient", ({ encounterId }: { encounterId: string }) => {
    socket.to(encounterId).emit("ring-patient");
  });

  // WebRTC Offer
  socket.on("webrtc-offer", ({ encounterId, offer }: { encounterId: string; offer: any }) => {
    socket.to(encounterId).emit("webrtc-offer", { offer });
  });

  // WebRTC Answer
  socket.on("webrtc-answer", ({ encounterId, answer }: { encounterId: string; answer: any }) => {
    socket.to(encounterId).emit("webrtc-answer", { answer });
  });

  // ICE Candidate exchange
  socket.on("webrtc-ice-candidate", ({ encounterId, candidate }: { encounterId: string; candidate: any }) => {
    socket.to(encounterId).emit("webrtc-ice-candidate", { candidate });
  });

  // Interactive Tools
  socket.on("screen-share-toggle", ({ encounterId, isSharing }: { encounterId: string; isSharing: boolean }) => {
    socket.to(encounterId).emit("screen-share-toggle", { isSharing });
  });

  socket.on("raise-hand", ({ encounterId, isRaised, participantName }: { encounterId: string; isRaised: boolean; participantName: string }) => {
    socket.to(encounterId).emit("raise-hand", { isRaised, participantName });
  });

  socket.on("emoji-reaction", ({ encounterId, emoji, participantName, userId }: { encounterId: string; emoji: string; participantName: string; userId?: string }) => {
    socket.to(encounterId).emit("emoji-reaction", { emoji, participantName, id: crypto.randomUUID(), userId });
  });

  socket.on("whiteboard-draw", ({ encounterId, stroke }: { encounterId: string; stroke: any }) => {
    socket.to(encounterId).emit("whiteboard-draw", { stroke });
  });

  socket.on("whiteboard-clear", ({ encounterId }: { encounterId: string }) => {
    socket.to(encounterId).emit("whiteboard-clear");
  });

  // Host/Media controls
  socket.on("media-state-change", ({ encounterId, isAudioMuted, isVideoOff }: { encounterId: string; isAudioMuted: boolean; isVideoOff: boolean }) => {
    socket.to(encounterId).emit("media-state-change", { isAudioMuted, isVideoOff });
  });

  socket.on("mute-participant", ({ encounterId, muteType }: { encounterId: string; muteType: string }) => {
    socket.to(encounterId).emit("mute-participant", { muteType });
  });

  socket.on("end-meeting-all", ({ encounterId, reason }: { encounterId: string; reason: string }) => {
    socket.to(encounterId).emit("end-meeting-all", { reason });
  });
  
  socket.on("recording-status", ({ encounterId, isRecording, startedBy, type }: { encounterId: string; isRecording: boolean; startedBy: string; type: string }) => {
    socket.to(encounterId).emit("recording-status", { isRecording, startedBy, type });
  });

  // Chat
  socket.on("typing", ({ encounterId, isTyping, senderId }: { encounterId: string; isTyping: boolean; senderId: string }) => {
    socket.to(encounterId).emit("typing", { isTyping, senderId });
  });

  socket.on("message", ({ encounterId, message }: { encounterId: string; message: any }) => {
    // In a real app we'd save to DB here, but we'll broadcast for now
    socket.to(encounterId).emit("message", { message });
  });

  socket.on("message-reaction", ({ encounterId, messageId, emoji, userId }: { encounterId: string; messageId: string; emoji: string; userId: string }) => {
    socket.to(encounterId).emit("message-reaction", { messageId, emoji, userId });
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket disconnected");
  });
}
