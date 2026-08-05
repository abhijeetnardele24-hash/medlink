/**
 * MedLink — Application error classes
 *
 * All API-level errors extend AppError. The global error handler in
 * server.ts checks instanceof AppError to decide how to respond.
 *
 * Error messages must never include PHI (patient health information),
 * raw database errors, or stack traces in production responses.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Restore prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — Request body or query params failed validation */
export class ValidationError extends AppError {
  constructor(message = "Invalid request data") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

/** 401 — Missing or invalid authentication token */
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/** 403 — Authenticated but not permitted */
export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

/** 404 — Resource does not exist */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

/** 409 — State conflict (stale version, double-booking, etc.) */
export class ConflictError extends AppError {
  constructor(message = "Request conflicts with current server state") {
    super(message, 409, "CONFLICT");
  }
}

/** 422 — Request is well-formed but violates business rules */
export class UnprocessableError extends AppError {
  constructor(message = "Request could not be processed") {
    super(message, 422, "UNPROCESSABLE");
  }
}
