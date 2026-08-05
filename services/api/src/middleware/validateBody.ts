/**
 * MedLink — Zod request body validation middleware factory
 *
 * Usage:
 *   import { z } from "zod";
 *   const schema = z.object({ name: z.string() });
 *   router.post('/thing', validateBody(schema), handler);
 *
 * Returns:
 *   400  – body does not match the schema, with a structured error list
 */

import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

export const validateBody =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        issues: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      });
      return;
    }

    // Replace req.body with the parsed (and coerced/stripped) value
    req.body = result.data;
    next();
  };
