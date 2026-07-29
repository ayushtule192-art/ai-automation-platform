import type { Response } from "express";
import { HttpStatus } from "../constants/http-status.js";
import type { ApiResponse } from "../types/index.js";

/** Send a standardized success JSON response */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatus.OK
): Response {
  const body: ApiResponse<T> = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}
