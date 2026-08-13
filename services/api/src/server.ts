/**
 * MedLink — Express application factory
 *
 * Wires all middleware and routes. Responsibilities:
 * - Security: Helmet (HTTP headers), CORS, rate limiting
 * - Body parsing: JSON with a 1 MB limit to prevent large payloads
 * - Request logging: Pino request logger
 * - Routes: health, auth, doctors, appointments
 * - Error handling: global error handler that maps AppError subclasses
 *   to the correct HTTP status; never leaks stack traces in production
 */

import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "./logger";
import { AppError } from "./errors";
import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import doctorsRouter from "./routes/doctors.routes";
import appointmentsRouter from "./routes/appointments.routes";
import adminRouter from "./routes/admin.routes";
import encountersRouter from "./routes/encounters.routes";
import recommendationsRouter from "./routes/recommendations.routes";
import prescriptionsRouter from "./routes/prescriptions.routes";
import webhooksRouter from "./routes/webhooks.routes";
import webrtcRouter from "./routes/webrtc.routes";
import consentsRouter from "./routes/consents.routes";
import medicinesRouter from "./routes/medicines.routes";
import pharmacyRouter from "./routes/pharmacy.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import syncRouter from "./routes/sync.routes";
import patientsRouter from "./routes/patients.routes";
import { authenticate } from "./middleware/auth";
import { requireRole } from "./middleware/requireRole";

import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";

export function createServer(): Express {
  const app = express();

  // ── Redis Setup (Optional) ──────────────────────────────────────────────────
  let redisClient: Redis | undefined;
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on("error", (err) => logger.warn({ err }, "Redis connection error (rate limit)"));
  }

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://apis.google.com"],
        connectSrc: [
          "'self'", 
          "https://api.razorpay.com", 
          "https://checkout.razorpay.com", 
          "https://identitytoolkit.googleapis.com", 
          "https://securetoken.googleapis.com", 
          "wss://*", 
          "ws://*"
        ],
        frameSrc: ["'self'", "https://checkout.razorpay.com", "https://medlink-3de43.firebaseapp.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://checkout.razorpay.com"],
      }
    }
  }));

  // ── CORS — restrict to known origins in production ──────────────────────────
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3001"]; // dev defaults

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${origin}' not allowed`));
        }
      },
      credentials: true,
    })
  );

  // ── Global rate limiter — 100 req/min per IP ────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests. Please try again in a minute." },
      ...(redisClient && { store: new RedisStore({ sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)) as any }) }),
    })
  );

  // ── Stricter limiter on auth endpoints ─────────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Please wait 15 minutes." },
    ...(redisClient && { store: new RedisStore({ sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)) as any, prefix: "rl:auth:" }) }),
  });

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));

  // ── Request logging (logs path + status; no PHI) ───────────────────────────
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - start,
        },
        "request"
      );
    });
    next();
  });

  // ── Routes ───────────────────────────────────────────────────────────────────
  const v1Router = express.Router();
  v1Router.use("/auth", authLimiter, authRouter);
  v1Router.use("/doctors", doctorsRouter);
  v1Router.use("/appointments", authenticate, appointmentsRouter);
  v1Router.use("/encounters", authenticate, encountersRouter);
  v1Router.use("/patients", patientsRouter);
  v1Router.use("/prescriptions", prescriptionsRouter); // Has own auth checks
  v1Router.use("/recommendations", recommendationsRouter); // Can be called by unauthenticated users during search
  v1Router.use("/admin", authenticate, requireRole("coordinator"), adminRouter);
  v1Router.use("/webrtc", webrtcRouter);
  v1Router.use("/consents", authenticate, consentsRouter);
  v1Router.use("/medicines", medicinesRouter);
  v1Router.use("/pharmacy/orders", pharmacyRouter);
  v1Router.use("/notifications", notificationsRouter);
  v1Router.use("/sync", syncRouter);

  // Mount unversioned external webhooks and health probes
  app.use("/", healthRouter);
  app.use("/webhooks", webhooksRouter);

  // Mount v1 API
  app.use("/v1", v1Router);

  // ── 404 handler ─────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
  });

  // ── Global error handler ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      // Known API errors — safe to return to client
      if (err.statusCode >= 500) {
        logger.error({ err, code: err.code }, "Application error");
      } else {
        logger.warn({ message: err.message, code: err.code }, "Client error");
      }
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    // Unknown errors — log full detail server-side; return generic message
    logger.error({ err }, "Unhandled error");
    res.status(500).json({
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    });
  });

  return app;
};
