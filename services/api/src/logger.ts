/**
 * MedLink — Structured logger (Pino)
 *
 * Produces JSON logs in production (parseable by log aggregators)
 * and pretty-printed logs in development.
 *
 * IMPORTANT: Never log PHI (patient data, diagnoses, free-text
 * consultation content). Log only resource IDs, action names,
 * outcome codes, and timing.
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    // Rename 'msg' to 'message' for cleaner aggregator display
    messageKey: "message",
    // Add service name to every log line for multi-service log routing
    base: { service: "medlink-api" },
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact fields that may accidentally contain PHI if logged
    redact: {
      paths: [
        "body.password",
        "body.patientNotes",
        "body.instructionsText",
        "body.medicinesJson",
        "*.email",
      ],
      censor: "[REDACTED]",
    },
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      })
    : undefined
);
