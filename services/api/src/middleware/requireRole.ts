/**
 * MedLink — Role guard middleware
 *
 * Must be used AFTER the `authenticate` middleware, which populates
 * `res.locals.user`.
 *
 * Usage:
 *   router.post('/admin/thing', authenticate, requireRole('admin'), handler)
 *   router.post('/appointments', authenticate, requireRole('patient', 'doctor'), handler)
 *
 * Returns:
 *   403  – authenticated user does not have one of the allowed roles
 */

import type { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors";

export const requireRole = (...allowedRoles: string[]) =>
  (_req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.user;

    if (!user) {
      // Should never happen if requireRole is always after authenticate
      next(new ForbiddenError("No authenticated user in request context"));
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      next(
        new ForbiddenError(
          `Role '${user.role}' is not permitted for this action. Required: ${allowedRoles.join(" | ")}`
        )
      );
      return;
    }

    next();
  };
