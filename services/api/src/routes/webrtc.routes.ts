import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/credentials", authenticate, (req: Request, res: Response) => {
  const servers: any[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (process.env.TURN_URL && process.env.TURN_STATIC_AUTH_SECRET) {
    const secret = process.env.TURN_STATIC_AUTH_SECRET;
    // Expire in 24 hours (86400 seconds)
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    
    // User is attached by the authenticate middleware
    const userId = (req as any).user?.uid || 'anonymous';
    const turnUsername = `${expiry}:${userId}`;
    
    // Generate password via HMAC-SHA1
    const crypto = require("crypto");
    const turnPassword = crypto
      .createHmac("sha1", secret)
      .update(turnUsername)
      .digest("base64");

    servers.push({
      urls: process.env.TURN_URL,
      username: turnUsername,
      credential: turnPassword
    });
  }

  res.json({ iceServers: servers });
});

export default router;
