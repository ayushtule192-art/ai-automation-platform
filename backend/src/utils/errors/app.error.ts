import { HttpStatus } from "../../constants/http-status.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
    code: string = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): AppError {
    return new AppError(message, HttpStatus.BAD_REQUEST, code, details);
  }

  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): AppError {
    return new AppError(message, HttpStatus.UNAUTHORIZED, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN"): AppError {
    return new AppError(message, HttpStatus.FORBIDDEN, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
    return new AppError(message, HttpStatus.NOT_FOUND, code);
  }

  static conflict(message: string, code = "CONFLICT"): AppError {
    return new AppError(message, HttpStatus.CONFLICT, code);
  }

  static tooManyRequests(message = "Too many requests", code = "RATE_LIMIT"): AppError {
    return new AppError(message, HttpStatus.TOO_MANY_REQUESTS, code);
  }
}
