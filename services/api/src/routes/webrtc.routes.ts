import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/credentials", authenticate, (req: Request, res: Response) => {
  const servers: any[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    servers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD
    });
  }

  res.json({ iceServers: servers });
});

export default router;
