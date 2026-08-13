import { type Socket, type Server } from "socket.io";
import { logger } from "../logger";

/**
 * Attaches WebRTC signaling event handlers to the given socket connection.
 * @param io - The Socket.IO server instance
 * @param socket - The connected client socket
 */
export function registerWebRTCHandlers(io: Server, socket: Socket) {
  // Join a specific consultation room
  socket.on("join-room", (roomId: string, userId: string) => {
    socket.join(roomId);
    logger.info({ roomId, socketId: socket.id, userId }, "User joined room");

    // Notify others in the room that a user has joined
    socket.to(roomId).emit("user-connected", userId);
  });

  // WebRTC Offer
  socket.on("webrtc-offer", (roomId: string, offer: any) => {
    logger.debug({ roomId, socketId: socket.id }, "Received WebRTC offer");
    // Broadcast the offer to everyone else in the room
    socket.to(roomId).emit("webrtc-offer", offer);
  });

  // WebRTC Answer
  socket.on("webrtc-answer", (roomId: string, answer: any) => {
    logger.debug({ roomId, socketId: socket.id }, "Received WebRTC answer");
    // Broadcast the answer to everyone else in the room
    socket.to(roomId).emit("webrtc-answer", answer);
  });

  // ICE Candidate exchange
  socket.on("webrtc-ice-candidate", (roomId: string, candidate: any) => {
    logger.debug({ roomId, socketId: socket.id }, "Received ICE candidate");
    socket.to(roomId).emit("webrtc-ice-candidate", candidate);
  });

  // Disconnect handling
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Socket disconnected");
    // socket.io automatically leaves all rooms upon disconnect.
  });
}
