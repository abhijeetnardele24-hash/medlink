import { Router, type Request, type Response } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/credentials", authenticate, async (req: Request, res: Response) => {
  try {
    let servers: any[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];

    const keyId = process.env.CLOUDFLARE_TURN_KEY_ID;
    const apiToken = process.env.CLOUDFLARE_TURN_API_TOKEN;

    if (keyId && apiToken) {
      const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate-ice-servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({ ttl: 86400 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.iceServers) {
          // We can append or replace; Cloudflare typically returns STUN and TURN UDP/TCP/TLS
          // To ensure Google STUN fallback remains, we merge them:
          servers = [...servers, ...data.iceServers];
        }
      } else {
        console.error("Cloudflare TURN API error:", await response.text());
      }
    }

    res.json({ iceServers: servers });
  } catch (err) {
    console.error("Error generating TURN credentials:", err);
    // Send fallback STUN servers rather than failing completely if TURN fails
    res.json({ iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]});
  }
});

export default router;
