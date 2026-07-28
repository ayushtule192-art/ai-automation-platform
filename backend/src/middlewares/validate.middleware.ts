import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { HttpStatus } from "../constants/http-status.js";
import { AppError } from "../utils/errors/app.error.js";

type RequestProperty = "body" | "query" | "params";

/**
 * Validates request body, query, or params against a Zod schema.
 * Parsed data replaces the original property on the request object.
 */
export function validate(schema: ZodSchema, property: RequestProperty = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[property]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      (req as any)[property] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            "Validation failed",
            HttpStatus.UNPROCESSABLE_ENTITY,
            "VALIDATION_ERROR",
            error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            }))
          )
        );
        return;
      }
      next(error);
    }
  };
}
