import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { AppError } from "../utils/errors/app.error.js";

/**
 * RBAC middleware — restricts access to users with one of the allowed roles.
 * Must be used after authenticate middleware.
 *
 * @example
 * router.get('/admin', authenticate, requireRoles('ADMIN'), handler);
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized("Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        AppError.forbidden(
          "You do not have permission to access this resource",
          "AUTH_INSUFFICIENT_ROLE"
        )
      );
      return;
    }

    next();
  };
}

/** Shorthand for admin-only routes */
export const requireAdmin = requireRoles("ADMIN");

/** Shorthand — allows both USER and ADMIN roles */
export const requireUser = requireRoles("USER", "ADMIN");
