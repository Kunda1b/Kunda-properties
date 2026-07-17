export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational = true;
  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message); this.statusCode = statusCode; this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;
  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 422, "VALIDATION_ERROR"); this.errors = errors;
  }
}
export class NotFoundError extends AppError {
  constructor(resource = "Resource") { super(`${resource} not found`, 404, "NOT_FOUND"); }
}
