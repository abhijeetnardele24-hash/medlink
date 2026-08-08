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
import { authenticate } from "./middleware/auth";
import { requireRole } from "./middleware/requireRole";

export const createServer = (): Express => {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

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
    })
  );

  // ── Stricter limiter on auth endpoints ─────────────────────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Please wait 15 minutes." },
  });

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: "1mb" }));

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

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.use("/", healthRouter);
  app.use("/auth", authLimiter, authRouter);
  app.use("/doctors", doctorsRouter);
  app.use("/appointments", authenticate, appointmentsRouter);
  app.use("/encounters", authenticate, encountersRouter);
  app.use("/prescriptions", prescriptionsRouter); // Has own auth checks
  app.use("/recommendations", recommendationsRouter); // Can be called by unauthenticated users during search
  app.use("/admin", authenticate, requireRole("coordinator"), adminRouter);
  app.use("/webhooks", webhooksRouter);
  app.use("/webrtc", webrtcRouter);

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
