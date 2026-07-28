import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/http-status.js";
import { isDevelopment } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { AppError } from "../utils/errors/app.error.js";
import type { ApiErrorResponse } from "../types/index.js";

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found",
    },
  };
  res.status(HttpStatus.NOT_FOUND).json(body);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    };
    res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(body);
    return;
  }

  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
  });

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isDevelopment ? err.message : "An unexpected error occurred",
      ...(isDevelopment && { details: err.stack }),
    },
  };

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
}
